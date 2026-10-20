import { TaskSession } from '../types';

/**
 * Builds a single-file JSON transcript for a session — everything the
 * sidecar (VS Code extension) or a human reviewer needs to replay what
 * happened: messages, narrated tool activities, stages, verification,
 * routing and the final diff.
 */
export function buildTranscript(session: TaskSession) {
  return {
    format: 'zyntry-transcript',
    version: 1,
    exported_at: new Date().toISOString(),
    session: {
      id: session.id,
      title: session.title,
      created_at: session.createdAt,
      branch: session.branch,
      mode: session.mode,
      state: session.state,
      backend_task_id: session.backendTaskId ?? null,
      backend_execution_id: session.backendExecutionId ?? null,
      backend_workspace_id: session.backendWorkspaceId ?? null,
    },
    messages: session.messages.map((m) => ({
      role: m.role,
      content: m.content,
      timestamp: m.timestamp,
      attached_files: m.attachedFiles ?? [],
    })),
    execution: {
      stages: (session.executionStages ?? []).map((s) => ({
        name: s.name,
        status: s.status,
        model: s.modelAssigned ?? null,
      })),
      plan: session.planSteps.map((s) => ({ label: s.label, status: s.status })),
      activity: session.toolActivities.map((a) => ({
        time: a.timestamp,
        action: a.action,
        message: a.name,
        status: a.status,
      })),
      verification: session.verificationChecks.map((c) => ({
        check: c.name,
        status: c.status,
        summary: c.summary ?? null,
      })),
      routing: session.routing,
    },
    changes: session.diffFiles.map((f) => ({
      path: f.path,
      status: f.status,
      added: f.addedCount,
      removed: f.removedCount,
    })),
    evidence_pack: session.evidencePack ?? null,
  };
}

export function downloadTranscript(session: TaskSession) {
  const payload = JSON.stringify(buildTranscript(session), null, 2);
  const blob = new Blob([payload], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeTitle = safeTitleOf(session);
  a.download = `zyntry-transcript-${safeTitle}-${session.id.slice(0, 8)}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

function safeTitleOf(session: TaskSession): string {
  return (
    session.title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '')
      .slice(0, 48) || 'session'
  );
}

export function buildTranscriptMarkdown(session: TaskSession): string {
  const t = buildTranscript(session);
  const lines: string[] = [];
  lines.push(`# Zyntry Code — ${t.session.title}`);
  lines.push('');
  lines.push(
    `- **State:** ${t.session.state} · **Branch:** ${t.session.branch} · **Created:** ${t.session.created_at}`
  );
  lines.push(`- **Task:** \`${t.session.backend_task_id ?? '—'}\` · **Execution:** \`${t.session.backend_execution_id ?? '—'}\``);
  lines.push('');
  lines.push('## Conversation');
  lines.push('');
  for (const m of t.messages) {
    const who = m.role === 'user' ? '**Developer**' : m.role === 'assistant' ? '**Zyntry Code**' : '**System**';
    lines.push(`${who} · ${m.timestamp}`);
    lines.push('');
    lines.push(m.content);
    lines.push('');
  }
  if (t.execution.stages.length) {
    lines.push('## Stages');
    lines.push('');
    for (const s of t.execution.stages) {
      lines.push(`- ${s.status === 'complete' ? '✅' : s.status === 'failed' ? '❌' : '⏳'} **${s.name}** — ${s.status}${s.model ? ` (${s.model})` : ''}`);
    }
    lines.push('');
  }
  if (t.execution.activity.length) {
    lines.push('## Activity log');
    lines.push('');
    for (const a of t.execution.activity) {
      lines.push(`- \`${a.time}\` ${a.status === 'failed' ? '❌' : '✅'} ${a.message}`);
    }
    lines.push('');
  }
  if (t.execution.verification.length) {
    lines.push('## Verification');
    lines.push('');
    for (const v of t.execution.verification) {
      lines.push(`- ${v.status === 'passed' ? '✅' : '⚠️'} **${v.check}** — ${v.status}${v.summary ? `: ${v.summary}` : ''}`);
    }
    lines.push('');
  }
  if (t.changes.length) {
    lines.push('## Changes');
    lines.push('');
    for (const c of t.changes) {
      lines.push(`- \`${c.path}\` — ${c.status} (+${c.added} −${c.removed})`);
    }
    lines.push('');
  }
  lines.push(`---`);
  lines.push(`Exported ${t.exported_at} · format v${t.version}`);
  return lines.join('\n');
}

export function downloadTranscriptMarkdown(session: TaskSession) {
  const blob = new Blob([buildTranscriptMarkdown(session)], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `zyntry-transcript-${safeTitleOf(session)}-${session.id.slice(0, 8)}.md`;
  a.click();
  URL.revokeObjectURL(url);
}