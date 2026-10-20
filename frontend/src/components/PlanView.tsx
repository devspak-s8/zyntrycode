import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TaskPlanStep } from '../types';
import {
  ListChecks,
  Play,
  X,
  Check,
  Loader2,
  ArrowRight,
  Layers,
  GitBranch,
  RotateCcw,
} from 'lucide-react';

interface PlanViewProps {
  steps: TaskPlanStep[];
  summary?: string;
  isPendingReview?: boolean;
  isRunning?: boolean;
  onRun: (excludedStageIds: string[]) => void;
  onCancel: () => void;
  /** Retry a single failed stage (reuses prior outputs of everything else). */
  onRetryStage?: (stageId: string) => void;
}

/**
 * The full implementation plan, in its own tab. Plan mode is the only flow
 * that stops before execution: review every stage here, uncheck the ones you
 * don't want, then run. Non-plan executions show the same plan read-only.
 */
export const PlanView: React.FC<PlanViewProps> = ({
  steps,
  summary,
  isPendingReview = false,
  isRunning = false,
  onRun,
  onCancel,
  onRetryStage,
}) => {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());
  const includedCount = useMemo(
    () => steps.filter((s) => !excluded.has(s.id)).length,
    [steps, excluded]
  );

  const toggle = (id: string) => {
    if (!isPendingReview) return;
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (steps.length === 0) {
    return (
      <div className="px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-10 w-full">
        <div className="max-w-3xl mx-auto text-center space-y-3 py-16">
          <div className="w-12 h-12 mx-auto rounded-2xl bg-[#16233A] border border-[#82B9FF]/30 flex items-center justify-center text-[#82B9FF]">
            <ListChecks size={20} />
          </div>
          <h2 className="text-base font-bold text-[#F2F6F4]">No implementation plan yet</h2>
          <p className="text-xs text-[#A3AEAA] max-w-md mx-auto leading-relaxed">
            Select <span className="text-[#93C5FD] font-semibold">Plan</span> in the composer,
            describe the task, and Zyntry will draft a complete implementation plan here
            before anything runs.
          </p>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="px-4 sm:px-10 md:px-16 lg:px-20 xl:px-24 py-6 sm:py-8 w-full pb-40"
    >
      <div className="max-w-4xl mx-auto space-y-5">
        {/* Header */}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#16233A] border border-[#82B9FF]/35 flex items-center justify-center text-[#82B9FF] shrink-0">
                <ListChecks size={16} />
              </div>
              <div>
                <h2 className="text-base sm:text-lg font-bold text-[#F2F6F4] tracking-tight">
                  Implementation Plan
                </h2>
                <p className="text-[11px] text-[#A3AEAA] mt-0.5">
                  {steps.length} stages ·{' '}
                  {isPendingReview
                    ? 'review, exclude anything you do not want, then run'
                    : 'the plan this execution followed'}
                </p>
              </div>
            </div>
            {summary && (
              <p className="text-xs text-[#C9D4D0] leading-relaxed mt-3 max-w-2xl">
                {summary}
              </p>
            )}
          </div>

          {isPendingReview && (
            <div className="flex items-center gap-2 shrink-0">
              <motion.button
                type="button"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => onRun(Array.from(excluded))}
                disabled={isRunning || includedCount === 0}
                className="flex items-center gap-2 px-4 py-2.5 rounded-full bg-gradient-to-r from-[#173D30] to-[#1F4E3E] hover:from-[#1F4E3E] hover:to-[#26624E] text-[#55E6A5] border border-[#2D9E70] text-xs font-semibold cursor-pointer shadow-lg disabled:opacity-50 transition-all"
              >
                {isRunning ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
                <span>
                  Run {includedCount} stage{includedCount === 1 ? '' : 's'}
                </span>
              </motion.button>
              <button
                type="button"
                onClick={onCancel}
                disabled={isRunning}
                className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-[#A3AEAA] hover:text-[#F2F6F4] cursor-pointer transition-all disabled:opacity-40"
                title="Discard this plan"
              >
                <X size={14} />
              </button>
            </div>
          )}
        </div>

        {/* Stage cards */}
        <div className="space-y-2.5">
          {steps.map((step, i) => {
            const isExcluded = excluded.has(step.id);
            const stepIndex = String(i + 1).padStart(2, '0');
            return (
              <motion.button
                key={step.id}
                type="button"
                onClick={() => toggle(step.id)}
                disabled={!isPendingReview}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className={`w-full text-left rounded-2xl border p-4 transition-all ${
                  isPendingReview ? 'cursor-pointer' : 'cursor-default'
                } ${
                  isExcluded
                    ? 'bg-white/[0.02] border-white/6 opacity-45'
                    : 'bg-[#121820]/95 border-white/10 hover:border-white/20'
                }`}
              >
                <div className="flex items-start gap-3">
                  {isPendingReview && (
                    <span
                      className={`mt-0.5 w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                        isExcluded
                          ? 'border-white/20 bg-transparent'
                          : 'border-[#82B9FF]/50 bg-[#82B9FF]/20'
                      }`}
                    >
                      {!isExcluded && <Check size={10} className="text-[#82B9FF]" />}
                    </span>
                  )}
                  <span className="font-mono text-[10px] text-[#6F7B77] bg-[#0A0D0E] px-1.5 py-0.5 rounded border border-white/5 mt-0.5 shrink-0">
                    {stepIndex}
                  </span>
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span
                        className={`text-xs sm:text-sm font-semibold ${
                          isExcluded
                            ? 'text-[#6F7B77] line-through'
                            : 'text-[#F2F6F4]'
                        }`}
                      >
                        {step.label}
                      </span>
                      {step.detail && (
                        <span className="text-[10px] font-mono uppercase tracking-wider text-[#93C5FD] bg-[#16233A]/70 border border-[#82B9FF]/20 rounded-full px-2 py-0.5">
                          {step.detail}
                        </span>
                      )}
                      {isExcluded && (
                        <span className="text-[10px] font-mono text-[#FF7D7D]">
                          excluded
                        </span>
                      )}
                    </div>
                    {step.description && (
                      <p className="text-[11px] sm:text-xs text-[#A3AEAA] leading-relaxed">
                        {step.description}
                      </p>
                    )}
                    <div className="flex flex-wrap items-center gap-3 text-[10px] font-mono text-[#6F7B77] pt-0.5">
                      {(step.dependencies?.length ?? 0) > 0 && (
                        <span className="flex items-center gap-1">
                          <Layers size={10} />
                          {step.dependencies?.length} dep
                          {(step.dependencies?.length ?? 0) === 1 ? '' : 's'}
                        </span>
                      )}
                      {step.durationMs != null && (
                        <span>{(step.durationMs / 1000).toFixed(1)}s</span>
                      )}
                      {step.status !== 'pending' && (
                        <span
                          className={
                            step.status === 'complete'
                              ? 'text-[#55E6A5]'
                              : step.status === 'failed'
                              ? 'text-[#FF7D7D]'
                              : 'text-[#F4C76A]'
                          }
                        >
                          {step.status}
                        </span>
                      )}
                    </div>
                  </div>
                  {isPendingReview ? (
                    <ArrowRight
                      size={13}
                      className={`shrink-0 mt-1 ${
                        isExcluded ? 'text-[#3A423F]' : 'text-[#6F7B77]'
                      }`}
                    />
                  ) : step.status === 'failed' && onRetryStage && !isRunning ? (
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        onRetryStage(step.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.stopPropagation();
                          onRetryStage(step.id);
                        }
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#2A161A]/70 hover:bg-[#341B20] border border-[#FF7D7D]/35 text-[10px] font-mono text-[#FF9D9D] cursor-pointer shrink-0 mt-0.5"
                      title="Retry this stage — prior outputs of the rest are reused"
                    >
                      <RotateCcw size={10} />
                      retry
                    </span>
                  ) : (
                    <GitBranch size={13} className="text-[#3A423F] shrink-0 mt-1" />
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>

        {isPendingReview && (
          <p className="text-[10px] font-mono text-[#6F7B77] px-1">
            The same review is available inline in Chat. Excluded stages are recorded as
            <span className="text-[#FF7D7D]"> skipped</span>, never reported as passed.
          </p>
        )}
      </div>
    </motion.div>
  );
};
