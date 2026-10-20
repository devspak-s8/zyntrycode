import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X, Plug, Loader2, CheckCircle2, RefreshCw, Link2, ShieldCheck } from 'lucide-react';
import { api, BackendToolRequest, BackendWorkspace, friendlyError } from '../api/client';

/**
 * Runner bridge panel — shows the state of the execution runners (the VS Code
 * extension local runner or remote workers), the workspace attached to the
 * current task, and any tool requests awaiting approval. This is the surface
 * that makes "tests actually run": attach a runner workspace, approve the
 * verification commands it should run, and the backend will execute them in
 * your real repo on the next run.
 */

interface RunnerPanelProps {
  isOpen: boolean;
  taskId?: string;
  workspaceId?: string;
  onClose: () => void;
  onAttached?: (ws: BackendWorkspace) => void;
}

interface WorkerInfo {
  id: string;
  name?: string;
  last_heartbeat?: string;
  capabilities?: string[];
}

export const RunnerPanel: React.FC<RunnerPanelProps> = ({
  isOpen,
  taskId,
  workspaceId,
  onClose,
  onAttached,
}) => {
  const [workers, setWorkers] = useState<WorkerInfo[]>([]);
  const [workspace, setWorkspace] = useState<BackendWorkspace | null>(null);
  const [requests, setRequests] = useState<BackendToolRequest[]>([]);
  const [attachId, setAttachId] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setBusy(true);
    setError(null);
    try {
      const [w, ws, reqs] = await Promise.all([
        api.listWorkers().catch(() => ({ workers: [] })),
        workspaceId
          ? api.getWorkspace(workspaceId).catch(() => null)
          : Promise.resolve(null),
        workspaceId
          ? api.getToolRequests(workspaceId).catch(() => ({ tool_requests: [] }))
          : Promise.resolve({ tool_requests: [] }),
      ]);
      setWorkers(w.workers);
      setWorkspace(ws);
      setRequests(reqs.tool_requests ?? []);
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, workspaceId]);

  if (!isOpen) return null;

  const attach = async () => {
    if (!attachId.trim() || !taskId) return;
    setBusy(true);
    setError(null);
    try {
      const ws = await api.attachWorkspace(attachId.trim(), taskId);
      setNotice(`Workspace ${ws.id.slice(0, 8)} attached to this task — re-run the task to run verification in your repo.`);
      onAttached?.(ws);
      await refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const approve = async (requestId: string) => {
    if (!workspaceId) return;
    setBusy(true);
    try {
      await api.approveToolRequest(workspaceId, requestId);
      await refresh();
    } catch (err) {
      setError(friendlyError(err));
    } finally {
      setBusy(false);
    }
  };

  const pending = requests.filter((r) => r.status === 'awaiting_approval' || r.status === 'queued');
  const done = requests.filter((r) => r.status === 'succeeded' || r.status === 'failed');

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-lg rounded-3xl border border-white/10 bg-[#121820]/95 backdrop-blur-xl p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-[#55E6A5]/15 border border-[#55E6A5]/30 flex items-center justify-center text-[#55E6A5]">
              <Plug size={17} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#F2F6F4]">Execution Runner</h2>
              <p className="text-[11px] text-[#A3AEAA]">
                VS Code local runner / remote workers — makes tests actually run
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={refresh}
              disabled={busy}
              className="p-2 rounded-full hover:bg-white/8 text-[#A3AEAA] hover:text-white cursor-pointer disabled:opacity-40"
              title="Refresh"
            >
              <RefreshCw size={14} className={busy ? 'animate-spin' : ''} />
            </button>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/8 text-[#6F7B77] hover:text-[#F2F6F4] cursor-pointer">
              <X size={15} />
            </button>
          </div>
        </div>

        {taskId && (
          <div className="text-[11px] font-mono text-[#6F7B77]">
            Task: <span className="text-[#93C5FD]">{taskId.slice(0, 8)}</span>
          </div>
        )}

        {/* Workers */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/8 space-y-2">
          <div className="text-[11px] font-mono text-[#9CA3AF] uppercase tracking-wider">
            Runners ({workers.length})
          </div>
          {workers.length === 0 ? (
            <p className="text-[11px] text-[#A3AEAA]">
              No remote workers registered. For local execution: in VS Code run{' '}
              <span className="font-mono text-[#93C5FD]">Zyntry: Create Workspace</span> then{' '}
              <span className="font-mono text-[#93C5FD]">Zyntry: Start Local Runner</span>.
            </p>
          ) : (
            workers.map((w) => (
              <div key={w.id} className="flex items-center gap-2 text-[11px] font-mono text-[#A3AEAA]">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                <span className="text-[#F2F6F4]">{w.name || w.id.slice(0, 8)}</span>
                <span>{(w.capabilities ?? []).join(', ') || 'generic'}</span>
                {w.last_heartbeat && (
                  <span className="text-[#6F7B77]">
                    · {new Date(w.last_heartbeat).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                )}
              </div>
            ))
          )}
        </div>

        {/* Workspace + attach */}
        <div className="p-4 rounded-2xl bg-black/30 border border-white/8 space-y-2">
          <div className="text-[11px] font-mono text-[#9CA3AF] uppercase tracking-wider">
            Workspace for this task
          </div>
          {workspace ? (
            <div className="text-[11px] font-mono text-[#55E6A5] flex items-center gap-2">
              <CheckCircle2 size={12} />
              <span>
                {workspace.id.slice(0, 8)} · provider={workspace.provider} · status={workspace.status}
              </span>
            </div>
          ) : (
            <p className="text-[11px] text-[#A3AEAA]">
              No workspace attached yet — verification ran limited (repo sandbox unavailable).
            </p>
          )}
          <div className="flex items-center gap-2 pt-1">
            <input
              value={attachId}
              onChange={(e) => setAttachId(e.target.value)}
              placeholder="Workspace id (from the VS Code extension output)"
              className="flex-1 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs font-mono text-[#F2F6F4] outline-none focus:border-[#82B9FF]"
            />
            <button
              onClick={attach}
              disabled={busy || !attachId.trim() || !taskId}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-[#55E6A5]/15 border border-[#55E6A5]/35 text-[#55E6A5] text-xs font-semibold cursor-pointer disabled:opacity-40 hover:bg-[#55E6A5]/25 transition-colors"
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Link2 size={12} />}
              <span>Attach</span>
            </button>
          </div>
        </div>

        {/* Tool requests */}
        {workspaceId && (
          <div className="p-4 rounded-2xl bg-black/30 border border-white/8 space-y-2">
            <div className="text-[11px] font-mono text-[#9CA3AF] uppercase tracking-wider">
              Tool requests ({pending.length} pending · {done.length} done)
            </div>
            {requests.length === 0 ? (
              <p className="text-[11px] text-[#A3AEAA]">
                None yet — they appear when the agent applies files or runs verification.
              </p>
            ) : (
              requests.slice(0, 10).map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-2 text-[11px] font-mono"
                >
                  <div className="min-w-0">
                    <span className="text-[#F2F6F4]">{r.tool}</span>
                    {r.verify_as && <span className="text-[#93C5FD]"> · {r.verify_as}</span>}
                    <span
                      className={`ml-2 px-1.5 py-0.5 rounded ${
                        r.status === 'succeeded'
                          ? 'text-[#55E6A5] bg-[#55E6A5]/10'
                          : r.status === 'failed'
                          ? 'text-[#FF7D7D] bg-[#FF7D7D]/10'
                          : r.status === 'awaiting_approval'
                          ? 'text-[#F4C76A] bg-[#F4C76A]/10'
                          : 'text-[#6F7B77] bg-white/5'
                      }`}
                    >
                      {r.status}
                    </span>
                  </div>
                  {r.status === 'awaiting_approval' && (
                    <button
                      onClick={() => approve(r.id)}
                      disabled={busy}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#55E6A5]/15 border border-[#55E6A5]/35 text-[#55E6A5] text-[10px] font-semibold cursor-pointer disabled:opacity-40"
                    >
                      <ShieldCheck size={10} />
                      <span>Approve</span>
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {notice && (
          <div className="text-[11px] font-mono text-[#55E6A5] bg-[#55E6A5]/10 border border-[#55E6A5]/25 rounded-lg px-3 py-2">
            {notice}
          </div>
        )}
        {error && (
          <div className="text-[11px] font-mono text-[#F87171] bg-[#2A150F] border border-[#F87171]/30 rounded-lg px-3 py-2">
            {error}
          </div>
        )}
      </motion.div>
    </div>
  );
};