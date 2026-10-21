import { ActiveNotification, CategoryItem, RecurrenceRule, ReminderOffset, Task, UserPreferences } from '../types';

// Web Audio API Synthesizer for offline chime & notification sound
class SoundFX {
  private static audioCtx: AudioContext | null = null;

  private static getContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.audioCtx) {
      const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        this.audioCtx = new AudioContextClass();
      }
    }
    if (this.audioCtx && this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  // Pleasant modern Android-style double-bell chime
  static playChime() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;

      const now = ctx.currentTime;
      
      // First tone (D5 ~ 587.33 Hz)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.03);
      gain1.gain.exponentialRampToValueAtTime(0.0001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.36);

      // Second tone (A5 ~ 880 Hz)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(880, now + 0.12);
      gain2.gain.setValueAtTime(0.001, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.15);
      gain2.gain.exponentialRampToValueAtTime(0.0001, now + 0.65);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.66);
    } catch (e) {
      console.warn('Audio play error:', e);
    }
  }

  // Crisp success chime for completing tasks
  static playCompleteSound() {
    try {
      const ctx = this.getContext();
      if (!ctx) return;
      const now = ctx.currentTime;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(523.25, now); // C5
      osc.frequency.exponentialRampToValueAtTime(1046.5, now + 0.2); // C6
      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.25, now + 0.05);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 0.4);
    } catch {
      // AudioContext muted/unsupported
    }
  }
}

export class NotificationService {
  // Check permission status
  static getPermission(): 'granted' | 'denied' | 'default' | 'unsupported' {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return 'unsupported';
    }
    return Notification.permission;
  }

  // Request browser Notification permission
  static async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return false;
    }
    try {
      const res = await Notification.requestPermission();
      return res === 'granted';
    } catch {
      return false;
    }
  }

  // Trigger vibration if supported and enabled
  static triggerVibration() {
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 80, 150]);
      } catch {
        // Ignored
      }
    }
  }

  // Trigger notification (both system OS and sound/vibe)
  static triggerNotification(
    task: Task,
    categoryName: string,
    prefs: UserPreferences,
    onOpenTask?: (taskId: string) => void
  ): ActiveNotification {
    const timeDisplay = task.dueTime ? `at ${task.dueTime}` : 'today';
    const message = `Priority: ${task.priority.toUpperCase()} · Due ${timeDisplay} · ${categoryName}`;

    if (prefs.soundEnabled) {
      SoundFX.playChime();
    }
    if (prefs.vibrationEnabled) {
      this.triggerVibration();
    }

    // Native Web Notification
    if (typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted' && prefs.systemNotificationsEnabled) {
      try {
        const notif = new Notification(task.title, {
          body: message,
          icon: '/pwa-192x192.png',
          badge: '/icon.svg',
          tag: `chronos-task-${task.id}`,
          requireInteraction: true,
          silent: !prefs.soundEnabled,
        });

        notif.onclick = () => {
          window.focus();
          notif.close();
          if (onOpenTask) {
            onOpenTask(task.id);
          }
        };
      } catch (err) {
        console.warn('Native notification dispatch failed:', err);
      }
    }

    return {
      id: `notif-${task.id}-${Date.now()}`,
      taskId: task.id,
      title: task.title,
      message,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      priority: task.priority,
      categoryName,
      categoryColor: '#6366F1',
      dueTimeString: task.dueTime || 'All Day',
    };
  }

  // Calculate reminder scheduled ISO timestamp based on task date, time, and offset
  static calculateReminderTime(dueDate: string, dueTime: string, offset: ReminderOffset, customMinutes: number = 0): string {
    const [year, month, day] = dueDate.split('-').map(Number);
    const [hours, minutes] = (dueTime || '09:00').split(':').map(Number);
    const targetDate = new Date(year, month - 1, day, hours, minutes, 0, 0);

    let offsetMinutes = 0;
    switch (offset) {
      case 'at_time':
        offsetMinutes = 0;
        break;
      case '5m_before':
        offsetMinutes = 5;
        break;
      case '15m_before':
        offsetMinutes = 15;
        break;
      case '30m_before':
        offsetMinutes = 30;
        break;
      case '1h_before':
        offsetMinutes = 60;
        break;
      case 'custom':
        offsetMinutes = customMinutes;
        break;
    }

    targetDate.setMinutes(targetDate.getMinutes() - offsetMinutes);
    return targetDate.toISOString();
  }

  // Play audio chime directly
  static playChime() {
    SoundFX.playChime();
  }

  // Play complete sound
  static playCompleteSound() {
    SoundFX.playCompleteSound();
  }
}

// Next occurrence calculation for recurring tasks
export function calculateNextOccurrence(task: Task): Task | null {
  const { recurrence } = task;
  if (!recurrence || recurrence.type === 'none') return null;

  // Check repeat limit
  const currentCount = recurrence.currentOccurrence || 1;
  if (recurrence.repeatLimit && currentCount >= recurrence.repeatLimit) {
    return null;
  }

  const [year, month, day] = task.dueDate.split('-').map(Number);
  const nextDate = new Date(year, month - 1, day);
  const interval = recurrence.interval || 1;

  switch (recurrence.type) {
    case 'daily':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    case 'weekdays': {
      // Find next Monday-Friday
      do {
        nextDate.setDate(nextDate.getDate() + 1);
      } while (nextDate.getDay() === 0 || nextDate.getDay() === 6);
      break;
    }

    case 'weekly': {
      if (recurrence.daysOfWeek && recurrence.daysOfWeek.length > 0) {
        // Selected specific days like [1, 3, 5] (Mon, Wed, Fri)
        let found = false;
        const currentDayOfWeek = nextDate.getDay();
        const sortedDays = [...recurrence.daysOfWeek].sort((a, b) => a - b);
        
        // Check if there is another day this same week
        for (const d of sortedDays) {
          if (d > currentDayOfWeek) {
            nextDate.setDate(nextDate.getDate() + (d - currentDayOfWeek));
            found = true;
            break;
          }
        }
        if (!found) {
          // Wrap around to first day next week
          const firstDay = sortedDays[0];
          const daysUntilEndOfWeek = 7 - currentDayOfWeek;
          nextDate.setDate(nextDate.getDate() + daysUntilEndOfWeek + firstDay + (interval - 1) * 7);
        }
      } else {
        nextDate.setDate(nextDate.getDate() + 7 * interval);
      }
      break;
    }

    case 'monthly':
      nextDate.setMonth(nextDate.getMonth() + interval);
      break;

    case 'yearly':
      nextDate.setFullYear(nextDate.getFullYear() + interval);
      break;

    case 'custom':
      nextDate.setDate(nextDate.getDate() + interval);
      break;

    default:
      return null;
  }

  const nextDueDate = nextDate.toISOString().split('T')[0];

  // Check end date
  if (recurrence.endDate && nextDueDate > recurrence.endDate) {
    return null;
  }

  // Create new task clone for next occurrence
  const nextReminders = (task.reminders || []).map((r) => {
    const scheduledTime = NotificationService.calculateReminderTime(
      nextDueDate,
      task.dueTime,
      r.type,
      r.minutesBefore
    );
    return {
      ...r,
      id: `rem-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      scheduledTime,
      notified: false,
    };
  });

  return {
    ...task,
    id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    dueDate: nextDueDate,
    completed: false,
    completedAt: undefined,
    subtasks: (task.subtasks || []).map((s) => ({ ...s, completed: false })),
    reminders: nextReminders,
    recurrence: {
      ...recurrence,
      currentOccurrence: currentCount + 1,
    },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}
