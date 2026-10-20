// Zyntry Code — VS Code extension.
//
// The missing half of the product: create/approve/run/stream tasks against the
// backend, ingest the current workspace as a repo snapshot, and serve as the
// *local* execution runner (fs + child_process in your workspace folder).
//
// Plain JS only: Node's built-in fetch, fs, path, child_process. No dependencies.

"use strict";

const vscode = require("vscode");
const fs = require("fs");
const fsp = require("fs/promises");
const path = require("path");
const { execFile } = require("child_process");

let output; // vscode.OutputChannel
let lastTaskId = null;
let runnerTimer = null;
let runnerRunning = false;
const RUNNER_ID = `vscode-${Math.random().toString(36).slice(2, 10)}`;
const workspaceTokens = new Map(); // workspaceId -> runner token
let extensionContext;

// ---------------------------------------------------------------------------
// helpers
// ---------------------------------------------------------------------------

function log(...args) {
  const line = args.map((a) => (typeof a === "string" ? a : JSON.stringify(a))).join(" ");
  output.appendLine(`[${new Date().toISOString()}] ${line}`);
}

function config() {
  return vscode.workspace.getConfiguration("zyntry");
}

function baseUrl() {
  const value = String(config().get("backendUrl", "http://localhost:8787")).replace(/\/+$/, "");
  const parsed = new URL(value);
  const local = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1" || parsed.hostname === "::1";
  if (parsed.protocol !== "https:" && !(local && parsed.protocol === "http:")) {
    throw new Error("backendUrl must use HTTPS (HTTP is permitted only for localhost)");
  }
  return value;
}

async function apiToken() {
  const stored = extensionContext?.secrets ? await extensionContext.secrets.get("zyntry.apiToken") : undefined;
  return stored || String(config().get("apiToken", ""));
}

async function api(method, p, body, headers = {}) {
  const h = { "Content-Type": "application/json", ...headers };
  const token = await apiToken();
  if (token) h["Authorization"] = `Bearer ${token}`;
  const resp = await fetch(`${baseUrl()}${p}`, {
    method,
    headers: h,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await resp.text();
  let data;
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { detail: text };
  }
  if (!resp.ok) {
    const err = new Error(`HTTP ${resp.status}: ${data.detail || text || resp.statusText}`);
    err.status = resp.status;
    throw err;
  }
  return data;
}

async function pickTaskId() {
  if (lastTaskId) return lastTaskId;
  const id = await vscode.window.showInputBox({ prompt: "Task id" });
  return id || undefined;
}

function summarizePlan(result) {
  const plan = result.plan || {};
  const stages = plan.stages || [];
  return [
    `task ${result.task.id} — status ${result.task.status}`,
    `plan "${plan.summary}" (${stages.length} stages, source=${plan.source})`,
    ...stages.map((s, i) => `  ${i + 1}. [${s.kind}] ${s.title}`),
  ].join("\n");
}

// ---------------------------------------------------------------------------
// task commands
// ---------------------------------------------------------------------------

async function createTask() {
  const prompt = await vscode.window.showInputBox({
    prompt: "Describe the engineering task",
    placeHolder: "Add role-based permissions to the admin API",
  });
  if (!prompt) return;

  try {
    const result = await api("POST", "/tasks", { prompt });
    lastTaskId = result.task.id;
    log("task created:", result.task.id, result.plan.summary);
    output.appendLine(summarizePlan(result));
    output.show();

    const requiresApproval = result.requires_approval;
    if (requiresApproval) {
      log("high-risk task: awaiting approval");
      const action = await vscode.window.showInformationMessage(
        `Task ${result.task.id} requires approval (risk ${result.assessment.risk_level}).`,
        "Approve & run",
        "Just approve",
        "Not now",
      );
      if (action === "Approve & run" || action === "Just approve") {
        await api("POST", `/tasks/${result.task.id}/approve`, {
          approved: true,
          auto_execute: action === "Approve & run",
        });
        log(action === "Approve & run" ? "approved + execution started" : "approved");
      }
    } else {
      const action = await vscode.window.showInformationMessage(
        `Task ${result.task.id} planned (${result.plan.stages.length} stages).`,
        "Run now",
        "Stream",
        "Not now",
      );
      if (action === "Run now") await runTask();
      if (action === "Stream") await streamTask();
    }
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: create task failed: ${err.message}`);
  }
}

async function approveTask() {
  const id = await pickTaskId();
  if (!id) return;
  const choice = await vscode.window.showQuickPick(
    [
      { label: "Approve", detail: "Mark planned; do not execute" },
      { label: "Approve & run", detail: "Mark planned and execute immediately" },
      { label: "Reject", detail: "Cancel the task" },
    ],
    { placeHolder: "Decision for this task" },
  );
  if (!choice) return;
  try {
    const approved = choice.label !== "Reject";
    const result = await api("POST", `/tasks/${id}/approve`, {
      approved,
      auto_execute: choice.label === "Approve & run",
    });
    log("approve:", JSON.stringify(result));
    output.show();
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: approve failed: ${err.message}`);
  }
}

async function runTask() {
  const id = await pickTaskId();
  if (!id) return;
  output.show();
  log(`executing task ${id} (sync)…`);
  try {
    const summary = await api("POST", `/tasks/${id}/execute`);
    output.appendLine(JSON.stringify(summary, null, 2));
    const status = summary.task?.status || summary.execution?.status;
    vscode.window.showInformationMessage(`Zyntry: execution ${status}`);
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: execution failed: ${err.message}`);
  }
}

async function streamTask() {
  const id = await pickTaskId();
  if (!id) return;
  output.show();
  log(`streaming execution of task ${id}…`);
  const token = await apiToken();
  const headers = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  const resp = await fetch(`${baseUrl()}/tasks/${id}/execute/stream`, {
    method: "POST",
    headers,
  });
  if (!resp.ok) {
    vscode.window.showErrorMessage(`Zyntry: stream failed: HTTP ${resp.status}`);
    return;
  }
  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  // Simple SSE framing: frames end with a blank line.
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let idx;
    while ((idx = buffer.indexOf("\n\n")) !== -1) {
      const frame = buffer.slice(0, idx);
      buffer = buffer.slice(idx + 2);
      for (const line of frame.split("\n")) {
        if (!line.startsWith("data:")) continue;
        let event;
        try {
          event = JSON.parse(line.slice(5).trim());
        } catch {
          continue;
        }
        log(`stream: ${event.type} — ${event.message || ""}`);
        if (event.type === "done") {
          output.appendLine(JSON.stringify(event.summary, null, 2));
          vscode.window.showInformationMessage(
            `Zyntry: execution ${event.summary?.task?.status || "finished"}`,
          );
          return;
        }
        if (event.type === "error") {
          vscode.window.showErrorMessage(`Zyntry: ${event.detail}`);
          return;
        }
      }
    }
  }
}

// ---------------------------------------------------------------------------
// repo ingestion
// ---------------------------------------------------------------------------

async function ingestRepo() {
  const id = await pickTaskId();
  if (!id) return;
  const folders = vscode.workspace.workspaceFolders;
  if (!folders || folders.length === 0) {
    vscode.window.showErrorMessage("Zyntry: open a folder first");
    return;
  }
  const root = folders[0].uri.fsPath;
  const maxFiles = Number(config().get("runnerMaxFiles", 200));
  const skipDirs = new Set(["node_modules", ".git", ".venv", "venv", "__pycache__", "dist", "build", ".next", ".ssh", ".aws", ".gnupg"]);
  const skipExt = new Set([".png", ".jpg", ".jpeg", ".gif", ".ico", ".pdf", ".zip", ".woff", ".woff2", ".ttf", ".map"]);

  const files = [];
  async function walk(dir) {
    if (files.length >= maxFiles) return;
    let entries;
    try {
      entries = await fsp.readdir(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      if (files.length >= maxFiles) return;
      if (entry.isDirectory()) {
        if (skipDirs.has(entry.name)) continue;
        await walk(path.join(dir, entry.name));
        continue;
      }
      const full = path.join(dir, entry.name);
      const lowerName = entry.name.toLowerCase();
      if ([".env", ".env.local", ".env.production", ".dev.vars", "credentials.json", "service-account.json", "id_rsa", "id_ed25519"].includes(lowerName)
          || [".pem", ".key", ".p12", ".pfx"].some((suffix) => lowerName.endsWith(suffix))) continue;
      if (skipExt.has(path.extname(entry.name).toLowerCase())) continue;
      let size = 0;
      try {
        size = (await fsp.stat(full)).size;
      } catch {
        continue;
      }
      if (size > 200_000) continue; // skip huge files
      try {
        const content = await fsp.readFile(full, "utf8");
        files.push({ path: path.relative(root, full).replace(/\\/g, "/"), language: langFor(entry.name), size, content });
      } catch {
        // binary or unreadable — skip
      }
    }
  }
  await walk(root);

  try {
    const result = await api("POST", `/tasks/${id}/repo`, { files });
    log(`ingested ${result.files_ingested} file(s) into task ${id}`);
    vscode.window.showInformationMessage(`Zyntry: ingested ${result.files_ingested} files`);
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: ingest failed: ${err.message}`);
  }
}

function langFor(name) {
  const ext = path.extname(name).slice(1).toLowerCase();
  return {
    js: "javascript", ts: "typescript", tsx: "typescript", jsx: "javascript",
    py: "python", rs: "rust", go: "go", java: "java", rb: "ruby", php: "php",
    cs: "csharp", c: "c", cpp: "cpp", h: "c", html: "html", css: "css",
    scss: "scss", json: "json", yml: "yaml", yaml: "yaml", toml: "toml",
    md: "markdown", sql: "sql", sh: "shell",
  }[ext] || "text";
}

// ---------------------------------------------------------------------------
// local runner (provider=local workspaces)
// ---------------------------------------------------------------------------

async function createWorkspace() {
  const repoUrl = await vscode.window.showInputBox({
    prompt: "Repo URL (optional; local runner works in the open folder regardless)",
  });
  const taskId = await vscode.window.showInputBox({
    prompt: "Attach this workspace to a task id (optional — prefill: last task)",
    value: lastTaskId || undefined,
  });
  try {
    const ws = await api("POST", "/workspaces", {
      provider: "local",
      repo_url: repoUrl || undefined,
      task_id: taskId || undefined,
    });
    if (ws.runner_token) workspaceTokens.set(ws.id, ws.runner_token);
    log("workspace created:", ws.id, "provider=local", taskId ? `attached to task ${taskId}` : "");
    output.appendLine(`runner token for ${ws.id} was stored in memory for this session`);
    output.appendLine(`attached to task: ${ws.task_id || "none"} — attach later with "Zyntry: Attach Workspace to Task"`);
    output.show();
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: create workspace failed: ${err.message}`);
  }
}

async function attachWorkspace() {
  const id = await vscode.window.showInputBox({ prompt: "Workspace id to attach" });
  if (!id) return;
  const taskId = await vscode.window.showInputBox({
    prompt: "Task id to attach it to",
    value: lastTaskId || undefined,
  });
  if (!taskId) return;
  try {
    const ws = await api("POST", `/workspaces/${id}/attach`, { task_id: taskId });
    log("attached workspace", ws.id, "to task", ws.task_id);
    vscode.window.showInformationMessage(
      `Zyntry: workspace ${ws.id.slice(0, 8)} attached to task ${ws.task_id.slice(0, 8)} — Re-run the task so verification runs in your repo`,
    );
  } catch (err) {
    vscode.window.showErrorMessage(`Zyntry: attach failed: ${err.message}`);
  }
}

function startLocalRunner() {
  if (runnerRunning) {
    vscode.window.showInformationMessage("Zyntry: local runner already running");
    return;
  }
  runnerRunning = true;
  log(`local runner started (id ${RUNNER_ID})`);
  vscode.window.setStatusBarMessage("Zyntry local runner: running");
  runnerTimer = setInterval(pollWorkspaces, Number(config().get("runnerPollSeconds", 3)) * 1000);
  pollWorkspaces();
}

function stopLocalRunner() {
  runnerRunning = false;
  if (runnerTimer) clearInterval(runnerTimer);
  runnerTimer = null;
  log("local runner stopped");
  vscode.window.setStatusBarMessage("Zyntry local runner: stopped");
}

async function pollWorkspaces() {
  if (!runnerRunning) return;
  let workspaces;
  try {
    const data = await api("GET", "/workspaces?pending=true&provider=local");
    workspaces = data.workspaces || [];
  } catch (err) {
    log("runner poll failed:", err.message);
    return;
  }
  for (const ws of workspaces) {
    if (!runnerRunning) return;
    if (ws.runner_id && ws.runner_id !== RUNNER_ID) continue;
    try {
      await serveWorkspace(ws);
    } catch (err) {
      log(`workspace ${ws.id} error:`, err.message);
    }
  }
}

async function serveWorkspace(ws) {
  const token = workspaceTokens.get(ws.id);
  if (!token) {
    log(`workspace ${ws.id}: no runner token known (create it from this extension or set it manually) — skipping`);
    return;
  }
  for (let i = 0; i < 50 && runnerRunning; i++) {
    const data = await api("GET", `/workspaces/${ws.id}/tool-requests/next`, undefined, {
      "x-workspace-token": token,
      "x-runner-id": RUNNER_ID,
    });
    const req = data.tool_request;
    if (!req) return;
    log(`executing ${req.tool} for workspace ${ws.id}`);
    const { status, result } = await executeTool(req, ws);
    await api("POST", `/workspaces/${ws.id}/tool-requests/${req.id}/result`, { status, result }, {
      "x-workspace-token": token,
    });
  }
}

function redact(text, ws) {
  const secrets = Object.values((ws && ws.env) || {}).filter((v) => v);
  let out = text;
  for (const s of secrets) out = out.split(s).join("[REDACTED]");
  return out;
}

function workspaceRoot() {
  const folders = vscode.workspace.workspaceFolders;
  return folders && folders.length ? folders[0].uri.fsPath : process.cwd();
}

function confine(root, relPath) {
  const rootReal = fs.realpathSync.native(root);
  const p = path.resolve(root, relPath);
  let checked = p;
  while (!fs.existsSync(checked) && checked !== path.dirname(checked)) checked = path.dirname(checked);
  const real = fs.realpathSync.native(checked);
  const candidate = fs.existsSync(p) ? real : path.join(real, path.relative(checked, p));
  if (candidate !== rootReal && !candidate.startsWith(rootReal + path.sep)) throw new Error("path outside workspace");
  return p;
}

function isSensitivePath(relPath) {
  const normalized = String(relPath || "").replace(/\\/g, "/").toLowerCase();
  const parts = new Set(normalized.split("/"));
  const name = normalized.split("/").pop();
  return [".git", ".ssh", ".aws", ".gnupg"].some((part) => parts.has(part))
    || [".env", ".env.local", ".env.production", ".dev.vars", "credentials.json",
      "service-account.json", "id_rsa", "id_ed25519"].includes(name)
    || [".pem", ".key", ".p12", ".pfx"].some((suffix) => name.endsWith(suffix));
}

function parseCommand(command) {
  if (!command) throw new Error("empty command");
  if (hasShellMetacharacters(command)) throw new Error("shell syntax is not permitted");
  const args = [];
  let current = "";
  let quote = null;
  let escaped = false;
  for (const char of command) {
    if (escaped) { current += char; escaped = false; continue; }
    if (char === "\\" && quote !== "'") { escaped = true; continue; }
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }
    if (!quote && /\s/.test(char)) {
      if (current) { args.push(current); current = ""; }
    } else current += char;
  }
  if (escaped || quote) throw new Error("invalid command syntax");
  if (current) args.push(current);
  if (!args.length) throw new Error("empty command");
  return args;
}

function hasShellMetacharacters(command) {
  let quote = null;
  let escaped = false;
  for (let i = 0; i < String(command || "").length; i += 1) {
    const char = command[i];
    if (escaped) { escaped = false; continue; }
    if (char === "\\" && quote !== "'") { escaped = true; continue; }
    if ((char === '"' || char === "'") && (!quote || quote === char)) {
      quote = quote ? null : char;
      continue;
    }
    if (!quote && (/[;&|<>`\r\n]/.test(char) || command.slice(i, i + 2) === "$(")) return true;
  }
  return Boolean(quote || escaped);
}

function commandAllowed(command, allowed = []) {
  let argv;
  try { argv = parseCommand(command).map((part) => part.toLowerCase()); } catch { return false; }
  const prefixes = allowed.length ? allowed : ["python", "python -m", "pytest", "npm", "npm test", "npm run", "pnpm", "pnpm test", "pnpm run", "yarn", "yarn test", "yarn run", "cargo test", "cargo check", "go test", "go vet", "make", "ruff", "mypy", "pyright", "flake8", "git status", "git diff", "git log", "git branch", "git add", "git commit", "ls", "dir", "cat", "pwd", "echo", "test", "which", "tsc", "eslint"];
  return prefixes.some((prefix) => {
    let prefixArgv;
    try { prefixArgv = parseCommand(prefix).map((part) => part.toLowerCase()); } catch { return false; }
    return prefixArgv.every((part, index) => argv[index] === part);
  });
}

function commandDangerous(command) {
  const lower = command.toLowerCase();
  return hasShellMetacharacters(command)
    || ["rm -rf", "git push", "git reset --hard", "npm publish", "cargo publish", "git restore", "git clean", "chmod", "chown", "curl ", "wget "].some((needle) => lower.includes(needle));
}

async function executeTool(req, ws) {
  const params = req.params || {};
  const root = workspaceRoot();
  const tool = req.tool;

  if (tool === "fs.list") {
    const dir = confine(root, params.path || ".");
    const entries = await fsp.readdir(dir, { withFileTypes: true });
    return { status: "succeeded", result: { entries: entries
      .filter((e) => !isSensitivePath(e.name))
      .map((e) => ({ name: e.name, is_dir: e.isDirectory() })) } };
  }

  if (tool === "fs.read") {
    if (isSensitivePath(params.path)) return { status: "failed", result: { error: "sensitive path is not readable" } };
    const p = confine(root, params.path);
    if ((await fsp.stat(p)).size > 512 * 1024) return { status: "failed", result: { error: "file is too large" } };
    const content = await fsp.readFile(p, "utf8");
    return { status: "succeeded", result: { path: params.path, content } };
  }

  if (tool === "fs.write") {
    if (isSensitivePath(params.path)) return { status: "failed", result: { error: "sensitive path is not writable" } };
    const p = confine(root, params.path);
    if (String(params.content || "").length > 512 * 1024) return { status: "failed", result: { error: "file is too large" } };
    const before = fs.existsSync(p)
      ? (await fsp.stat(p)).size <= 512 * 1024 ? await fsp.readFile(p, "utf8") : null
      : null;
    if (fs.existsSync(p) && before === null) return { status: "failed", result: { error: "file is too large" } };
    await fsp.mkdir(path.dirname(p), { recursive: true });
    await fsp.writeFile(p, params.content || "", "utf8");
    return { status: "succeeded", result: { files: [{ path: params.path, op: before === null ? "create" : "modify", before, after: params.content }] } };
  }

  if (tool === "fs.edit") {
    if (isSensitivePath(params.path)) return { status: "failed", result: { error: "sensitive path is not writable" } };
    const p = confine(root, params.path);
    if (String(params.search || "").length > 10_000 || String(params.replace || "").length > 512 * 1024) {
      return { status: "failed", result: { error: "edit payload is too large" } };
    }
    const content = await fsp.readFile(p, "utf8");
    if (Buffer.byteLength(content, "utf8") > 512 * 1024) return { status: "failed", result: { error: "file is too large" } };
    const search = params.search;
    const parts = content.split(search);
    if (!search || parts.length < 2) {
      return { status: "failed", result: { error: `search string not found in ${params.path}` } };
    }
    if (parts.length > 2) {
      return { status: "failed", result: { error: `search string is ambiguous in ${params.path} (${parts.length - 1} matches)` } };
    }
    const updated = parts[0] + params.replace + parts[1];
    if (Buffer.byteLength(updated, "utf8") > 512 * 1024) return { status: "failed", result: { error: "file is too large" } };
    await fsp.writeFile(p, updated, "utf8");
    return { status: "succeeded", result: { files: [{ path: params.path, op: "modify", before: content, after: updated }] } };
  }

  if (tool === "fs.delete") {
    if (isSensitivePath(params.path)) return { status: "failed", result: { error: "sensitive path is not deletable" } };
    const p = confine(root, params.path);
    await fsp.unlink(p);
    return { status: "succeeded", result: { files: [{ path: params.path, op: "delete", before: null, after: null }] } };
  }

  if (tool === "fs.search") {
    if (String(params.pattern || "").length > 256) return { status: "failed", result: { error: "search pattern is too long" } };
    const dir = confine(root, params.path || ".");
    let pattern;
    try { pattern = new RegExp(params.pattern, "i"); } catch (err) { return { status: "failed", result: { error: "invalid search pattern" } }; }
    const matches = [];
    const walk = async (d) => {
      for (const entry of await fsp.readdir(d, { withFileTypes: true })) {
        if (entry.isDirectory()) {
          if (["node_modules", ".git", ".ssh", ".aws", ".gnupg"].includes(entry.name) || isSensitivePath(entry.name)) continue;
          await walk(path.join(d, entry.name));
          continue;
        }
        const full = path.join(d, entry.name);
        const rel = path.relative(root, full).replace(/\\/g, "/");
        if (isSensitivePath(rel)) continue;
        try {
          const real = await fsp.realpath(full);
          const rootReal = await fsp.realpath(root);
          if (real !== rootReal && !real.startsWith(rootReal + path.sep)) continue;
          if ((await fsp.stat(real)).size > 512 * 1024) continue;
          const content = await fsp.readFile(real, "utf8");
          for (const [i, line] of content.split("\n").entries()) {
            if (pattern.test(line)) matches.push({ path: rel, line: i + 1, text: line.trim().slice(0, 300) });
          }
        } catch {
          /* binary — skip */
        }
      }
    };
    await walk(dir);
    return { status: "succeeded", result: { matches: matches.slice(0, 200) } };
  }

  if (tool === "git.status" || tool === "git.diff" || tool === "git.commit" || tool === "git.push") {
    const git = (args) =>
      new Promise((resolve, reject) =>
        execFile("git", args, { cwd: root, maxBuffer: 10 * 1024 * 1024 }, (err, stdout, stderr) =>
          err ? reject(new Error(stderr || err.message)) : resolve(String(stdout)),
        ),
      );
    try {
      if (tool === "git.status") {
        const out = await git(["status", "--porcelain", "--untracked-files=all"]);
        const entries = out.split("\n").filter(Boolean).map((line) => ({ status: line.slice(0, 2).trim(), path: line.slice(3) }));
        return { status: "succeeded", result: { entries } };
      }
      if (tool === "git.diff") {
        const status = await git(["status", "--porcelain", "--untracked-files=all"]);
        const files = [];
        for (const line of status.split("\n").filter(Boolean)) {
          const state = line.slice(0, 2).trim();
          let p = line.slice(3);
          if (p.includes(" -> ")) p = p.split(" -> ")[1];
          if (!isSensitivePath(p)) files.push({ path: p, op: state === "??" ? "create" : "D".includes(state) ? "delete" : "modify" });
        }
        const summary = await git(["diff", "--stat"]);
        return { status: "succeeded", result: { files, summary: summary.trim() } };
      }
      if (tool === "git.commit") {
        await git(["add", "-A", "--", ".", ":(exclude).env", ":(exclude).env.*",
          ":(exclude).dev.vars", ":(exclude)**/.env", ":(exclude)**/.env.*",
          ":(exclude)**/.dev.vars", ":(exclude)**/*.pem", ":(exclude)**/*.key"]);
        await git(["commit", "-m", params.message || "zyntry-code changes"]);
        const head = (await git(["rev-parse", "HEAD"])).trim();
        return { status: "succeeded", result: { committed: true, head } };
      }
      if (tool === "git.push") {
        const branch = params.branch || (await git(["rev-parse", "--abbrev-ref", "HEAD"])).trim();
        if (!/^[A-Za-z0-9][A-Za-z0-9._/-]*$/.test(branch) || branch.includes("..")) {
          return { status: "failed", result: { error: "invalid git branch" } };
        }
        await git(["push", "origin", branch]);
        return { status: "succeeded", result: { pushed: true, branch } };
      }
    } catch (err) {
      return { status: "failed", result: { error: redact(err.message, ws) } };
    }
  }

  if (tool === "command.run") {
    const timeout = (ws.timeout_seconds || 300) * 1000;
    const started = Date.now();
    try {
      const argv = parseCommand(String(params.cmd || ""));
      if (!req.dangerous && (!commandAllowed(String(params.cmd || ""), ws.allowed_commands || []) || commandDangerous(String(params.cmd || "")))) {
        return { status: "failed", result: { error: "command is not allowed" } };
      }
      const { stdout, stderr, code, timedOut } = await new Promise((resolve, reject) => {
        execFile(argv[0], argv.slice(1), { cwd: root, timeout, maxBuffer: 4 * 1024 * 1024, windowsHide: true }, (error, stdout, stderr) => {
          if (error) {
            resolve({ stdout, stderr, code: error.code, timedOut: error.killed || error.signal === "SIGTERM" });
            return;
          }
          resolve({ stdout, stderr, code: 0, timedOut: false });
        });
      });
      return {
        status: code === 0 && !timedOut ? "succeeded" : timedOut ? "timed_out" : "failed",
        result: {
          stdout: redact(String(stdout).slice(-20000), ws),
          stderr: redact(String(stderr).slice(-20000), ws),
          exit_code: code,
          duration_ms: Date.now() - started,
          timed_out: timedOut,
        },
      };
    } catch (err) {
      return { status: "failed", result: { error: redact(err.message, ws) } };
    }
  }

  return { status: "failed", result: { error: `unsupported tool: ${tool}` } };
}

// ---------------------------------------------------------------------------
// activation
// ---------------------------------------------------------------------------

function activate(context) {
  extensionContext = context;
  const configured = String(config().get("apiToken", ""));
  if (configured && context.secrets) {
    context.secrets.store("zyntry.apiToken", configured).then(async () => {
      // Migrate legacy plaintext settings into VS Code SecretStorage. Clear
      // both scopes only after the secret write succeeds.
      await config().update("apiToken", undefined, vscode.ConfigurationTarget.Global);
      await config().update("apiToken", undefined, vscode.ConfigurationTarget.Workspace);
    }).catch(() => {});
  }
  output = vscode.window.createOutputChannel("Zyntry Code");
  const reg = (cmd, fn) => vscode.commands.registerCommand(cmd, fn);
  context.subscriptions.push(
    reg("zyntry.createTask", createTask),
    reg("zyntry.approveTask", approveTask),
    reg("zyntry.runTask", runTask),
    reg("zyntry.streamTask", streamTask),
    reg("zyntry.ingestRepo", ingestRepo),
    reg("zyntry.createWorkspace", createWorkspace),
    reg("zyntry.attachWorkspace", attachWorkspace),
    reg("zyntry.startLocalRunner", startLocalRunner),
    reg("zyntry.stopLocalRunner", stopLocalRunner),
  );
  log("Zyntry Code extension activated. Backend:", baseUrl());
}

function deactivate() {
  if (runnerTimer) clearInterval(runnerTimer);
  runnerRunning = false;
}

module.exports = { activate, deactivate };
