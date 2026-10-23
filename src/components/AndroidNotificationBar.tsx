import React, { useState, useEffect } from 'react';
import { 
  Bell, 
  CheckCircle2, 
  Clock, 
  ChevronDown, 
  ChevronUp, 
  Volume2, 
  VolumeX, 
  ShieldAlert, 
  Plus, 
  Check, 
  RotateCcw,
  Sparkles,
  ExternalLink
} from 'lucide-react';
import { ActiveNotification, Task, UserPreferences } from '../types';
import { localDateKey, isTaskOverdue } from '../utils/dateUtils';

interface AndroidNotificationBarProps {
  notifications: ActiveNotification[];
  tasks: Task[];
  preferences: UserPreferences;
  onDismissNotification: (id: string) => void;
  onClearAllNotifications: () => void;
  onCompleteTask: (taskId: string) => void;
  onSnoozeTask: (taskId: string, minutes: number) => void;
  onOpenTask: (taskId: string) => void;
  onQuickAdd: () => void;
  onToggleSound: () => void;
  onOpenAndroidGuide: () => void;
  onOpenPermissionsModal: () => void;
  notificationPermission: 'granted' | 'denied' | 'default' | 'unsupported';
}

export const AndroidNotificationBar: React.FC<AndroidNotificationBarProps> = ({
  notifications,
  tasks,
  preferences,
  onDismissNotification,
  onClearAllNotifications,
  onCompleteTask,
  onSnoozeTask,
  onOpenTask,
  onQuickAdd,
  onToggleSound,
  onOpenAndroidGuide,
  onOpenPermissionsModal,
  notificationPermission,
}) => {
  const [isShadeOpen, setIsShadeOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: preferences.timeFormat === '12h' })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, [preferences.timeFormat]);

  // Today calculations
  const todayStr = localDateKey();
  const todayTasks = tasks.filter((t) => t.dueDate === todayStr);
  const pendingCount = todayTasks.filter((t) => !t.completed).length;
  const completedCount = todayTasks.filter((t) => t.completed).length;
  const overdueCount = tasks.filter((t) => isTaskOverdue(t)).length;

  const totalNotifs = notifications.length + (preferences.persistentTodayNotification && pendingCount > 0 ? 1 : 0);

  return (
    <div className="w-full relative z-40">
      {/* Android Top Status Bar */}
      <div 
        onClick={() => setIsShadeOpen(!isShadeOpen)}
        className="w-full bg-[#07080c] px-4 py-1.5 flex items-center justify-between text-slate-400 text-[11px] font-mono tracking-tight select-none border-b border-white/[0.04] cursor-pointer hover:bg-slate-900/60 transition"
        role="button"
        aria-expanded={isShadeOpen}
        aria-label="Toggle Android notification shade"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-slate-200">{currentTime || '12:00'}</span>
          {/* Notification Icons in Status Bar */}
          <div className="flex items-center gap-1.5 ml-1">
            {totalNotifs > 0 && (
              <span className="relative flex h-2 w-2" title={`${totalNotifs} active alert${totalNotifs > 1 ? 's' : ''}`}>
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
            )}
            {notifications.length > 0 && (
              <Bell className="w-3 h-3 text-indigo-400" />
            )}
            {overdueCount > 0 && (
              <Clock className="w-3 h-3 text-rose-400" />
            )}
          </div>
        </div>

        <div className="flex items-center gap-3 text-slate-300">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleSound();
            }}
            className="hover:text-white transition p-1"
            title={preferences.soundEnabled ? 'Chime sound ON' : 'Chime sound MUTED'}
            aria-label={preferences.soundEnabled ? 'Mute notification sound' : 'Unmute notification sound'}
          >
            {preferences.soundEnabled ? <Volume2 className="w-3.5 h-3.5 text-slate-400" /> : <VolumeX className="w-3.5 h-3.5 text-slate-600" />}
          </button>
          {totalNotifs > 0 && (
            <span className="px-1.5 py-0.2 text-[10px] bg-indigo-500/20 text-indigo-300 rounded font-sans">
              {totalNotifs}
            </span>
          )}
          <span className="text-[10px] text-slate-500 flex items-center gap-1">
            <span className="text-[10px] font-sans text-slate-400">Shade</span>
            {isShadeOpen ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </span>
        </div>
      </div>

      {/* Android Notification Shade Drawer */}
      {isShadeOpen && (
        <div className="w-full bg-[#0d0f18]/95 backdrop-blur-xl border-b border-indigo-500/20 shadow-2xl p-4 transition-all animate-in slide-in-from-top-2 duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <Bell className="w-3.5 h-3.5 text-indigo-400" />
                Android Notification Shade
              </span>
              {notificationPermission !== 'granted' && (
                <button
                  onClick={onOpenPermissionsModal}
                  className="text-[10px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-2 py-0.5 rounded-full hover:bg-amber-500/30 transition cursor-pointer"
                >
                  Enable System Alerts
                </button>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={onOpenAndroidGuide}
                className="text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 transition"
              >
                <span>APK & Battery Guide</span>
                <ExternalLink className="w-3 h-3" />
              </button>
              {notifications.length > 0 && (
                <button
                  onClick={onClearAllNotifications}
                  className="text-[11px] text-slate-400 hover:text-white px-2 py-0.5 rounded hover:bg-white/5 transition"
                >
                  Clear All
                </button>
              )}
            </div>
          </div>

          <div className="mt-3 space-y-2.5 max-h-[380px] overflow-y-auto pr-1">
            {/* Optional Persistent "Today's Tasks" Notification */}
            {preferences.persistentTodayNotification && (
              <div className="bg-[#151827] border border-indigo-500/20 rounded-xl p-3 shadow-md hover:border-indigo-500/40 transition">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
                    <span className="font-semibold text-white">Chronos · Daily Tasks</span>
                    <span className="text-[10px] text-slate-500">Persistent</span>
                  </div>
                  <span className="text-[11px] font-mono text-indigo-400 font-medium">
                    {completedCount}/{todayTasks.length} done
                  </span>
                </div>

                <p className="mt-1.5 text-xs text-slate-300">
                  {pendingCount === 0 
                    ? '🎉 All daily targets completed! Great work today.'
                    : `You have ${pendingCount} pending task${pendingCount > 1 ? 's' : ''} remaining today.${overdueCount > 0 ? ` (${overdueCount} overdue)` : ''}`}
                </p>

                {/* Progress bar */}
                <div className="mt-2.5 w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                  <div 
                    className="bg-gradient-to-r from-indigo-500 to-purple-500 h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${todayTasks.length > 0 ? Math.round((completedCount / todayTasks.length) * 100) : 100}%`
                    }}
                  />
                </div>

                <div className="mt-3 pt-2.5 border-t border-white/5 flex items-center justify-between">
                  <button
                    onClick={() => {
                      setIsShadeOpen(false);
                      onQuickAdd();
                    }}
                    className="flex items-center gap-1.5 text-xs text-indigo-300 font-medium hover:text-white transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Quick Add Task</span>
                  </button>
                  <span className="text-[10px] text-slate-500">
                    Always accessible in lockscreen & shade
                  </span>
                </div>
              </div>
            )}

            {/* Active Task Reminders */}
            {notifications.length === 0 && !preferences.persistentTodayNotification && (
              <div className="py-6 text-center text-xs text-slate-500">
                No active notifications. When a reminder triggers, it will appear here and in your OS tray!
              </div>
            )}

            {notifications.map((notif) => (
              <div
                key={notif.id}
                className="bg-[#141624] border border-white/10 rounded-xl p-3 shadow-lg hover:border-indigo-500/30 transition group"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-indigo-500/20 text-indigo-300">
                        {notif.priority}
                      </span>
                      <span className="text-xs font-semibold text-white group-hover:text-indigo-200 transition">
                        {notif.title}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-slate-300">{notif.message}</p>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
                      <span>Triggered {notif.timestamp}</span>
                      <span>·</span>
                      <span>Due {notif.dueTimeString}</span>
                    </div>
                  </div>

                  <button
                    onClick={() => onDismissNotification(notif.id)}
                    className="text-slate-500 hover:text-slate-300 p-1 rounded-lg text-xs"
                    title="Dismiss notification"
                  >
                    ✕
                  </button>
                </div>

                {/* Quick Actions (Android style Notification Actions) */}
                <div className="mt-3 pt-2.5 border-t border-white/5 flex flex-wrap items-center gap-1.5">
                  <button
                    onClick={() => {
                      onCompleteTask(notif.taskId);
                      onDismissNotification(notif.id);
                    }}
                    className="flex items-center gap-1 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/30 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
                  >
                    <Check className="w-3 h-3" />
                    <span>Complete</span>
                  </button>

                  <button
                    onClick={() => onSnoozeTask(notif.taskId, 10)}
                    className="flex items-center gap-1 bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30 px-2.5 py-1 rounded-lg text-[11px] font-medium transition cursor-pointer"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Snooze 10m</span>
                  </button>

                  <button
                    onClick={() => onSnoozeTask(notif.taskId, 30)}
                    className="flex items-center gap-1 bg-slate-800 text-slate-300 hover:text-white px-2 py-1 rounded-lg text-[11px] transition cursor-pointer"
                  >
                    <span>30m</span>
                  </button>

                  <button
                    onClick={() => {
                      setIsShadeOpen(false);
                      onOpenTask(notif.taskId);
                    }}
                    className="ml-auto text-xs text-indigo-400 hover:text-indigo-300 font-medium px-2 py-1"
                  >
                    Open Task →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
