/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import confetti from 'canvas-confetti';
import { 
  ActiveNotification, 
  CategoryItem, 
  Goal, 
  MainNavTab, 
  Task, 
  TaskFilterView, 
  UserPreferences 
} from './types';
import { StorageService } from './services/storage';
import { calculateNextOccurrence, NotificationService } from './services/notifications';
import { localDateKey, calculateRealStreak } from './utils/dateUtils';
import { AndroidNotificationBar } from './components/AndroidNotificationBar';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TaskListView } from './components/TaskListView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TaskEditorModal } from './components/TaskEditorModal';
import { TaskCompletionRemarkModal } from './components/TaskCompletionRemarkModal';
import { AndroidPermissionsModal } from './components/AndroidPermissionsModal';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { EmailVerificationModal } from './components/EmailVerificationModal';
import { AuthService } from './services/auth';
import { UserProfile } from './types';
import { RotateCcw, X, ShieldAlert, ArrowRight, Check } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const [goals, setGoals] = useState<Goal[]>(StorageService.getGoals());

  // Navigation
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');
  const [activeFilterView, setActiveFilterView] = useState<TaskFilterView>('today');

  // User Authentication State
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(() => {
    return AuthService.getCurrentSession()?.user || null;
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isEmailVerifyModalOpen, setIsEmailVerifyModalOpen] = useState(false);
  const [verificationInitialCode, setVerificationInitialCode] = useState('');
  const [authModalInitialTab, setAuthModalInitialTab] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [migrationPrompt, setMigrationPrompt] = useState<{ count: number; userId: string } | null>(null);

  // Modals
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);
  const [pendingCompletionTask, setPendingCompletionTask] = useState<Task | null>(null);

  // Notifications
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  // Undo deletion toast
  const [undoToast, setUndoToast] = useState<{ task: Task; timeoutId: NodeJS.Timeout } | null>(null);

  // Mobile frame wrapper toggle (for desktop view)
  const [mobileFrameMode, setMobileFrameMode] = useState(false);

  // Load data scoped to active user
  const loadUserData = useCallback(async (userId?: string) => {
    const loadedTasks = await StorageService.getTasks(userId);
    const loadedCategories = StorageService.getCategories();
    const loadedPrefs = StorageService.getPreferences();
    const loadedGoals = StorageService.getGoals();

    setTasks(loadedTasks);
    setCategories(loadedCategories);
    setPreferences(loadedPrefs);
    setGoals(loadedGoals);
    setMobileFrameMode(loadedPrefs.mobileFrameMode || false);
    setNotificationPermission(NotificationService.getPermission());
  }, []);

  useEffect(() => {
    loadUserData(currentUser?.id);
  }, [currentUser?.id, loadUserData]);

  // Save tasks scoped to current user
  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    StorageService.saveTasks(newTasks, currentUser?.id);
  }, [currentUser?.id]);

  // Auth event handlers
  const handleAuthSuccess = async (user: UserProfile, isNewRegistration = false, initialCode?: string) => {
    setCurrentUser(user);
    if (initialCode) {
      setVerificationInitialCode(initialCode);
      setIsEmailVerifyModalOpen(true);
    }
    // Check if there are anonymous local tasks that could be imported
    const anonymousTasks = await StorageService.getTasks(); // returns tasks with !userId
    if (anonymousTasks.length > 0) {
      setMigrationPrompt({ count: anonymousTasks.length, userId: user.id });
    }
  };

  const handleLogout = () => {
    AuthService.logout();
    setCurrentUser(null);
    setActiveNotifications([]);
  };

  const handleDeleteAccount = async () => {
    if (currentUser) {
      await StorageService.deleteUserTasks(currentUser.id);
    }
    AuthService.logout();
    setCurrentUser(null);
    setActiveNotifications([]);
  };

  const handleConfirmMigration = async () => {
    if (!migrationPrompt) return;
    await StorageService.migrateAnonymousTasks(migrationPrompt.userId);
    setMigrationPrompt(null);
    await loadUserData(migrationPrompt.userId);
  };

  const handleDeclineMigration = () => {
    setMigrationPrompt(null);
  };

  // Save preferences
  const handleUpdatePreferences = useCallback((newPrefs: UserPreferences) => {
    setPreferences(newPrefs);
    setMobileFrameMode(newPrefs.mobileFrameMode);
    StorageService.savePreferences(newPrefs);
  }, []);

  // Save categories
  const handleUpdateCategories = useCallback((newCats: CategoryItem[]) => {
    setCategories(newCats);
    StorageService.saveCategories(newCats);
  }, []);

  // Smart Reminder Loop: runs every 8 seconds to check for task reminders
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      let hasUpdates = false;

      const updatedTasks = tasks.map((task) => {
        if (task.completed || !task.reminders || task.reminders.length === 0) {
          return task;
        }

        let taskRemindersUpdated = false;
        const newReminders = task.reminders.map((rem) => {
          if (!rem.notified && new Date(rem.scheduledTime) <= now) {
            // Trigger reminder
            const cat = categories.find((c) => c.id === task.categoryId);
            const catName = cat ? cat.name : 'Task';

            const activeNotif = NotificationService.triggerNotification(
              task,
              catName,
              preferences,
              (taskId) => {
                const target = tasks.find((t) => t.id === taskId);
                if (target) {
                  setTaskToEdit(target);
                  setIsTaskEditorOpen(true);
                }
              }
            );

            setActiveNotifications((prev) => [activeNotif, ...prev.filter((n) => n.taskId !== task.id)]);
            taskRemindersUpdated = true;
            return { ...rem, notified: true };
          }
          return rem;
        });

        if (taskRemindersUpdated) {
          hasUpdates = true;
          return { ...task, reminders: newReminders };
        }
        return task;
      });

      if (hasUpdates) {
        updateTasks(updatedTasks);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [tasks, categories, preferences, updateTasks]);

  // Handle Save Task (Create or Edit)
  const handleSaveTask = (task: Task) => {
    const tagged: Task = {
      ...task,
      userId: currentUser?.id || task.userId,
    };
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    let updated: Task[];
    if (existingIndex >= 0) {
      updated = [...tasks];
      updated[existingIndex] = tagged;
    } else {
      updated = [tagged, ...tasks];
    }
    updateTasks(updated);
  };

  // Handle Reopening an already completed task
  const handleReopenTask = (task: Task) => {
    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          completed: false,
          completedAt: undefined,
          updatedAt: new Date().toISOString(),
        };
      }
      return t;
    });

    // Recompute streak
    if (preferences.gamificationEnabled) {
      const realStreak = calculateRealStreak(updated, new Date());
      handleUpdatePreferences({
        ...preferences,
        streak: realStreak,
      });
    }

    updateTasks(updated);
  };

  // Handle Toggle Task Completion:
  // When an incomplete task is tapped, immediately open the Task Completion Remark Dialog!
  // When an already completed task is tapped, reopen it directly.
  const handleToggleComplete = (task: Task) => {
    if (!task.completed) {
      setPendingCompletionTask(task);
    } else {
      handleReopenTask(task);
    }
  };

  // Handle Save & Complete (or Skip for Now) from Completion Remark Dialog
  const handleConfirmComplete = async (task: Task, remark?: string): Promise<void> => {
    const now = new Date();
    const cleanRemark = remark && remark.trim().length > 0 ? remark.trim() : undefined;

    // Crisp completion sound FX
    if (preferences.soundEnabled) {
      NotificationService.playCompleteSound();
    }

    // Celebration confetti
    try {
      confetti({
        particleCount: 40,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#6366F1', '#A855F7', '#38BDF8', '#10B981'],
      });
    } catch {
      // Fallback
    }

    // Map updated tasks: set completed, completedAt, and completionRemark
    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          completed: true,
          completedAt: now.toISOString(),
          completionRemark: cleanRemark,
          updatedAt: now.toISOString(),
        };
      }
      return t;
    });

    // Handle Recurring Task: Generate next occurrence ONLY for recurring tasks
    if (task.recurrence && task.recurrence.type !== 'none') {
      const generated = calculateNextOccurrence(task);
      if (generated) {
        generated.userId = currentUser?.id;
        // Prevent duplicate next occurrences if one already exists for this title and dueDate
        const duplicate = updated.some(
          (t) => t.title === generated.title && t.dueDate === generated.dueDate && !t.completed
        );
        if (!duplicate) {
          updated.unshift(generated);
        }
      }
    }

    // Calculate real streaks from actual completed task history
    if (preferences.gamificationEnabled) {
      const realStreak = calculateRealStreak(updated, now);
      handleUpdatePreferences({
        ...preferences,
        streak: realStreak,
      });
    }

    // Persist changes reliably to IndexedDB and localStorage
    await StorageService.saveTasks(updated, currentUser?.id);
    setTasks(updated);

    // Dismiss active notification for this task
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== task.id));

    // Close the completion remark dialog
    setPendingCompletionTask(null);
  };

  // Handle Task Deletion with Undo Toast
  const handleDeleteTask = (taskId: string) => {
    const taskToDelete = tasks.find((t) => t.id === taskId);
    if (!taskToDelete) return;

    if (undoToast) {
      clearTimeout(undoToast.timeoutId);
    }

    const newTasks = tasks.filter((t) => t.id !== taskId);
    updateTasks(newTasks);

    const timeoutId = setTimeout(() => {
      setUndoToast(null);
    }, 5000);

    setUndoToast({
      task: taskToDelete,
      timeoutId,
    });
  };

  // Handle Undo Deletion
  const handleUndoDelete = () => {
    if (!undoToast) return;
    clearTimeout(undoToast.timeoutId);
    const restored = [undoToast.task, ...tasks];
    updateTasks(restored);
    setUndoToast(null);
  };

  // Handle Duplicate Task
  const handleDuplicateTask = (task: Task) => {
    const clone: Task = {
      ...task,
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: `${task.title} (Copy)`,
      completed: false,
      completedAt: undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    updateTasks([clone, ...tasks]);
  };

  // Handle Pin Task
  const handleTogglePin = (taskId: string) => {
    const updated = tasks.map((t) => (t.id === taskId ? { ...t, pinned: !t.pinned } : t));
    updateTasks(updated);
  };

  // Handle Toggle Subtask
  const handleToggleSubtask = (taskId: string, subtaskId: string) => {
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newSubs = t.subtasks.map((s) => (s.id === subtaskId ? { ...s, completed: !s.completed } : s));
        return { ...t, subtasks: newSubs };
      }
      return t;
    });
    updateTasks(updated);
  };

  // Handle Snooze
  const handleSnooze = (taskId: string, minutes: number) => {
    const newScheduled = new Date(Date.now() + minutes * 60 * 1000).toISOString();
    const updated = tasks.map((t) => {
      if (t.id === taskId) {
        const newRem = {
          id: `snooze-${Date.now()}`,
          type: 'custom' as const,
          minutesBefore: minutes,
          scheduledTime: newScheduled,
          notified: false,
        };
        return {
          ...t,
          reminders: [...(t.reminders || []), newRem],
        };
      }
      return t;
    });
    updateTasks(updated);
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== taskId));
  };

  // Notification dismissal
  const handleDismissNotification = (notifId: string) => {
    setActiveNotifications((prev) => prev.filter((n) => n.id !== notifId));
  };

  const handleClearAllNotifications = () => {
    setActiveNotifications([]);
  };

  // Request system notification permission
  const handleRequestPermission = async () => {
    const granted = await NotificationService.requestPermission();
    setNotificationPermission(granted ? 'granted' : 'denied');
    if (granted) {
      handleUpdatePreferences({ ...preferences, systemNotificationsEnabled: true });
    }
  };

  // Send test notification
  const handleTestNotification = () => {
    const testTask: Task = {
      id: 'test-alarm',
      title: 'Test Task Reminder',
      description: 'This is a sample alert to test your sound, vibration, and notification banner.',
      categoryId: 'college',
      priority: 'high',
      dueDate: localDateKey(),
      dueTime: '15:30',
      estimatedDuration: 45,
      completed: false,
      pinned: true,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    const notif = NotificationService.triggerNotification(
      testTask,
      'College',
      preferences,
      () => {
        setTaskToEdit(testTask);
        setIsTaskEditorOpen(true);
      }
    );
    setActiveNotifications((prev) => [notif, ...prev]);
  };

  // Reset all data
  const handleResetAllData = async () => {
    await StorageService.resetAll();
    const freshTasks = await StorageService.getTasks();
    const freshCategories = StorageService.getCategories();
    const freshPrefs = StorageService.getPreferences();
    const freshGoals = StorageService.getGoals();

    setTasks(freshTasks);
    setCategories(freshCategories);
    setPreferences(freshPrefs);
    setGoals(freshGoals);
    setActiveNotifications([]);
  };

  const todayKey = localDateKey();
  const pendingTodayCount = tasks.filter(
    (t) => !t.completed && t.dueDate === todayKey
  ).length;

  return (
    <div className={`min-h-screen ${preferences.theme === 'oled' ? 'bg-black' : 'bg-[#0b0c11]'} text-slate-100 flex flex-col`}>
      {/* Mobile Frame Container (optional toggle for realistic Android phone preview on desktop) */}
      <div className={`flex-1 flex flex-col ${mobileFrameMode ? 'max-w-[420px] mx-auto my-4 rounded-[42px] border-4 border-slate-700/60 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden relative' : 'w-full max-w-2xl mx-auto'}`}>
        
        {/* Android Top Status Bar & Interactive Notification Shade */}
        <AndroidNotificationBar
          notifications={activeNotifications}
          tasks={tasks}
          preferences={preferences}
          onDismissNotification={handleDismissNotification}
          onClearAllNotifications={handleClearAllNotifications}
          onCompleteTask={(taskId) => {
            const target = tasks.find((t) => t.id === taskId);
            if (target) handleToggleComplete(target);
          }}
          onSnoozeTask={handleSnooze}
          onOpenTask={(taskId) => {
            const target = tasks.find((t) => t.id === taskId);
            if (target) {
              setTaskToEdit(target);
              setIsTaskEditorOpen(true);
            }
          }}
          onQuickAdd={() => {
            setTaskToEdit(null);
            setIsTaskEditorOpen(true);
          }}
          onToggleSound={() => handleUpdatePreferences({ ...preferences, soundEnabled: !preferences.soundEnabled })}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
          notificationPermission={notificationPermission}
        />

        {/* Top Header */}
        <TopHeader
          notificationCount={activeNotifications.length}
          onOpenNotifications={() => {
            setIsPermissionsModalOpen(true);
          }}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          mobileFrameMode={mobileFrameMode}
          onToggleMobileFrame={() => setMobileFrameMode(!mobileFrameMode)}
          user={currentUser}
          onOpenAuth={() => {
            setAuthModalInitialTab('signin');
            setIsAuthModalOpen(true);
          }}
          onOpenProfile={() => setIsProfileModalOpen(true)}
        />

        {/* Email Verification Reminder Banner */}
        {currentUser && !currentUser.isEmailVerified && (
          <div className="bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 flex items-center justify-between text-xs text-amber-300 animate-in fade-in">
            <div className="flex items-center gap-2 truncate pr-2">
              <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="truncate">Your email ({currentUser.email}) is not yet verified.</span>
            </div>
            <button
              onClick={() => setIsEmailVerifyModalOpen(true)}
              className="px-2.5 py-1 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold shrink-0 transition cursor-pointer"
            >
              Verify Now
            </button>
          </div>
        )}

        {/* Anonymous Tasks Migration Prompt */}
        {migrationPrompt && (
          <div className="bg-indigo-950/80 border-b border-indigo-500/30 px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-indigo-200 animate-in slide-in-from-top-2">
            <div className="flex items-center gap-2">
              <Check className="w-4 h-4 text-indigo-400 shrink-0" />
              <span>
                Found <strong>{migrationPrompt.count}</strong> existing local tasks. Import them into your account?
              </span>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleConfirmMigration}
                className="px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition shadow cursor-pointer"
              >
                Import Tasks
              </button>
              <button
                onClick={handleDeclineMigration}
                className="px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition cursor-pointer"
              >
                Keep Separate
              </button>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <main className="flex-1 px-3.5 sm:px-4 py-4 overflow-y-auto">
          {currentTab === 'home' && (
            <DashboardView
              tasks={tasks}
              categories={categories}
              preferences={preferences}
              goals={goals}
              onToggleComplete={handleToggleComplete}
              onEditTask={(t) => {
                setTaskToEdit(t);
                setIsTaskEditorOpen(true);
              }}
              onQuickAdd={() => {
                setTaskToEdit(null);
                setIsTaskEditorOpen(true);
              }}
              onNavigateToTab={(tab) => {
                if (tab === 'tasks') {
                  setActiveFilterView('all');
                }
                setCurrentTab(tab);
              }}
            />
          )}

          {currentTab === 'tasks' && (
            <TaskListView
              tasks={tasks}
              categories={categories}
              activeFilterView={activeFilterView}
              onFilterViewChange={setActiveFilterView}
              onToggleComplete={handleToggleComplete}
              onEdit={(t) => {
                setTaskToEdit(t);
                setIsTaskEditorOpen(true);
              }}
              onDelete={handleDeleteTask}
              onDuplicate={handleDuplicateTask}
              onTogglePin={handleTogglePin}
              onToggleSubtask={handleToggleSubtask}
              onSnooze={handleSnooze}
              onAddNew={() => {
                setTaskToEdit(null);
                setIsTaskEditorOpen(true);
              }}
            />
          )}

          {currentTab === 'calendar' && (
            <CalendarView
              tasks={tasks}
              categories={categories}
              preferences={preferences}
              onToggleComplete={handleToggleComplete}
              onEditTask={(t) => {
                setTaskToEdit(t);
                setIsTaskEditorOpen(true);
              }}
              onQuickAddForDate={(dateStr) => {
                setTaskToEdit(null);
                setIsTaskEditorOpen(true);
              }}
            />
          )}

          {currentTab === 'reports' && (
            <ReportsView
              tasks={tasks}
              categories={categories}
              goals={goals}
            />
          )}

          {currentTab === 'settings' && (
            <SettingsView
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              categories={categories}
              onUpdateCategories={handleUpdateCategories}
              onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
              onOpenPermissionsModal={() => setIsPermissionsModalOpen(true)}
              onDataRestored={async () => {
                const refreshed = await StorageService.getTasks();
                setTasks(refreshed);
              }}
              onResetAllData={handleResetAllData}
            />
          )}
        </main>

        {/* Undo Deletion Toast */}
        {undoToast && (
          <div className="fixed bottom-20 left-4 right-4 max-w-sm mx-auto z-40 p-3 rounded-2xl bg-[#1b1e2e] border border-white/10 shadow-2xl flex items-center justify-between text-xs animate-in slide-in-from-bottom-3 duration-200">
            <span className="text-slate-200 truncate pr-2">
              Task "{undoToast.task.title}" deleted.
            </span>
            <div className="flex items-center gap-2 shrink-0">
              <button
                onClick={handleUndoDelete}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white font-bold transition cursor-pointer"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Undo</span>
              </button>
              <button
                onClick={() => setUndoToast(null)}
                className="text-slate-500 hover:text-white p-1"
                aria-label="Dismiss undo notification"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Bottom Navigation */}
        <BottomNav
          currentTab={currentTab}
          onTabChange={setCurrentTab}
          onQuickAdd={() => {
            setTaskToEdit(null);
            setIsTaskEditorOpen(true);
          }}
          pendingCount={pendingTodayCount}
        />
      </div>

      {/* Task Editor Modal */}
      <TaskEditorModal
        isOpen={isTaskEditorOpen}
        onClose={() => setIsTaskEditorOpen(false)}
        onSave={handleSaveTask}
        taskToEdit={taskToEdit}
        categories={categories}
        defaultReminderOffset={preferences.defaultReminder}
      />

      {/* Task Completion Remark Modal */}
      <TaskCompletionRemarkModal
        isOpen={Boolean(pendingCompletionTask)}
        task={pendingCompletionTask}
        onClose={() => setPendingCompletionTask(null)}
        onSaveAndComplete={(t, remark) => handleConfirmComplete(t, remark)}
        onSkip={(t) => handleConfirmComplete(t, undefined)}
      />

      {/* Android Permissions & Exact Alarm Modal */}
      <AndroidPermissionsModal
        isOpen={isPermissionsModalOpen}
        onClose={() => setIsPermissionsModalOpen(false)}
        permissionStatus={notificationPermission}
        onRequestPermission={handleRequestPermission}
        onTestNotification={handleTestNotification}
      />

      {/* Android Architecture & APK Guide Modal */}
      <AndroidGuideModal
        isOpen={isAndroidGuideOpen}
        onClose={() => setIsAndroidGuideOpen(false)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        initialTab={authModalInitialTab}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* User Profile Modal */}
      {currentUser && (
        <ProfileModal
          isOpen={isProfileModalOpen}
          onClose={() => setIsProfileModalOpen(false)}
          user={currentUser}
          tasks={tasks}
          onUpdateProfile={(updated) => setCurrentUser(updated)}
          onLogout={handleLogout}
          onDeleteAccount={handleDeleteAccount}
          onOpenVerifyModal={() => setIsEmailVerifyModalOpen(true)}
        />
      )}

      {/* Email Verification Modal */}
      {currentUser && (
        <EmailVerificationModal
          isOpen={isEmailVerifyModalOpen}
          onClose={() => setIsEmailVerifyModalOpen(false)}
          user={currentUser}
          initialCode={verificationInitialCode}
          onVerificationSuccess={(updated) => setCurrentUser(updated)}
        />
      )}
    </div>
  );
}
