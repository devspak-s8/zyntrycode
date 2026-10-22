import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChatMessage, AgentState, ToolActivityItem } from '../types';
import { StatusBadge } from './StatusBadge';
import { LiveProgress } from './LiveProgress';
import { DiffReview } from './DiffReview';
import {
  User,
  FileCode,
  CheckCircle2,
  Copy,
  RotateCcw,
  HelpCircle,
  GitPullRequest,
  ShieldCheck,
  Timer,
} from 'lucide-react';

export function formatDuration(totalSeconds: number): string {
  const s = Math.max(0, Math.round(totalSeconds));
  const minutes = Math.floor(s / 60);
  const seconds = s % 60;
  if (minutes > 0) return `${minutes}m ${seconds}s`;
  return `${seconds}s`;
}

interface ConversationViewProps {
  messages: ChatMessage[];
  agentState: AgentState;
  liveActivities?: ToolActivityItem[];
  isAgentRunning?: boolean;
  runStartedAt?: number | null;
  streamingText?: string;
  onApplyChanges: () => void;
  onRejectChanges: () => void;
  onRetryVerification: () => void;
  onEscalateModel: () => void;
  onSeedComposer?: (text: string) => void;
  onNavigateTab?: (tab: 'changes' | 'verification') => void;
  isChangesApplied?: boolean;
  /** Retry just the failed stages (reuses prior outputs of the rest). */
  onRetryFailedStages?: () => void;
  /** Ask mode only: convert the answer into a Plan-mode task ("Plan a fix"). */
  onPlanFix?: () => void;
  /** True when the latest summary comes from an ask-mode task. */
  isAskMode?: boolean;
}

export const ConversationView: React.FC<ConversationViewProps> = ({
  messages,
  agentState,
  liveActivities = [],
  isAgentRunning = false,
  runStartedAt = null,
  streamingText = '',
  onApplyChanges,
  onRejectChanges,
  onRetryVerification,
  onSeedComposer,
  onNavigateTab,
  isChangesApplied = false,
  onRetryFailedStages,
  onPlanFix,
  isAskMode = false,
}) => {
  const bottomRef = useRef<HTMLDivElement>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (msg: ChatMessage) => {
    try {
      await navigator.clipboard.writeText(msg.content);
      setCopiedId(msg.id);
      setTimeout(() => setCopiedId(null), 1400);
    } catch {
      /* clipboard unavailable */
    }
  };

  // Keep the live progress card visible as events stream in.
  useEffect(() => {
    if (isAgentRunning && bottomRef.current) {
      bottomRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [isAgentRunning, liveActivities.length, agentState]);

  return (
    <div className="w-full px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-6 space-y-7 pb-36 sm:pb-44 flex flex-col">
      <AnimatePresence initial={false}>
        {messages.map((msg, idx) => {
          const isUser = msg.role === 'user';
          const isLastAssistantMessage = !isUser && idx === messages.length - 1;

          if (isUser) {
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 10, scale: 0.99 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                className="self-end ml-auto max-w-xl sm:max-w-2xl w-auto p-4 sm:p-4.5 bg-[#18212C] hover:bg-[#1C2734] border border-white/10 hover:border-white/18 rounded-[18px] sm:rounded-[20px] text-xs space-y-2.5 shadow-lg transition-all mb-6"
              >
                {/* User Header */}
                <div className="flex items-center justify-between gap-3 text-[11px]">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full bg-white/10 border border-white/15 flex items-center justify-center text-white/90">
                      <User size={12} />
                    </div>
                    <span className="font-semibold text-[#F3F4F6]">Developer</span>
                  </div>
                  <span className="font-mono text-[10px] text-[#9CA3AF]">
                    {msg.timestamp}
                  </span>
                </div>

                {/* Message Body */}
                <div className="text-[#F3F4F6] text-xs sm:text-[13px] leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content}
                </div>

                {/* Attached File Chips */}
                {msg.attachedFiles && msg.attachedFiles.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[11px] font-mono">
                    <span className="text-[#9CA3AF] text-[10px]">Context:</span>
                    {msg.attachedFiles.map((f) => (
                      <span
                        key={f}
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] text-[#93C5FD] shadow-xs"
                      >
                        <FileCode size={10} />
                        <span>{f}</span>
                      </span>
                    ))}
                  </div>
                )}
              </motion.div>
            );
          }

          // Assistant response — full width, lean text; heavy detail lives in panels.
          const hasChanges = !!msg.diffFiles?.length;
          const hasVerification = !!msg.verificationChecks?.length;

          return (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 10, scale: 0.99 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 320, damping: 28 }}
              className="w-full max-w-6xl p-4 sm:p-5 md:p-6 bg-[#121820]/95 hover:bg-[#141C25] border border-white/8 hover:border-white/14 rounded-[22px] sm:rounded-[26px] text-xs space-y-3.5 shadow-xl backdrop-blur-xl transition-all text-left"
            >
              {/* Clean Minimal Header */}
              <div className="flex items-center justify-between gap-3 pb-2.5 border-b border-white/6 text-[11px]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs sm:text-[13px] text-[#F3F4F6] tracking-tight">
                    Zyntry Code
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  {isLastAssistantMessage && <StatusBadge state={agentState} size="sm" />}
                  <span className="font-mono text-[10px] text-[#9CA3AF]">
                    {msg.timestamp}
                  </span>
                </div>
              </div>

              {/* Duration timer below the title */}
              {typeof msg.durationSeconds === 'number' && msg.durationSeconds > 0 && (
                <div className="flex items-center gap-1.5 -mt-2.5 text-[10px] font-mono text-[#6F7B77]">
                  <Timer size={11} className="text-[#6F7B77]" />
                  <span>Took {formatDuration(msg.durationSeconds)}</span>
                </div>
              )}

              {/* Natural narrative text */}
              <div className="text-[#F3F4F6] leading-relaxed whitespace-pre-line text-xs sm:text-[13px] font-sans">
                {msg.content}
              </div>

              {/* Cross-model Consensus Review card */}
              {msg.consensus?.ran && (
                <div
                  className={`rounded-xl border p-3.5 space-y-2.5 ${
                    msg.consensus.verdict === 'approved'
                      ? 'bg-[#0E2A1C]/60 border-[#55E6A5]/30'
                      : msg.consensus.verdict === 'rejected_after_repair'
                      ? 'bg-[#2A161A]/60 border-[#FF7D7D]/30'
                      : 'bg-[#16233A]/60 border-[#82B9FF]/30'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[11px] font-bold tracking-wide text-[#F2F6F4]">
                      Consensus Review ·{' '}
                      {msg.consensus.verdict === 'approved'
                        ? 'this is the fix'
                        : msg.consensus.verdict === 'approved_with_concerns'
                        ? 'approved with concerns'
                        : msg.consensus.verdict === 'rejected_after_repair'
                        ? 'blocking findings remain'
                        : msg.consensus.verdict}
                    </span>
                    <span className="text-[10px] font-mono text-[#A3AEAA] shrink-0">
                      {msg.consensus.agreement?.approve ?? 0}/
                      {(msg.consensus.agreement?.approve ?? 0) +
                        (msg.consensus.agreement?.concerns ?? 0) +
                        (msg.consensus.agreement?.reject ?? 0) || '?'}{' '}
                      agree
                      {msg.consensus.rounds
                        ? ` · ${msg.consensus.rounds} round${msg.consensus.rounds === 1 ? '' : 's'}`
                        : ''}
                    </span>
                  </div>

                  {/* Per-reviewer rows with role priorities */}
                  {msg.consensus.reviewers?.length ? (
                    <div className="space-y-1">
                      {msg.consensus.reviewers.map((r, i) => (
                        <div
                          key={`${r.model}-${i}`}
                          className="flex items-start gap-2 text-[11px]"
                        >
                          <span
                            className={`mt-0.5 shrink-0 px-1.5 py-0.5 rounded font-mono text-[9px] uppercase tracking-wider ${
                              r.role === 'security'
                                ? 'bg-[#2A161A]/80 text-[#FF9D9D]'
                                : r.role === 'integration'
                                ? 'bg-[#16233A]/80 text-[#82B9FF]'
                                : 'bg-white/8 text-[#C9D4D0]'
                            }`}
                          >
                            {r.role}
                          </span>
                          <span className="min-w-0">
                            <span
                              className={`font-semibold ${
                                r.verdict === 'approve'
                                  ? 'text-[#55E6A5]'
                                  : r.verdict === 'reject'
                                  ? 'text-[#FF9D9D]'
                                  : 'text-[#F4C76A]'
                              }`}
                            >
                              {r.verdict}
                            </span>
                            <span className="text-[#A3AEAA]"> · {r.model}</span>
                            {r.reasons?.[0] && (
                              <span className="block text-[#A3AEAA] mt-0.5">
                                {r.reasons[0]}
                              </span>
                            )}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[11px] text-[#A3AEAA]">
                      {msg.consensus.statement || 'No reviewer detail recorded.'}
                    </div>
                  )}

                  {/* Verification status — shown separately, never merged with the verdict */}
                  {msg.consensus.unverified_checks?.length ? (
                    <div className="pt-1 border-t border-white/8 text-[10px] font-mono text-[#6F7B77]">
                      <span className="text-[#F4C76A]">Unverified:</span>{' '}
                      {msg.consensus.unverified_checks.slice(0, 3).join(' · ')}
                    </div>
                  ) : null}

                  {msg.consensus.dissent?.length ? (
                    <div className="pt-1 border-t border-white/8 text-[10px] font-mono text-[#F4C76A] space-y-0.5">
                      {msg.consensus.dissent.slice(0, 3).map((d, i) => (
                        <div key={i}>• {d}</div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )}

              {/* Details live in the panels — chips jump there */}
              {(hasChanges || hasVerification) && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[10px] font-mono text-[#6F7B77] uppercase tracking-wider">
                    Full details:
                  </span>
                  {hasChanges && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('changes')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-[#82B9FF]/40 text-[11px] font-medium text-[#82B9FF] transition-all cursor-pointer"
                    >
                      <GitPullRequest size={11} />
                      <span>Changes ({msg.diffFiles!.length})</span>
                    </button>
                  )}
                  {hasVerification && (
                    <button
                      type="button"
                      onClick={() => onNavigateTab?.('verification')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-[#55E6A5]/40 text-[11px] font-medium text-[#55E6A5] transition-all cursor-pointer"
                    >
                      <ShieldCheck size={11} />
                      <span>Verification</span>
                    </button>
                  )}
                </div>
              )}

              {/* Proposed diff — what changed, added, removed */}
              {hasChanges && (
                <div className="pt-1">
                  <DiffReview
                    files={msg.diffFiles!}
                    onApplyChanges={onApplyChanges}
                    onRejectChanges={onRejectChanges}
                    isApplied={isChangesApplied}
                  />
                </div>
              )}

              {/* Message action bar */}
              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-white/6">
                <button
                  type="button"
                  onClick={() => handleCopy(msg)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-[11px] font-medium text-[#A3AEAA] hover:text-[#F3F4F6] transition-all cursor-pointer"
                  title="Copy response text"
                >
                  {copiedId === msg.id ? (
                    <CheckCircle2 size={12} className="text-[#55E6A5]" />
                  ) : (
                    <Copy size={12} />
                  )}
                  <span>{copiedId === msg.id ? 'Copied' : 'Copy'}</span>
                </button>

                {isLastAssistantMessage && hasChanges && !isChangesApplied && (
                  <button
                    type="button"
                    onClick={onApplyChanges}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#173D30]/60 hover:bg-[#1F4E3E]/70 border border-[#2D9E70]/40 text-[11px] font-semibold text-[#55E6A5] transition-all cursor-pointer"
                    title="Review and authorize the proposed changes"
                  >
                    <CheckCircle2 size={12} />
                    <span>Review & Apply</span>
                  </button>
                )}

                {isLastAssistantMessage && (
                  <>
                    <button
                      type="button"
                      onClick={onRetryVerification}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-[11px] font-medium text-[#A3AEAA] hover:text-[#F3F4F6] transition-all cursor-pointer"
                      title="Re-run this task against the backend"
                    >
                      <RotateCcw size={12} className="text-[#82B9FF]" />
                      <span>Re-run</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => onSeedComposer?.('I want to clarify: ')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/8 hover:border-white/15 text-[11px] font-medium text-[#A3AEAA] hover:text-[#F3F4F6] transition-all cursor-pointer"
                      title="Ask a clarifying question about this result"
                    >
                      <HelpCircle size={12} className="text-[#F4C76A]" />
                      <span>Clarify</span>
                    </button>
                  </>
                )}

                {isLastAssistantMessage && onRetryFailedStages && agentState === 'failed' && (
                  <button
                    type="button"
                    onClick={onRetryFailedStages}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#2A161A]/60 hover:bg-[#341B20]/70 border border-[#FF7D7D]/35 text-[11px] font-semibold text-[#FF9D9D] transition-all cursor-pointer"
                    title="Re-run only the failed stages — prior outputs of the rest are reused"
                  >
                    <RotateCcw size={12} />
                    <span>Retry failed stages</span>
                  </button>
                )}

                {isLastAssistantMessage && onPlanFix && isAskMode && (
                  <button
                    type="button"
                    onClick={onPlanFix}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#16233A]/60 hover:bg-[#1D2E4A]/70 border border-[#82B9FF]/40 text-[11px] font-semibold text-[#82B9FF] transition-all cursor-pointer"
                    title="Turn this answer into a Plan-mode task and open the full implementation plan"
                  >
                    <GitPullRequest size={12} />
                    <span>Plan a fix</span>
                  </button>
                )}
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>

      {/* Inline live execution progress (Codex-style, in the conversation) */}
      {(isAgentRunning || liveActivities.length > 0 || streamingText.length > 0) && (
        <div ref={bottomRef} className="flex flex-col">
          <LiveProgress
            agentState={agentState}
            liveActivities={liveActivities}
            startedAtMs={runStartedAt}
            streamingText={streamingText}
          />
        </div>
      )}

      {/* Inline approval waiting note */}
      {agentState === 'awaiting_approval' && !isAgentRunning && (
        <div ref={bottomRef} className="flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full px-4 py-3 bg-[#121820]/95 border border-[#F4C76A]/30 rounded-[20px] text-xs text-[#A3AEAA] shadow-xl backdrop-blur-xl"
          >
            ⏳ Task planned — answer the approval prompt at the input below to
            continue.
          </motion.div>
        </div>
      )}
    </div>
  );
};