import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Search,
  Plus,
  Bot,
  Code2,
  HelpCircle,
  ListChecks,
  SquareTerminal,
  GitPullRequest,
  ShieldCheck,
  Sliders,
  Brain,
  CornerDownLeft,
} from 'lucide-react';
import { WorkspaceMode } from '../types';

export interface PaletteAction {
  id: string;
  label: string;
  hint?: string;
  group: string;
  keywords?: string;
  icon: React.ReactNode;
  run: () => void;
}

interface CommandPaletteProps {
  isOpen: boolean;
  actions: PaletteAction[];
  onClose: () => void;
}

/**
 * Cmd+K / Ctrl+K command palette. Fuzzy-filters the action list and runs the
 * selected action on Enter (or click). Pure overlay — no navigation logic here.
 */
export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  actions,
  onClose,
}) => {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 20);
    }
  }, [isOpen]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return actions;
    return actions.filter(
      (a) =>
        a.label.toLowerCase().includes(q) ||
        a.group.toLowerCase().includes(q) ||
        (a.keywords ?? '').toLowerCase().includes(q)
    );
  }, [actions, query]);

  const clamped = Math.min(selected, Math.max(0, filtered.length - 1));

  const run = (action: PaletteAction) => {
    onClose();
    action.run();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[90] flex items-start justify-center bg-black/60 backdrop-blur-sm p-4 pt-[12vh]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.97, y: -8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ type: 'spring', stiffness: 500, damping: 32 }}
        className="w-full max-w-lg rounded-2xl border border-white/12 bg-[#141A22]/98 backdrop-blur-2xl shadow-2xl overflow-hidden"
      >
        {/* Input */}
        <div className="flex items-center gap-2.5 px-4 border-b border-white/8">
          <Search size={15} className="text-[#93C5FD] shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelected(0);
            }}
            onKeyDown={(e) => {
              if (e.key === 'ArrowDown') {
                e.preventDefault();
                setSelected((s) => Math.min(s + 1, filtered.length - 1));
              } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                setSelected((s) => Math.max(s - 1, 0));
              } else if (e.key === 'Enter') {
                e.preventDefault();
                const a = filtered[clamped];
                if (a) run(a);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Type a command…"
            className="flex-1 bg-transparent py-3.5 text-sm text-[#F3F4F6] placeholder-[#6F7B77] outline-none"
          />
          <kbd className="text-[10px] font-mono text-[#6F7B77] border border-white/10 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-1.5 space-y-0.5">
          {filtered.length === 0 && (
            <p className="px-3 py-6 text-center text-xs text-[#6F7B77]">No matching commands.</p>
          )}
          {filtered.map((a, i) => (
            <button
              key={a.id}
              type="button"
              onClick={() => run(a)}
              onMouseEnter={() => setSelected(i)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-colors cursor-pointer ${
                i === clamped ? 'bg-white/10' : 'hover:bg-white/5'
              }`}
            >
              <span className={`shrink-0 ${i === clamped ? 'text-[#93C5FD]' : 'text-[#6F7B77]'}`}>
                {a.icon}
              </span>
              <span className="flex-1 min-w-0">
                <span className={`block text-xs font-medium truncate ${i === clamped ? 'text-white' : 'text-[#C9D4D0]'}`}>
                  {a.label}
                </span>
                {a.hint && <span className="block text-[10px] text-[#6F7B77] truncate">{a.hint}</span>}
              </span>
              <span className="text-[9px] font-mono uppercase tracking-wider text-[#6F7B77] shrink-0">
                {a.group}
              </span>
            </button>
          ))}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-white/8 text-[10px] font-mono text-[#6F7B77]">
          <span className="flex items-center gap-1">
            <CornerDownLeft size={10} /> run
          </span>
          <span>↑↓ navigate</span>
        </div>
      </motion.div>
    </div>
  );
};

export const MODE_ICONS: Record<WorkspaceMode, React.ReactNode> = {
  agent: <Bot size={15} />,
  plan: <ListChecks size={15} />,
  edit: <Code2 size={15} />,
  ask: <HelpCircle size={15} />,
};

export const PALETTE_NAV_ICONS: Record<string, React.ReactNode> = {
  chat: <SquareTerminal size={15} />,
  plan: <ListChecks size={15} />,
  changes: <GitPullRequest size={15} />,
  verification: <ShieldCheck size={15} />,
  settings: <Sliders size={15} />,
};

export const PALETTE_EXTRAS = {
  newTask: <Plus size={15} />,
  deepReasoning: <Brain size={15} />,
};