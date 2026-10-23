import React, { useState } from 'react';
import { 
  X, 
  User, 
  Mail, 
  CheckCircle, 
  AlertTriangle, 
  Calendar, 
  LogOut, 
  Trash2, 
  Edit3, 
  Check, 
  Loader2, 
  ShieldCheck, 
  KeyRound, 
  BarChart3,
  CheckCircle2,
  Clock,
  AlertCircle
} from 'lucide-react';
import { Task, UserProfile } from '../types';
import { AuthService } from '../services/auth';
import { isTaskOverdue } from '../utils/dateUtils';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  tasks: Task[];
  onUpdateProfile: (updated: UserProfile) => void;
  onLogout: () => void;
  onDeleteAccount: () => void;
  onOpenVerifyModal: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  tasks,
  onUpdateProfile,
  onLogout,
  onDeleteAccount,
  onOpenVerifyModal,
}) => {
  const [isEditingName, setIsEditingName] = useState(false);
  const [displayName, setDisplayName] = useState(user.displayName);
  const [isSavingName, setIsSavingName] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Account deletion dialog state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  if (!isOpen) return null;

  // Calculate live statistics for this user
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.completed).length;
  const pendingTasks = tasks.filter((t) => !t.completed).length;
  const overdueTasks = tasks.filter((t) => isTaskOverdue(t)).length;
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  // Initials for avatar
  const initials = user.displayName
    ? user.displayName
        .split(' ')
        .map((p) => p[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
    : 'U';

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  const handleSaveDisplayName = async () => {
    if (!displayName.trim()) return;
    setIsSavingName(true);
    setError(null);
    try {
      const updated = await AuthService.updateProfile(user.id, {
        displayName: displayName.trim(),
      });
      onUpdateProfile(updated);
      setIsEditingName(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to update name');
    } finally {
      setIsSavingName(false);
    }
  };

  const handleConfirmDeleteAccount = async () => {
    setIsDeleting(true);
    setDeleteError(null);
    try {
      await AuthService.deleteAccount(user.id, deletePassword);
      onDeleteAccount();
      onClose();
    } catch (err: unknown) {
      setDeleteError(err instanceof Error ? err.message : 'Failed to delete account');
      setIsDeleting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="absolute inset-0" onClick={onClose} aria-hidden="true" />

      <div className="relative w-full max-w-lg rounded-3xl bg-[#141624] border border-white/10 p-6 sm:p-7 shadow-2xl z-10 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header with Close */}
        <div className="flex items-center justify-between pb-4 border-b border-white/5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-indigo-400" />
            <h2 id="profile-modal-title" className="text-base font-bold text-white tracking-tight">
              User Profile & Account
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
            aria-label="Close profile"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mt-3.5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-xs text-rose-300">
            {error}
          </div>
        )}

        {/* Profile Card Banner */}
        <div className="mt-5 p-4 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-purple-950/20 to-[#0e101c] border border-indigo-500/20 flex flex-col sm:flex-row items-center sm:items-start gap-4">
          {/* Avatar Initials */}
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white text-xl font-extrabold shadow-lg shadow-indigo-600/30 shrink-0">
            {initials}
          </div>

          <div className="flex-1 text-center sm:text-left min-w-0">
            {/* Display Name with Edit option */}
            {isEditingName ? (
              <div className="flex items-center gap-2 mt-1">
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="px-2.5 py-1 text-sm rounded-lg bg-black/40 border border-indigo-500 text-white focus:outline-none"
                  autoFocus
                />
                <button
                  type="button"
                  onClick={handleSaveDisplayName}
                  disabled={isSavingName}
                  className="p-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition disabled:opacity-50"
                  aria-label="Save display name"
                >
                  {isSavingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsEditingName(false);
                    setDisplayName(user.displayName);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition"
                  aria-label="Cancel edit"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center justify-center sm:justify-start gap-2">
                <h3 className="text-lg font-bold text-white truncate">{user.displayName}</h3>
                <button
                  type="button"
                  onClick={() => setIsEditingName(true)}
                  className="p-1 rounded text-slate-400 hover:text-indigo-400 transition"
                  aria-label="Edit display name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Email Address */}
            <div className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-xs text-slate-400">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              <span className="truncate">{user.email}</span>
            </div>

            {/* Verification Status Badge */}
            <div className="mt-2.5 flex items-center justify-center sm:justify-start gap-2">
              {user.isEmailVerified ? (
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-[11px] font-semibold">
                  <CheckCircle className="w-3 h-3" />
                  <span>Email Verified</span>
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-400 text-[11px] font-semibold">
                    <AlertTriangle className="w-3 h-3" />
                    <span>Unverified</span>
                  </span>
                  <button
                    type="button"
                    onClick={onOpenVerifyModal}
                    className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold underline underline-offset-2 transition"
                  >
                    Verify Now
                  </button>
                </div>
              )}

              <span className="text-[11px] text-slate-500 flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>Joined {memberSince}</span>
              </span>
            </div>
          </div>
        </div>

        {/* Live Task Statistics Grid */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Personal Task Analytics</span>
            </h4>
            <span className="text-xs font-semibold text-indigo-400">{completionRate}% Completed</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <div className="p-3 rounded-2xl bg-[#11131e] border border-white/5 text-center">
              <span className="block text-xl font-extrabold text-white">{totalTasks}</span>
              <span className="text-[11px] font-medium text-slate-400">Total Tasks</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#11131e] border border-white/5 text-center">
              <span className="block text-xl font-extrabold text-amber-400">{pendingTasks}</span>
              <span className="text-[11px] font-medium text-slate-400">Active</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#11131e] border border-white/5 text-center">
              <span className="block text-xl font-extrabold text-emerald-400">{completedTasks}</span>
              <span className="text-[11px] font-medium text-slate-400">Done</span>
            </div>
            <div className="p-3 rounded-2xl bg-[#11131e] border border-white/5 text-center">
              <span className="block text-xl font-extrabold text-rose-400">{overdueTasks}</span>
              <span className="text-[11px] font-medium text-slate-400">Overdue</span>
            </div>
          </div>
        </div>

        {/* Account Deletion Confirmation Modal Step */}
        {showDeleteConfirm ? (
          <div className="mt-6 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 animate-in fade-in">
            <div className="flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
              <div>
                <h5 className="text-xs font-bold text-rose-300">Permanently Delete Account?</h5>
                <p className="text-[11px] text-rose-300/80 mt-1 leading-relaxed">
                  This will permanently delete your account profile and all personal tasks associated with this user ID.
                  This action is irreversible.
                </p>
              </div>
            </div>

            {deleteError && (
              <div className="mt-2 text-xs text-rose-400 font-semibold">{deleteError}</div>
            )}

            <div className="mt-3">
              <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                Confirm your account password:
              </label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                placeholder="Enter password"
                className="w-full px-3 py-2 rounded-xl bg-black/40 border border-rose-500/30 text-white placeholder-slate-500 text-xs focus:outline-none focus:border-rose-500 transition"
              />
            </div>

            <div className="mt-3.5 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword('');
                  setDeleteError(null);
                }}
                disabled={isDeleting}
                className="px-3 py-1.5 rounded-xl border border-white/10 text-slate-300 hover:text-white text-xs font-semibold transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteAccount}
                disabled={isDeleting || !deletePassword}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30 transition flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Delete Account Forever</span>
              </button>
            </div>
          </div>
        ) : (
          /* Profile Actions */
          <div className="mt-6 pt-5 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-rose-400/80 hover:text-rose-400 transition flex items-center gap-1.5 py-1 px-2 rounded-lg hover:bg-rose-500/10 cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Account</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onLogout();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
