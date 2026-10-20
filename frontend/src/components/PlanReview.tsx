import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { TaskPlanStep } from '../types';
import { ListChecks, Play, X, Check, Loader2 } from 'lucide-react';

/**
 * Plan review card — shown at the input side after a task is planned and
 * before execution. The developer can exclude stages, then run the plan.
 * Excluded stages are sent to the backend as exclude_stage_ids and skipped.
 */

interface PlanReviewProps {
  isOpen: boolean;
  steps: TaskPlanStep[];
  isSubmitting?: boolean;
  onRun: (excludedStageIds: string[]) => void;
  onCancel: () => void;
}

export const PlanReview: React.FC<PlanReviewProps> = ({
  isOpen,
  steps,
  isSubmitting = false,
  onRun,
  onCancel,
}) => {
  const [excluded, setExcluded] = useState<Set<string>>(new Set());

  const includedCount = useMemo(
    () => steps.filter((s) => !excluded.has(s.id)).length,
    [steps, excluded]
  );

  if (!isOpen) return null;

  const toggle = (id: string) => {
    setExcluded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="absolute bottom-4 sm:bottom-6 left-0 right-0 px-3.5 sm:px-6 pointer-events-none z-30 flex justify-center">
      <motion.div
        initial={{ opacity: 0, y: 16, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 16, scale: 0.97 }}
        transition={{ type: 'spring', stiffness: 420, damping: 30 }}
        className="pointer-events-auto w-full max-w-2xl sm:max-w-3xl bg-[#121821]/95 border border-[#93C5FD]/30 rounded-[24px] sm:rounded-[28px] p-4 sm:p-5 space-y-3 shadow-2xl backdrop-blur-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-[#16233A] border border-[#82B9FF]/40 flex items-center justify-center text-[#82B9FF] shrink-0">
              <ListChecks size={15} />
            </div>
            <div>
              <h2 className="text-xs sm:text-[13px] font-bold text-[#F2F6F4] tracking-tight">
                Review the plan before execution
              </h2>
              <p className="text-[11px] text-[#A3AEAA] mt-0.5">
                {steps.length} stages planned — uncheck any you don't want to run
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="text-[#6F7B77] hover:text-[#F2F6F4] p-1.5 rounded-lg hover:bg-white/6 transition-colors cursor-pointer shrink-0 disabled:opacity-40"
            title="Cancel task"
          >
            <X size={14} />
          </button>
        </div>

        {/* Stage list */}
        <div className="space-y-1 max-h-64 overflow-y-auto pr-1">
          {steps.map((step, i) => {
            const isExcluded = excluded.has(step.id);
            return (
              <button
                key={step.id}
                type="button"
                onClick={() => toggle(step.id)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-xs transition-all cursor-pointer border ${
                  isExcluded
                    ? 'bg-white/[0.02] border-white/6 opacity-45'
                    : 'bg-white/[0.04] border-white/10 hover:border-white/20'
                }`}
              >
                <span
                  className={`w-4 h-4 rounded-md border flex items-center justify-center shrink-0 ${
                    isExcluded
                      ? 'border-white/20 bg-transparent'
                      : 'border-[#82B9FF]/50 bg-[#82B9FF]/20'
                  }`}
                >
                  {!isExcluded && <Check size={10} className="text-[#82B9FF]" />}
                </span>
                <span className="font-mono text-[10px] text-[#6F7B77] w-5 shrink-0">
                  {String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className={`flex-1 font-medium truncate ${
                    isExcluded ? 'text-[#6F7B77] line-through' : 'text-[#F2F6F4]'
                  }`}
                >
                  {step.label}
                </span>
                {step.detail && (
                  <span className="text-[10px] font-mono text-[#6F7B77] shrink-0">
                    {step.detail}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 pt-1">
          <motion.button
            type="button"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => onRun(Array.from(excluded))}
            disabled={isSubmitting || includedCount === 0}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#173D30] to-[#1F4E3E] hover:from-[#1F4E3E] hover:to-[#26624E] text-[#55E6A5] border border-[#2D9E70] rounded-xl text-xs font-semibold transition-all cursor-pointer shadow-lg disabled:opacity-60"
          >
            {isSubmitting ? <Loader2 size={13} className="animate-spin" /> : <Play size={13} />}
            <span>Run {includedCount} stage{includedCount === 1 ? '' : 's'}</span>
          </motion.button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isSubmitting}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-xs font-medium text-[#A3AEAA] hover:text-[#F2F6F4] transition-all cursor-pointer disabled:opacity-40"
          >
            Cancel
          </button>
        </div>
      </motion.div>
    </div>
  );
};