export type Priority = 'high' | 'medium' | 'low';

export interface CategoryItem {
  id: string;
  name: string;
  color: string; // Tailwind hex or class color
  icon: string;
  isCustom?: boolean;
}

export interface Subtask {
  id: string;
  title: string;
  completed: boolean;
}

export type ReminderOffset = 'none' | 'at_time' | '5m_before' | '15m_before' | '30m_before' | '1h_before' | 'custom';

export interface TaskReminder {
  id: string;
  type: ReminderOffset;
  minutesBefore: number;
  scheduledTime: string; // ISO string
  notified: boolean;
}

export type RecurrenceType = 'none' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'yearly' | 'custom';

export interface RecurrenceRule {
  type: RecurrenceType;
  interval?: number; // e.g. every 2 weeks
  daysOfWeek?: number[]; // [1, 3, 5] for Mon, Wed, Fri (0=Sun, 6=Sat)
  startDate?: string;
  endDate?: string;
  repeatLimit?: number; // max number of recurrences
  currentOccurrence?: number;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  categoryId: string;
  priority: Priority;
  dueDate: string; // YYYY-MM-DD
  dueTime: string; // HH:mm
  estimatedDuration: number; // in minutes
  completed: boolean;
  completedAt?: string; // ISO timestamp
  pinned: boolean;
  subtasks: Subtask[];
  notes: string;
  recurrence: RecurrenceRule;
  reminders: TaskReminder[];
  createdAt: string;
  updatedAt: string;
}

export interface Goal {
  id: string;
  title: string;
  type: 'daily' | 'weekly' | 'monthly' | 'yearly';
  target: number;
}

export interface UserPreferences {
  theme: 'dark' | 'light' | 'oled';
  accentColor: 'indigo' | 'purple' | 'blue' | 'emerald' | 'amber';
  soundEnabled: boolean;
  vibrationEnabled: boolean;
  systemNotificationsEnabled: boolean;
  persistentTodayNotification: boolean;
  defaultReminder: ReminderOffset;
  weekStartsOn: 0 | 1; // 0 = Sun, 1 = Mon
  timeFormat: '12h' | '24h';
  gamificationEnabled: boolean;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastCompletedDate: string; // YYYY-MM-DD
  };
  mobileFrameMode: boolean;
}

export interface ActiveNotification {
  id: string;
  taskId: string;
  title: string;
  message: string;
  timestamp: string;
  priority: Priority;
  categoryName: string;
  categoryColor: string;
  dueTimeString: string;
  isPersistent?: boolean;
}

export type MainNavTab = 'home' | 'tasks' | 'calendar' | 'reports' | 'settings';
export type TaskFilterView = 'today' | 'upcoming' | 'all' | 'overdue' | 'completed' | 'recurring';
