import React, { useState, useEffect, useRef } from 'react';
import { CheckCircle2, X, Sparkles, Loader2, AlertCircle } from 'lucide-react';
import { Task } from '../types';

interface TaskCompletionRemarkModalProps {
  isOpen: boolean;
  task: Task | null;
  onClose: () => void; // Cancel action: leaves task incomplete
  onSaveAndComplete: (task: Task, remark: string) => Promise<void>;
  onSkip: (task: Task) => Promise<void>;
}

export const TaskCompletionRemarkModal: React.FC<TaskCompletionRemarkModalProps> = ({
  isOpen,
  task,
  onClose,
  onSaveAndComplete,
  onSkip,
}) => {
  const [remark, setRemark] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Synchronize initial state when modal opens for a task
  useEffect(() => {
    if (isOpen && task) {
      // If task already has a remark (e.g. from prior completion before reopen), prefill it
      setRemark(task.completionRemark || '');
      setErrorMessage(null);
      setIsSaving(false);
      // Auto-focus textarea with slight delay for smooth animation
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      setIsSaving(false);
      setErrorMessage(null);
    }
  }, [isOpen, task?.id]);

  if (!isOpen || !task) return null;

  // Primary action: Save & Complete
  const handleSaveAndComplete = async () => {
    if (isSaving) return; // Prevent double tap / concurrent submission
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSaveAndComplete(task, remark.trim());
      // Modal closed by parent on success
    } catch (err) {
      console.error('Failed to save completion remark:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to complete task. Please check storage and try again.'
      );
      setIsSaving(false); // Keep modal open and keep user's typed remark for retry!
    }
  };

  // Secondary action: Skip for Now
  const handleSkip = async () => {
    if (isSaving) return; // Prevent double tap
    setIsSaving(true);
    setErrorMessage(null);
    try {
      await onSkip(task);
      // Modal closed by parent on success
    } catch (err) {
      console.error('Failed to complete task on skip:', err);
      setErrorMessage(
        err instanceof Error
          ? err.message
          : 'Failed to complete task. Please try again.'
      );
      setIsSaving(false);
    }
  };

  // Cancel action: close popup and leave task incomplete
  const handleCancel = () => {
    if (isSaving) return; // Do not cancel while async persist is in flight
    onClose();
  };

  // Handle keyboard shortcuts (Escape to cancel, Ctrl+Enter to save)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      handleCancel();
    } else if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault();
      handleSaveAndComplete();
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="completion-dialog-title"
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200"
    >
      {/* Click outside to cancel */}
      <div
        className="absolute inset-0"
        onClick={handleCancel}
        aria-hidden="true"
      />

      {/* Modal Dialog Content */}
      <div className="relative w-full max-w-md rounded-2xl bg-[#141624] border border-indigo-500/30 p-5 sm:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.85)] z-10 animate-in zoom-in-95 duration-200">
        {/* Top Header Row with Heading & Close button */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h2
                id="completion-dialog-title"
                className="text-lg font-bold text-white tracking-tight flex items-center gap-1.5"
              >
                <span>Task Completed!</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h2>
              <p className="text-xs text-slate-400 mt-0.5 line-clamp-1 font-medium">
                {task.title}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isSaving}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition disabled:opacity-40 cursor-pointer"
            aria-label="Cancel and close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Error message banner with retry capability */}
        {errorMessage && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 flex items-start gap-2.5 text-xs text-rose-300 animate-in fade-in">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold">Save failed</p>
              <p className="text-rose-300/90 mt-0.5">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Instruction and multiline remark input */}
        <div className="mt-4">
          <label
            htmlFor="completion-remark-field"
            className="block text-xs font-semibold text-slate-200 mb-2"
          >
            Add a remark about your progress.
          </label>
          <textarea
            id="completion-remark-field"
            ref={textareaRef}
            rows={4}
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            disabled={isSaving}
            placeholder="What did you accomplish? What did you learn? Any challenges?"
            className="w-full px-3.5 py-3 rounded-xl bg-black/40 border border-white/10 text-slate-100 placeholder:text-slate-500 text-sm focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition resize-none disabled:opacity-50"
          />
          <div className="mt-1 flex justify-between items-center text-[11px] text-slate-400 px-0.5">
            <span>Optional progress reflections</span>
            <span>{remark.length} chars</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex flex-col-reverse sm:flex-row items-center justify-end gap-2.5">
          {/* Secondary Action: Skip for Now */}
          <button
            type="button"
            onClick={handleSkip}
            disabled={isSaving}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-slate-300 hover:text-white text-xs font-semibold transition disabled:opacity-50 cursor-pointer"
          >
            Skip for Now
          </button>

          {/* Primary Action: Save & Complete */}
          <button
            type="button"
            onClick={handleSaveAndComplete}
            disabled={isSaving}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Saving...</span>
              </>
            ) : (
              <span>Save & Complete</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
