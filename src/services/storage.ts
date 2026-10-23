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
    currentStreak: 0,
    longestStreak: 0,
    lastCompletedDate: '',
  },
  mobileFrameMode: false,
};

export const DEFAULT_GOALS: Goal[] = [
  { id: 'goal-daily', title: 'Daily Tasks Target', type: 'daily', target: 5 },
  { id: 'goal-weekly', title: 'Weekly Focus Goal', type: 'weekly', target: 25 },
  { id: 'goal-monthly', title: 'Monthly Milestone Target', type: 'monthly', target: 100 },
];

export function generateSeedTasks(): Task[] {
  return [];
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

const INSTALLATION_MARKER_KEY = 'chronos_installed';

// Storage Manager
export class StorageService {
  private static isIdbSupported = typeof window !== 'undefined' && 'indexedDB' in window;

  // Check if installation marker exists
  static isInstalled(): boolean {
    try {
      return localStorage.getItem(INSTALLATION_MARKER_KEY) === '1';
    } catch {
      return false;
    }
  }

  static markInstalled(): void {
    try {
      localStorage.setItem(INSTALLATION_MARKER_KEY, '1');
    } catch {
      // Ignore if localStorage unavailable/private browsing quota
    }
  }

  static generateSeedTasks(): Task[] {
    return [];
  }

  // TASKS
  static async getTasks(userId?: string): Promise<Task[]> {
    const installed = this.isInstalled();
    let allTasks: Task[] = [];

    if (this.isIdbSupported) {
      try {
        const db = await openDB();
        const idbTasks = await new Promise<Task[] | null>((resolve) => {
          const tx = db.transaction(STORE_TASKS, 'readonly');
          const store = tx.objectStore(STORE_TASKS);
          const req = store.getAll();
          req.onsuccess = () => {
            const result = (req.result as Task[]) || [];
            const filtered = result.filter((t) => !t.id.startsWith('task-seed-'));
            resolve(filtered);
          };
          req.onerror = () => resolve(null);
        });

        if (idbTasks !== null) {
          if (idbTasks.length > 0 || installed) {
            this.markInstalled();
            allTasks = idbTasks;
            try {
              localStorage.setItem('chronos_tasks', JSON.stringify(idbTasks));
            } catch {}
          }
        }
      } catch (err) {
        console.warn('IndexedDB read error, falling back to localStorage:', err);
      }
    }

    if (allTasks.length === 0) {
      allTasks = this.getTasksFallback();
    }

    // Filter by userId: if userId provided, return user's tasks; otherwise return anonymous local tasks
    if (userId) {
      return allTasks.filter((t) => t.userId === userId);
    }
    return allTasks.filter((t) => !t.userId);
  }

  // Get all tasks across all users (for backup/export)
  static async getAllTasks(): Promise<Task[]> {
    if (this.isIdbSupported) {
      try {
        const db = await openDB();
        return await new Promise<Task[]>((resolve) => {
          const tx = db.transaction(STORE_TASKS, 'readonly');
          const store = tx.objectStore(STORE_TASKS);
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result as Task[]) || []);
          req.onerror = () => resolve(this.getTasksFallback());
        });
      } catch {}
    }
    return this.getTasksFallback();
  }

  private static getTasksFallback(): Task[] {
    const installed = this.isInstalled();
    try {
      const raw = localStorage.getItem('chronos_tasks');
      if (raw !== null) {
        try {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.markInstalled();
            const filtered = parsed.filter((t) => !t.id.startsWith('task-seed-'));
            if (filtered.length !== parsed.length) {
              localStorage.setItem('chronos_tasks', JSON.stringify(filtered));
            }
            return filtered;
          }
        } catch (parseErr) {
          console.error('Failed to parse localStorage chronos_tasks JSON. Preserving raw data:', parseErr);
          return [];
        }
      }

      if (installed) {
        return [];
      }

      this.markInstalled();
      const seed = generateSeedTasks(); // empty array
      localStorage.setItem('chronos_tasks', JSON.stringify(seed));
      return seed;
    } catch {
      return [];
    }
  }

  static async saveTasks(userTasks: Task[], userId?: string): Promise<void> {
    this.markInstalled();

    // Ensure all tasks in userTasks carry the correct userId
    const taggedUserTasks = userTasks.map((t) => ({
      ...t,
      userId: userId || t.userId,
    }));

    // Read all existing tasks to merge safely without overwriting other users' tasks
    const existingAll = await this.getAllTasks();
    const otherUsersTasks = existingAll.filter((t) => (userId ? t.userId !== userId : Boolean(t.userId)));
    const mergedAll = [...otherUsersTasks, ...taggedUserTasks];

    // 1. Write to localStorage
    try {
      localStorage.setItem('chronos_tasks', JSON.stringify(mergedAll));
    } catch (e) {
      console.warn('localStorage saveTasks error:', e);
    }

    // 2. Write to IndexedDB
    if (this.isIdbSupported) {
      try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_TASKS, 'readwrite');
          const store = tx.objectStore(STORE_TASKS);
          store.clear();
          for (const t of mergedAll) {
            store.put(t);
          }
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
          tx.onabort = () => reject(new Error('IndexedDB transaction aborted'));
        });
      } catch (e) {
        console.warn('IndexedDB saveTasks error:', e);
      }
    }
  }

  // Migrate anonymous local tasks to an authenticated user
  static async migrateAnonymousTasks(userId: string): Promise<number> {
    const anonymousTasks = await this.getTasks(); // gets tasks with !userId
    if (anonymousTasks.length === 0) return 0;

    const migrated = anonymousTasks.map((t) => ({ ...t, userId }));
    const existingUserTasks = await this.getTasks(userId);
    const combined = [...existingUserTasks, ...migrated];
    await this.saveTasks(combined, userId);

    // Remove anonymous tasks now that they are assigned
    const allRemaining = (await this.getAllTasks()).filter((t) => Boolean(t.userId));
    if (this.isIdbSupported) {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_TASKS, 'readwrite');
        const store = tx.objectStore(STORE_TASKS);
        store.clear();
        for (const t of allRemaining) store.put(t);
      } catch {}
    }
    try {
      localStorage.setItem('chronos_tasks', JSON.stringify(allRemaining));
    } catch {}

    return migrated.length;
  }

  // Delete all tasks owned by a specific user (Account Deletion)
  static async deleteUserTasks(userId: string): Promise<void> {
    const all = await this.getAllTasks();
    const remaining = all.filter((t) => t.userId !== userId);

    try {
      localStorage.setItem('chronos_tasks', JSON.stringify(remaining));
    } catch {}

    if (this.isIdbSupported) {
      try {
        const db = await openDB();
        const tx = db.transaction(STORE_TASKS, 'readwrite');
        const store = tx.objectStore(STORE_TASKS);
        store.clear();
        for (const t of remaining) store.put(t);
      } catch {}
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
        const parsed = JSON.parse(raw);
        if (parsed.streak && parsed.streak.longestStreak === 12 && parsed.streak.currentStreak === 4) {
          parsed.streak = { currentStreak: 0, longestStreak: 0, lastCompletedDate: '' };
          this.savePreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        }
        return { ...DEFAULT_PREFERENCES, ...parsed };
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
      'Completion Remark',
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
        `"${(t.completionRemark || '').replace(/"/g, '""')}"`,
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
