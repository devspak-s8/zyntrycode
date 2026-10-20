import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { RoutingMode, RoutingInfo, TaskSession } from '../types';
import { StatusBadge } from './StatusBadge';
import { RivetLogo } from './RivetLogo';
import {
  GitBranch,
  FolderGit2,
  ChevronDown,
  Check,
  Plus,
  History,
  SquareTerminal,
  GitPullRequest,
  ShieldCheck,
  Scale,
  Sliders,
  PanelTop,
  Cpu,
  Brain,
} from 'lucide-react';

export type NavTab =
  | 'chat'
  | 'plan'
  | 'changes'
  | 'verification'
  | 'constitution'
  | 'history'
  | 'settings';

interface TopBarProps {
  repoName: string;
  branch: string;
  currentTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  sessions: TaskSession[];
  activeSessionId: string;
  onSelectSession: (id: string) => void;
  onNewTask: () => void;
  routingMode: RoutingMode;
  onRoutingModeChange: (rm: RoutingMode) => void;
  deepReasoning: boolean;
  onDeepReasoningChange: (enabled: boolean) => void;
  routingInfo: RoutingInfo;
}

const NAV_ITEMS: { id: NavTab; label: string; icon: React.ReactNode }[] = [
  { id: 'chat', label: 'Chat', icon: <SquareTerminal size={14} /> },
  { id: 'changes', label: 'Changes', icon: <GitPullRequest size={14} /> },
  { id: 'verification', label: 'Verification', icon: <ShieldCheck size={14} /> },
  { id: 'constitution', label: 'Constitution', icon: <Scale size={14} /> },
  { id: 'settings', label: 'Settings', icon: <Sliders size={14} /> },
];

export const TopBar: React.FC<TopBarProps> = ({
  repoName,
  branch,
  currentTab,
  onSelectTab,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewTask,
  routingMode,
  onRoutingModeChange,
  deepReasoning,
  onDeepReasoningChange,
}) => {
  const [showNavMenu, setShowNavMenu] = useState(false);
  const [showHistoryMenu, setShowHistoryMenu] = useState(false);
  const [showRoutingMenu, setShowRoutingMenu] = useState(false);
  // Each dropdown owns its containment ref: a mousedown inside a menu must NOT
  // close it (closing on mousedown unmounts the item mid-click, so the click
  // never fires — pages appeared to not open).
  const navRef = useRef<HTMLDivElement>(null);
  const historyRef = useRef<HTMLDivElement>(null);
  const routingRef = useRef<HTMLDivElement>(null);
  const routingModes: RoutingMode[] = ['auto', 'fast', 'balanced', 'quality'];

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (navRef.current && !navRef.current.contains(target)) setShowNavMenu(false);
      if (historyRef.current && !historyRef.current.contains(target)) setShowHistoryMenu(false);
      if (routingRef.current && !routingRef.current.contains(target)) setShowRoutingMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const activeNavItem = NAV_ITEMS.find((n) => n.id === currentTab);
  const recentSessions = sessions.slice(0, 4);

  return (
    <header className="h-13 sm:h-14 border-b border-white/6 bg-[#0D1217]/95 backdrop-blur-xl px-4 sm:px-6 flex items-center justify-between gap-2 sm:gap-3 shrink-0 select-none z-30">
      {/* Left: brand + new task + repo pill */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        <div className="flex items-center gap-2 pr-1">
          <RivetLogo size="sm" />
          <span className="font-bold text-xs sm:text-[13px] text-[#F3F4F6] tracking-tight hidden sm:inline">
            Zyntry Code
          </span>
        </div>

        {/* New Task button */}
        <motion.button
          type="button"
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          onClick={onNewTask}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 hover:border-white/20 text-[#F3F4F6] text-xs font-medium cursor-pointer transition-all shadow-sm shrink-0"
          title="Start a new task (chat)"
        >
          <Plus size={13} />
          <span className="hidden sm:inline">New Task</span>
        </motion.button>

        {/* Pages dropdown */}
        <div className="relative" ref={navRef}>
          <button
            type="button"
            onClick={() => {
              setShowNavMenu(!showNavMenu);
              setShowHistoryMenu(false);
              setShowRoutingMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-all cursor-pointer shadow-sm"
            title="Open a page"
          >
            {activeNavItem?.icon}
            <span className="hidden lg:inline">{activeNavItem?.label}</span>
            <ChevronDown size={12} className={`text-[#9CA3AF] transition-transform ${showNavMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showNavMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 mt-2 w-52 bg-[#141A22] border border-white/12 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl space-y-0.5"
              >
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono text-[#9CA3AF] border-b border-white/6 mb-1">
                  Pages
                </div>
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      onSelectTab(item.id);
                      setShowNavMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs cursor-pointer transition-colors ${
                      currentTab === item.id
                        ? 'text-[#93C5FD] font-semibold bg-white/10'
                        : 'text-[#A3AEAA] hover:text-[#F3F4F6] hover:bg-white/5'
                    }`}
                  >
                    <span className="text-[#93C5FD]">{item.icon}</span>
                    <span>{item.label}</span>
                    {currentTab === item.id && <Check size={12} className="ml-auto text-[#93C5FD]" />}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Repo pill (hidden on small screens) */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-xs font-mono text-[#F2F6F4] shadow-xs">
          <FolderGit2 size={13} className="text-[#93C5FD] shrink-0" />
          <span className="font-semibold truncate max-w-32">{repoName}</span>
          <span className="text-white/20">/</span>
          <span className="text-[#9CA3AF] flex items-center gap-1">
            <GitBranch size={11} className="text-[#93C5FD]/70" />
            <span>{branch}</span>
          </span>
        </div>
      </div>

      {/* Right: history dropdown + routing tier */}
      <div className="flex items-center gap-2 sm:gap-2.5 shrink-0">
        {/* History dropdown — 4 recent sessions */}
        <div className="relative" ref={historyRef}>
          <button
            type="button"
            onClick={() => {
              setShowHistoryMenu(!showHistoryMenu);
              setShowNavMenu(false);
              setShowRoutingMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#F3F4F6] transition-all cursor-pointer shadow-sm"
            title="Recent sessions"
          >
            <History size={14} className="text-[#F4C76A]" />
            <ChevronDown size={12} className={`text-[#9CA3AF] transition-transform ${showHistoryMenu ? 'rotate-180' : ''}`} />
          </button>

          <AnimatePresence>
            {showHistoryMenu && (
              <motion.div
                initial={{ opacity: 0, y: 8, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 8, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 mt-2 w-80 bg-[#141A22] border border-white/12 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl space-y-0.5"
              >
                <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono text-[#9CA3AF] border-b border-white/6 mb-1">
                  Recent Sessions
                </div>
                {recentSessions.length === 0 ? (
                  <p className="px-3 py-2 text-[11px] text-[#6F7B77]">No sessions yet.</p>
                ) : (
                  recentSessions.map((sess) => (
                    <button
                      key={sess.id}
                      type="button"
                      onClick={() => {
                        onSelectSession(sess.id);
                        setShowHistoryMenu(false);
                      }}
                      className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl text-left cursor-pointer transition-colors ${
                        sess.id === activeSessionId
                          ? 'bg-white/10'
                          : 'hover:bg-white/5'
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-medium text-[#F2F6F4] truncate">
                          {sess.title}
                        </div>
                        <div className="text-[10px] font-mono text-[#6F7B77]">
                          {sess.createdAt} · ${sess.routing.actualCost.toFixed(4)}
                        </div>
                      </div>
                      <StatusBadge state={sess.state} size="sm" />
                    </button>
                  ))
                )}
                <button
                  type="button"
                  onClick={() => {
                    onSelectTab('history');
                    setShowHistoryMenu(false);
                  }}
                  className="w-full flex items-center gap-2 px-2.5 py-2 rounded-xl text-xs text-[#93C5FD] hover:bg-white/5 border-t border-white/6 mt-1 cursor-pointer transition-colors"
                >
                  <PanelTop size={13} />
                  <span>See all history</span>
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Model routing selector pill */}
        <div className="relative" ref={routingRef}>
          <button
            type="button"
            onClick={() => {
              setShowRoutingMenu(!showRoutingMenu);
              setShowNavMenu(false);
              setShowHistoryMenu(false);
            }}
            className="flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-full bg-white/6 hover:bg-white/10 border border-white/10 text-xs font-mono transition-all cursor-pointer shadow-xs"
            title="Configure routing policy"
          >
            <Cpu size={13} className="text-[#93C5FD] sm:hidden" />
            <span className="text-[11px] text-[#9CA3AF] font-sans hidden sm:inline">Tier:</span>
            <span className="uppercase text-[#93C5FD] font-semibold tracking-wider hidden sm:inline">{routingMode}</span>
            <ChevronDown size={12} className={`text-[#9CA3AF] transition-transform ${showRoutingMenu ? 'rotate-180' : ''}`} />
          </button>

          {showRoutingMenu && (
            <div className="absolute right-0 mt-2 w-48 bg-[#141A22] border border-white/12 rounded-2xl shadow-2xl p-1.5 z-50 backdrop-blur-xl space-y-1">
              <div className="px-2.5 py-1.5 text-[10px] uppercase font-mono text-[#9CA3AF] border-b border-white/6 pb-1.5 mb-1">
                Routing Tier
              </div>
              {routingModes.map((rm) => (
                <button
                  key={rm}
                  type="button"
                  onClick={() => {
                    onRoutingModeChange(rm);
                    setShowRoutingMenu(false);
                  }}
                  className={`w-full text-left px-2.5 py-1.5 text-xs font-mono uppercase rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                    routingMode === rm
                      ? 'text-[#93C5FD] font-semibold bg-white/10'
                      : 'text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5'
                  }`}
                >
                  <span>{rm}</span>
                  {routingMode === rm && <Check size={12} className="text-[#93C5FD]" />}
                </button>
              ))}

              {/* Deep reasoning lives with routing — not in the composer. */}
              <button
                type="button"
                onClick={() => onDeepReasoningChange(!deepReasoning)}
                className="w-full text-left px-2.5 py-1.5 text-xs rounded-xl flex items-center justify-between gap-2 cursor-pointer transition-colors border-t border-white/6 mt-1 pt-2 text-[#9CA3AF] hover:text-[#F3F4F6] hover:bg-white/5"
                title="Force the strongest reasoning tier for planning and execution"
              >
                <span className="flex items-center gap-1.5">
                  <Brain size={12} className={deepReasoning ? 'text-[#93C5FD]' : 'text-[#6F7B77]'} />
                  <span className="font-sans">Deep reasoning</span>
                </span>
                <span
                  className={`w-7 h-4 rounded-full border flex items-center px-0.5 transition-all ${
                    deepReasoning
                      ? 'bg-[#82B9FF]/30 border-[#82B9FF]/50 justify-end'
                      : 'bg-white/5 border-white/15 justify-start'
                  }`}
                >
                  <span
                    className={`w-3 h-3 rounded-full ${
                      deepReasoning ? 'bg-[#82B9FF]' : 'bg-white/30'
                    }`}
                  />
                </span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};