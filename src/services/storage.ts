import { CategoryItem, Goal, Task, UserPreferences } from '../types';

const DB_NAME = 'chronos_task_tracker_db';
const DB_VERSION = 1;
const STORE_TASKS = 'tasks';
const STORE_META = 'metadata';

export const DEFAULT_CATEGORIES: CategoryItem[] = [
  { id: 'college', name: 'College', color: '#6366F1', icon: 'GraduationCap' },
  { id: 'assignments', name: 'Assignments', color: '#A855F7', icon: 'FileText' },
  { id: 'personal', name: 'Personal', color: '#EC4899', icon: 'User' },
  { id: 'health', name: 'Health & Fitness', color: '#10B981', icon: 'HeartPulse' },
  { id: 'projects', name: 'Projects', color: '#F59E0B', icon: 'Briefcase' },
  { id: 'other', name: 'Other', color: '#64748B', icon: 'Tag' },
];

export const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'dark',
  accentColor: 'indigo',
  soundEnabled: true,
  vibrationEnabled: true,
  systemNotificationsEnabled: false,
  persistentTodayNotification: true,
  defaultReminder: '15m_before',
  weekStartsOn: 1, // Monday
  timeFormat: '12h',
  gamificationEnabled: true,
  streak: {
    currentStreak: 4,
    longestStreak: 12,
    lastCompletedDate: new Date().toISOString().split('T')[0],
  },
  mobileFrameMode: false,
};

export const DEFAULT_GOALS: Goal[] = [
  { id: 'goal-daily', title: 'Daily Tasks Target', type: 'daily', target: 5 },
  { id: 'goal-weekly', title: 'Weekly Focus Goal', type: 'weekly', target: 25 },
  { id: 'goal-monthly', title: 'Monthly Milestone Target', type: 'monthly', target: 100 },
];

// Helper to format date YYYY-MM-DD
function getDateString(offsetDays: number = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
}

export function generateSeedTasks(): Task[] {
  const today = getDateString(0);
  const tomorrow = getDateString(1);
  const inThreeDays = getDateString(3);
  const yesterday = getDateString(-1);

  return [
    {
      id: 'task-seed-1',
      title: 'Submit Operating Systems Lab Assignment 4',
      description: 'Implement round-robin CPU scheduling algorithm and compile test benchmarking report.',
      categoryId: 'assignments',
      priority: 'high',
      dueDate: today,
      dueTime: '16:30',
      estimatedDuration: 90,
      completed: false,
      pinned: true,
      subtasks: [
        { id: 'sub-1', title: 'Implement scheduler logic in C/C++', completed: true },
        { id: 'sub-2', title: 'Run simulation tests with 10 processes', completed: true },
        { id: 'sub-3', title: 'Export benchmark charts and submit PDF', completed: false },
      ],
      notes: 'Make sure turnaround time formulas match textbook chapter 5.',
      recurrence: { type: 'none' },
      reminders: [
        {
          id: 'rem-1',
          type: '1h_before',
          minutesBefore: 60,
          scheduledTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          notified: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-2',
      title: 'Computer Networks Lecture & Chapter Review',
      description: 'Review TCP 3-way handshake and congestion control window mechanics.',
      categoryId: 'college',
      priority: 'medium',
      dueDate: today,
      dueTime: '11:00',
      estimatedDuration: 45,
      completed: true,
      completedAt: new Date().toISOString(),
      pinned: false,
      subtasks: [
        { id: 'sub-2-1', title: 'Summarize sliding window slides', completed: true },
        { id: 'sub-2-2', title: 'Solve 3 practice numericals', completed: true },
      ],
      notes: 'Midterm covers chapters 3 to 6.',
      recurrence: { type: 'weekly', interval: 1 },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-3',
      title: 'Evening 45-Min Workout & Core Conditioning',
      description: 'Upper body hypertrophy workout followed by 15 min mobility and stretching.',
      categoryId: 'health',
      priority: 'medium',
      dueDate: today,
      dueTime: '18:45',
      estimatedDuration: 45,
      completed: false,
      pinned: false,
      subtasks: [
        { id: 'sub-3-1', title: 'Warmup & dynamic mobility', completed: false },
        { id: 'sub-3-2', title: 'Pushups & dumbbell presses', completed: false },
        { id: 'sub-3-3', title: 'Core circuit & hydration', completed: false },
      ],
      notes: 'Stay hydrated; target 3L water today.',
      recurrence: { type: 'daily', interval: 1 },
      reminders: [
        {
          id: 'rem-3',
          type: '15m_before',
          minutesBefore: 15,
          scheduledTime: new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString(),
          notified: false,
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-4',
      title: 'Review Capstone Project Architecture Proposal',
      description: 'Review database normalization schemas and offline synchronization strategy with team.',
      categoryId: 'projects',
      priority: 'high',
      dueDate: tomorrow,
      dueTime: '14:00',
      estimatedDuration: 60,
      completed: false,
      pinned: true,
      subtasks: [
        { id: 'sub-4-1', title: 'Draft ER diagram v2', completed: false },
        { id: 'sub-4-2', title: 'Check offline sync fallback', completed: false },
      ],
      notes: 'Sync with mentor at 3:00 PM.',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-5',
      title: 'Weekly Grocery Stock & Meal Prep',
      description: 'Buy fresh vegetables, whole grains, yogurt, and meal prep lunches.',
      categoryId: 'personal',
      priority: 'low',
      dueDate: inThreeDays,
      dueTime: '10:00',
      estimatedDuration: 75,
      completed: false,
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'weekly', interval: 1 },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-6',
      title: 'Submit Scholarship Renewal Form',
      description: 'Deadline was yesterday; confirm submission status with student affairs office.',
      categoryId: 'college',
      priority: 'high',
      dueDate: yesterday,
      dueTime: '17:00',
      estimatedDuration: 30,
      completed: false,
      pinned: false,
      subtasks: [],
      notes: 'Contact counselor if confirmation email is missing.',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      id: 'task-seed-7',
      title: 'Morning Mindfulness & Hydration',
      description: '10 minutes deep breathing, 500ml water before screen time.',
      categoryId: 'health',
      priority: 'low',
      dueDate: today,
      dueTime: '07:30',
      estimatedDuration: 15,
      completed: true,
      completedAt: new Date().toISOString(),
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'daily', interval: 1 },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];
}

// Open IndexedDB database
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_TASKS)) {
        db.createObjectStore(STORE_TASKS, { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains(STORE_META)) {
        db.createObjectStore(STORE_META, { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Storage Manager
export class StorageService {
  private static isIdbSupported = typeof window !== 'undefined' && 'indexedDB' in window;

  // TASKS
  static async getTasks(): Promise<Task[]> {
    try {
      if (this.isIdbSupported) {
        const db = await openDB();
        return new Promise((resolve) => {
          const tx = db.transaction(STORE_TASKS, 'readonly');
          const store = tx.objectStore(STORE_TASKS);
          const req = store.getAll();
          req.onsuccess = () => {
            const result = req.result as Task[];
            if (result && result.length > 0) {
              resolve(result);
            } else {
              // First time: seed default tasks
              const seed = generateSeedTasks();
              this.saveTasks(seed);
              resolve(seed);
            }
          };
          req.onerror = () => {
            resolve(this.getTasksFallback());
          };
        });
      }
    } catch {
      // Fallback
    }
    return this.getTasksFallback();
  }

  private static getTasksFallback(): Task[] {
    try {
      const raw = localStorage.getItem('chronos_tasks');
      if (raw) {
        return JSON.parse(raw);
      }
      const seed = generateSeedTasks();
      localStorage.setItem('chronos_tasks', JSON.stringify(seed));
      return seed;
    } catch {
      return generateSeedTasks();
    }
  }

  static async saveTasks(tasks: Task[]): Promise<void> {
    try {
      localStorage.setItem('chronos_tasks', JSON.stringify(tasks));
      if (this.isIdbSupported) {
        const db = await openDB();
        const tx = db.transaction(STORE_TASKS, 'readwrite');
        const store = tx.objectStore(STORE_TASKS);
        store.clear();
        for (const t of tasks) {
          store.put(t);
        }
      }
    } catch (e) {
      console.warn('Storage saveTasks error:', e);
    }
  }

  // CATEGORIES
  static getCategories(): CategoryItem[] {
    try {
      const raw = localStorage.getItem('chronos_categories');
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem('chronos_categories', JSON.stringify(DEFAULT_CATEGORIES));
      return DEFAULT_CATEGORIES;
    } catch {
      return DEFAULT_CATEGORIES;
    }
  }

  static saveCategories(categories: CategoryItem[]): void {
    try {
      localStorage.setItem('chronos_categories', JSON.stringify(categories));
    } catch (e) {
      console.warn('saveCategories error:', e);
    }
  }

  // PREFERENCES
  static getPreferences(): UserPreferences {
    try {
      const raw = localStorage.getItem('chronos_preferences');
      if (raw) {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
      }
      localStorage.setItem('chronos_preferences', JSON.stringify(DEFAULT_PREFERENCES));
      return DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  }

  static savePreferences(preferences: UserPreferences): void {
    try {
      localStorage.setItem('chronos_preferences', JSON.stringify(preferences));
    } catch (e) {
      console.warn('savePreferences error:', e);
    }
  }

  // GOALS
  static getGoals(): Goal[] {
    try {
      const raw = localStorage.getItem('chronos_goals');
      if (raw) {
        return JSON.parse(raw);
      }
      localStorage.setItem('chronos_goals', JSON.stringify(DEFAULT_GOALS));
      return DEFAULT_GOALS;
    } catch {
      return DEFAULT_GOALS;
    }
  }

  static saveGoals(goals: Goal[]): void {
    try {
      localStorage.setItem('chronos_goals', JSON.stringify(goals));
    } catch (e) {
      console.warn('saveGoals error:', e);
    }
  }

  // BACKUP & RESTORE
  static async exportBackup(): Promise<string> {
    const tasks = await this.getTasks();
    const categories = this.getCategories();
    const preferences = this.getPreferences();
    const goals = this.getGoals();

    const data = {
      app: 'Chronos Task Tracker',
      version: 1,
      exportedAt: new Date().toISOString(),
      tasks,
      categories,
      preferences,
      goals,
    };
    return JSON.stringify(data, null, 2);
  }

  static async restoreBackup(jsonString: string): Promise<{ success: boolean; message: string; count?: number }> {
    try {
      const parsed = JSON.parse(jsonString);
      if (!parsed.tasks || !Array.isArray(parsed.tasks)) {
        return { success: false, message: 'Invalid backup file format: missing tasks array.' };
      }
      await this.saveTasks(parsed.tasks);
      if (parsed.categories && Array.isArray(parsed.categories)) {
        this.saveCategories(parsed.categories);
      }
      if (parsed.preferences) {
        this.savePreferences(parsed.preferences);
      }
      if (parsed.goals && Array.isArray(parsed.goals)) {
        this.saveGoals(parsed.goals);
      }
      return {
        success: true,
        message: `Successfully restored ${parsed.tasks.length} tasks and app settings!`,
        count: parsed.tasks.length,
      };
    } catch (e) {
      return { success: false, message: `Failed to restore: ${(e as Error).message}` };
    }
  }

  // CSV EXPORT
  static exportTasksToCSV(tasks: Task[], categories: CategoryItem[]): string {
    const catMap = new Map(categories.map((c) => [c.id, c.name]));
    const headers = [
      'ID',
      'Title',
      'Description',
      'Category',
      'Priority',
      'Due Date',
      'Due Time',
      'Duration (min)',
      'Completed',
      'Completed At',
      'Pinned',
      'Subtasks Count',
      'Subtasks Completed',
      'Recurrence',
      'Notes',
    ];

    const rows = tasks.map((t) => {
      const subTotal = t.subtasks?.length || 0;
      const subDone = t.subtasks?.filter((s) => s.completed).length || 0;
      const catName = catMap.get(t.categoryId) || t.categoryId;

      return [
        t.id,
        `"${(t.title || '').replace(/"/g, '""')}"`,
        `"${(t.description || '').replace(/"/g, '""')}"`,
        `"${catName}"`,
        t.priority,
        t.dueDate,
        t.dueTime,
        t.estimatedDuration || 0,
        t.completed ? 'YES' : 'NO',
        t.completedAt || '',
        t.pinned ? 'YES' : 'NO',
        subTotal,
        subDone,
        t.recurrence?.type || 'none',
        `"${(t.notes || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  // RESET ALL DATA
  static async resetAll(): Promise<void> {
    try {
      localStorage.removeItem('chronos_tasks');
      localStorage.removeItem('chronos_categories');
      localStorage.removeItem('chronos_preferences');
      localStorage.removeItem('chronos_goals');
      if (this.isIdbSupported) {
        const db = await openDB();
        const tx = db.transaction([STORE_TASKS, STORE_META], 'readwrite');
        tx.objectStore(STORE_TASKS).clear();
        tx.objectStore(STORE_META).clear();
      }
    } catch (e) {
      console.warn('resetAll error:', e);
    }
  }
}
