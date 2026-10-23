import React, { useState } from 'react';
import { X, Mail, CheckCircle2, AlertCircle, Loader2, RotateCcw } from 'lucide-react';
import { AuthService } from '../services/auth';
import { UserProfile } from '../types';

interface EmailVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onVerificationSuccess: (updated: UserProfile) => void;
  initialCode?: string;
}

export const EmailVerificationModal: React.FC<EmailVerificationModalProps> = ({
  isOpen,
  onClose,
  user,
  onVerificationSuccess,
  initialCode = '',
}) => {
  const [code, setCode] = useState(initialCode);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [resendSuccess, setResendSuccess] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      setError('Please enter the verification code.');
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const updated = await AuthService.verifyEmail(user.id, code);
      onVerificationSuccess(updated);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Verification failed.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setError(null);
    setResendSuccess(null);
    try {
      const newCode = await AuthService.resendVerificationCode(user.id);
      setResendSuccess(`Fresh verification code generated: ${newCode}`);
      setCode(newCode); // Pre-fill for offline convenience
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="verify-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-sm rounded-3xl bg-[#141624] border border-white/10 p-6 shadow-2xl z-10 animate-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between pb-3 border-b border-white/5">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-indigo-400" />
            <h3 id="verify-modal-title" className="text-sm font-bold text-white">
              Verify Your Email
            </h3>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg text-slate-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-300 leading-relaxed">
          Please enter the 6-digit confirmation code generated for <strong className="text-white">{user.email}</strong>.
        </p>

        {error && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {resendSuccess && (
          <div className="mt-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{resendSuccess}</span>
          </div>
        )}

        <form onSubmit={handleVerify} className="mt-4 space-y-3.5">
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 mb-1">
              6-Digit Verification Code
            </label>
            <input
              type="text"
              required
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              placeholder="123456"
              className="w-full text-center tracking-[0.3em] font-mono text-base px-3.5 py-2.5 rounded-xl bg-black/40 border border-white/10 text-white focus:outline-none focus:border-indigo-500 transition"
              autoFocus
            />
          </div>

          <div className="flex items-center justify-between pt-1 text-xs">
            <button
              type="button"
              onClick={handleResend}
              className="text-slate-400 hover:text-indigo-400 flex items-center gap-1 transition cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Resend Code</span>
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30 transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Confirm Verification'}
          </button>
        </form>
      </div>
    </div>
  );
};
