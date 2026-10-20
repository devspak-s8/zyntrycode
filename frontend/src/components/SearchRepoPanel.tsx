import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { X, Search, Loader2, FileCode, Sparkles } from 'lucide-react';
import { api } from '../api/client';

/**
 * Repo search over the task's ingested snapshot.
 *
 * Two modes:
 * - Semantic: backend embeddings (OpenAI/Workers AI) over the ingested files,
 *   ranked by cosine similarity — used whenever the task has an attached
 *   workspace with an index (built on first search).
 * - Grep fallback: exact path/content matching in the browser when no
 *   workspace exists (embeddings are workspace-scoped).
 */

interface SearchRepoPanelProps {
  isOpen: boolean;
  taskId?: string;
  workspaceId?: string;
  onClose: () => void;
}

interface Match {
  path: string;
  line: number;
  text: string;
  score?: number;
}

interface SemanticHit {
  path: string;
  start_line: number;
  end_line: number;
  content: string;
  score: number;
}

export const SearchRepoPanel: React.FC<SearchRepoPanelProps> = ({
  isOpen,
  taskId,
  workspaceId,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [files, setFiles] = useState<{ path: string; content?: string | null }[]>([]);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [matches, setMatches] = useState<Match[]>([]);
  const [searched, setSearched] = useState(false);
  const [semantic, setSemantic] = useState(false);
  const [indexing, setIndexing] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const semanticAvailable = Boolean(workspaceId);

  useEffect(() => {
    if (!isOpen || !taskId || loaded) return;
    let cancelled = false;
    setLoading(true);
    api
      .getRepoFiles(taskId)
      .then((resp) => {
        if (cancelled) return;
        setFiles(resp.files ?? []);
        setLoaded(true);
      })
      .catch(() => {
        if (!cancelled) setFiles([]);
        if (!cancelled) setLoaded(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [isOpen, taskId, loaded]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const ensureIndex = async (): Promise<boolean> => {
    if (!workspaceId) return false;
    try {
      const status = await api.semanticStatus(workspaceId);
      if (status.indexed) return true;
    } catch {
      return false;
    }
    setIndexing(true);
    try {
      await api.semanticIndex(workspaceId);
      setIndexing(false);
      return true;
    } catch {
      setIndexing(false);
      setNotice('Semantic index unavailable (no embedding provider) — showing exact matches instead.');
      return false;
    }
  };

  const runSearch = async (q: string) => {
    const needle = q.trim();
    if (!needle) {
      setMatches([]);
      setSearched(false);
      setNotice(null);
      return;
    }
    setNotice(null);

    if (semanticAvailable) {
      const indexed = await ensureIndex();
      if (indexed) {
        try {
          const resp = await api.semanticSearch(workspaceId!, needle, 8);
          setMatches(
            resp.results.map((r) => ({
              path: r.path,
              line: r.start_line,
              text: r.content.trim().slice(0, 200),
              score: r.score,
            }))
          );
          setSemantic(true);
          setSearched(true);
          return;
        } catch {
          setNotice('Semantic search failed — falling back to exact matches.');
        }
      }
    }

    // Grep fallback: exact path/content matching.
    const out: Match[] = [];
    const lower = needle.toLowerCase();
    for (const f of files) {
      if (f.path.toLowerCase().includes(lower)) {
        out.push({ path: f.path, line: 0, text: '(path match)' });
      }
      const content = f.content ?? '';
      if (content && content.length < 200_000) {
        content.split('\n').forEach((lineText, i) => {
          if (lineText.toLowerCase().includes(lower)) {
            out.push({ path: f.path, line: i + 1, text: lineText.trim().slice(0, 160) });
          }
        });
      }
    }
    setSemantic(false);
    setMatches(out.slice(0, 100));
    setSearched(true);
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center bg-black/70 backdrop-blur-sm p-4 pt-20">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="w-full max-w-xl rounded-3xl border border-white/10 bg-[#121820]/95 backdrop-blur-xl p-5 shadow-2xl space-y-3 max-h-[70vh] flex flex-col"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <Search size={15} className="text-[#93C5FD]" />
            <h2 className="text-sm font-bold text-[#F2F6F4]">Search repo snapshot</h2>
            {semanticAvailable && (
              <span className="flex items-center gap-1 text-[10px] font-mono text-[#93C5FD] bg-[#16233A] border border-[#82B9FF]/30 rounded-full px-2 py-0.5">
                <Sparkles size={10} />
                semantic
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 rounded-full hover:bg-white/8 text-[#6F7B77] hover:text-[#F2F6F4] cursor-pointer">
            <X size={15} />
          </button>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            runSearch(e.target.value);
          }}
          onKeyDown={(e) => e.key === 'Escape' && onClose()}
          placeholder="Search the repo snapshot (ranked by meaning when a workspace is attached)…"
          className="w-full h-10 rounded-full bg-black/30 border border-white/10 px-4 text-xs font-mono text-[#F2F6F4] placeholder-[#9CA3AF] outline-none focus:border-[#82B9FF]"
        />

        {notice && <p className="text-[11px] font-mono text-[#F4C76A] px-1">{notice}</p>}
        {indexing && (
          <div className="flex items-center gap-2 text-[11px] font-mono text-[#9CA3AF] px-1">
            <Loader2 size={12} className="animate-spin text-[#82B9FF]" />
            Building semantic index (embeddings)…
          </div>
        )}

        <div className="flex-1 overflow-y-auto space-y-1 min-h-0">
          {loading && (
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#9CA3AF] px-1 py-2">
              <Loader2 size={12} className="animate-spin text-[#82B9FF]" />
              Loading snapshot…
            </div>
          )}
          {!loading && files.length === 0 && (
            <p className="text-[11px] text-[#A3AEAA] px-1 py-2">
              No repo snapshot for this task yet — attach files in the composer
              (paperclip) or run "Zyntry: Ingest Repo Snapshot" in VS Code.
            </p>
          )}
          {!loading && searched && matches.length === 0 && (
            <p className="text-[11px] text-[#A3AEAA] px-1 py-2">
              No matches for "{query}" in {files.length} files.
            </p>
          )}
          {!loading && !searched && files.length > 0 && (
            <p className="text-[11px] text-[#6F7B77] px-1 py-2">
              {files.length} files in the snapshot — type to search.
            </p>
          )}
          {matches.map((m, i) => (
            <div key={`${m.path}-${m.line}-${i}`} className="px-2.5 py-1.5 rounded-lg bg-black/20 border border-white/5 text-[11px] font-mono">
              <div className="flex items-center gap-1.5 text-[#93C5FD]">
                <FileCode size={10} />
                <span>{m.path}</span>
                {m.line > 0 && <span className="text-[#6F7B77]">:{m.line}</span>}
                {m.score !== undefined && (
                  <span className="ml-auto text-[#55E6A5]">{m.score.toFixed(2)}</span>
                )}
              </div>
              {m.line > 0 && <div className="text-[#A3AEAA] mt-0.5 pl-4 break-words">{m.text}</div>}
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
};