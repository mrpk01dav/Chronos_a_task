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
import { AndroidNotificationBar } from './components/AndroidNotificationBar';
import { TopHeader } from './components/TopHeader';
import { BottomNav } from './components/BottomNav';
import { DashboardView } from './components/DashboardView';
import { TaskListView } from './components/TaskListView';
import { CalendarView } from './components/CalendarView';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { TaskEditorModal } from './components/TaskEditorModal';
import { AndroidPermissionsModal } from './components/AndroidPermissionsModal';
import { AndroidGuideModal } from './components/AndroidGuideModal';
import { RotateCcw, X } from 'lucide-react';

export default function App() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [preferences, setPreferences] = useState<UserPreferences>(StorageService.getPreferences());
  const [goals, setGoals] = useState<Goal[]>(StorageService.getGoals());

  // Navigation
  const [currentTab, setCurrentTab] = useState<MainNavTab>('home');
  const [activeFilterView, setActiveFilterView] = useState<TaskFilterView>('today');

  // Modals
  const [isTaskEditorOpen, setIsTaskEditorOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [isAndroidGuideOpen, setIsAndroidGuideOpen] = useState(false);

  // Notifications
  const [activeNotifications, setActiveNotifications] = useState<ActiveNotification[]>([]);
  const [notificationPermission, setNotificationPermission] = useState<'granted' | 'denied' | 'default' | 'unsupported'>('default');

  // Undo deletion toast
  const [undoToast, setUndoToast] = useState<{ task: Task; timeoutId: NodeJS.Timeout } | null>(null);

  // Mobile frame wrapper toggle (for desktop view)
  const [mobileFrameMode, setMobileFrameMode] = useState(false);

  // Initial Load from Storage
  useEffect(() => {
    async function loadData() {
      const loadedTasks = await StorageService.getTasks();
      const loadedCategories = StorageService.getCategories();
      const loadedPrefs = StorageService.getPreferences();
      const loadedGoals = StorageService.getGoals();

      setTasks(loadedTasks);
      setCategories(loadedCategories);
      setPreferences(loadedPrefs);
      setGoals(loadedGoals);
      setMobileFrameMode(loadedPrefs.mobileFrameMode || false);
      setNotificationPermission(NotificationService.getPermission());
    }
    loadData();
  }, []);

  // Save tasks on changes
  const updateTasks = useCallback((newTasks: Task[]) => {
    setTasks(newTasks);
    StorageService.saveTasks(newTasks);
  }, []);

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
    const existingIndex = tasks.findIndex((t) => t.id === task.id);
    let updated: Task[];
    if (existingIndex >= 0) {
      updated = [...tasks];
      updated[existingIndex] = task;
    } else {
      updated = [task, ...tasks];
    }
    updateTasks(updated);
  };

  // Handle Toggle Task Completion
  const handleToggleComplete = (task: Task) => {
    const nowCompleted = !task.completed;
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];

    // Sound FX
    if (nowCompleted && preferences.soundEnabled) {
      NotificationService.playCompleteSound();
    }

    // Confetti on completion
    if (nowCompleted) {
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
    }

    // Update streak if completing first task today
    if (nowCompleted && preferences.gamificationEnabled) {
      if (preferences.streak.lastCompletedDate !== todayStr) {
        const currentStreak = preferences.streak.currentStreak + 1;
        const longestStreak = Math.max(currentStreak, preferences.streak.longestStreak);
        handleUpdatePreferences({
          ...preferences,
          streak: {
            currentStreak,
            longestStreak,
            lastCompletedDate: todayStr,
          },
        });
      }
    }

    // Handle Recurring Task: Generate next occurrence if completing
    let nextOccurrence: Task | null = null;
    if (nowCompleted && task.recurrence && task.recurrence.type !== 'none') {
      nextOccurrence = calculateNextOccurrence(task);
    }

    const updated = tasks.map((t) => {
      if (t.id === task.id) {
        return {
          ...t,
          completed: nowCompleted,
          completedAt: nowCompleted ? now.toISOString() : undefined,
        };
      }
      return t;
    });

    if (nextOccurrence) {
      updated.unshift(nextOccurrence);
    }

    updateTasks(updated);

    // Dismiss active notification for this task
    setActiveNotifications((prev) => prev.filter((n) => n.taskId !== task.id));
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
      title: 'Operating Systems Midterm Review',
      description: 'Review virtual memory paging and cache coherence protocols.',
      categoryId: 'college',
      priority: 'high',
      dueDate: new Date().toISOString().split('T')[0],
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

  const pendingTodayCount = tasks.filter(
    (t) => !t.completed && t.dueDate === new Date().toISOString().split('T')[0]
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
            // Trigger shade open via notification bar click or modal
            setIsPermissionsModalOpen(true);
          }}
          onOpenAndroidGuide={() => setIsAndroidGuideOpen(true)}
          mobileFrameMode={mobileFrameMode}
          onToggleMobileFrame={() => setMobileFrameMode(!mobileFrameMode)}
        />

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
    </div>
  );
}
