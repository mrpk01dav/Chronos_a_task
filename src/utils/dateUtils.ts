/**
 * Chronos Date and Time Utility Functions
 *
 * All calendar-date operations use local calendar date keys (YYYY-MM-DD)
 * to avoid UTC conversion errors across positive and negative timezones.
 */

import { Task } from '../types';

/**
 * Formats a Date object into a local 'YYYY-MM-DD' calendar date string.
 * Uses local getFullYear(), getMonth() + 1, and getDate() to preserve
 * the exact calendar day in the user's local timezone.
 */
export function localDateKey(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Parses a 'YYYY-MM-DD' string into a local Date object set to 00:00:00 local time.
 */
export function parseLocalDate(dateStr: string): Date {
  const [year, month, day] = dateStr.split('-').map(Number);
  return new Date(year, (month || 1) - 1, day || 1, 0, 0, 0, 0);
}

/**
 * Offsets a local date string by a given number of days.
 */
export function offsetLocalDate(dateStr: string, offsetDays: number): string {
  const date = parseLocalDate(dateStr);
  date.setDate(date.getDate() + offsetDays);
  return localDateKey(date);
}

/**
 * Checks whether a task is overdue given a reference date and time.
 * - Completed tasks are NEVER overdue.
 * - If dueDate is prior to today's local date, it is overdue.
 * - If dueDate is today and task has a specific dueTime (HH:mm),
 *   it becomes overdue once the current local time passes that dueTime.
 * - Date-only tasks (no dueTime or blank dueTime) are not overdue until
 *   the start of the following local day.
 */
export function isTaskOverdue(
  task: { completed: boolean; dueDate: string; dueTime?: string },
  now: Date = new Date()
): boolean {
  if (task.completed) return false;
  if (!task.dueDate) return false;

  const todayKey = localDateKey(now);

  if (task.dueDate < todayKey) {
    return true;
  }
  if (task.dueDate > todayKey) {
    return false;
  }

  // task.dueDate === todayKey
  if (!task.dueTime || task.dueTime.trim() === '') {
    return false;
  }

  const [dueHours, dueMinutes] = task.dueTime.split(':').map(Number);
  if (isNaN(dueHours) || isNaN(dueMinutes)) {
    return false;
  }

  const currentHours = now.getHours();
  const currentMinutes = now.getMinutes();

  if (currentHours > dueHours) return true;
  if (currentHours === dueHours && currentMinutes > dueMinutes) return true;
  return false;
}

/**
 * Calculates current streak and longest streak from real task completion history.
 *
 * Rules:
 * 1. Groups tasks with completedAt into local calendar dates.
 * 2. If a task was completed today, the streak counts consecutive days backward from today.
 * 3. If no task was completed today, but a task was completed yesterday,
 *    the streak is maintained counting backward from yesterday.
 * 4. If neither today nor yesterday has a completed task, current streak is 0.
 * 5. Longest streak is the maximum consecutive days achieved across all history.
 */
export function calculateRealStreak(
  tasks: Task[],
  now: Date = new Date()
): { currentStreak: number; longestStreak: number; lastCompletedDate: string } {
  const completedDateSet = new Set<string>();

  for (const t of tasks) {
    if (t.completed && t.completedAt) {
      try {
        const d = new Date(t.completedAt);
        if (!isNaN(d.getTime())) {
          completedDateSet.add(localDateKey(d));
        }
      } catch {
        // Ignore unparseable timestamps
      }
    }
  }

  if (completedDateSet.size === 0) {
    return { currentStreak: 0, longestStreak: 0, lastCompletedDate: '' };
  }

  const sortedDates = Array.from(completedDateSet).sort();
  const lastCompletedDate = sortedDates[sortedDates.length - 1];

  const todayKey = localDateKey(now);
  const yesterdayKey = offsetLocalDate(todayKey, -1);

  // Determine current streak
  let currentStreak = 0;
  let checkKey: string | null = null;

  if (completedDateSet.has(todayKey)) {
    checkKey = todayKey;
  } else if (completedDateSet.has(yesterdayKey)) {
    checkKey = yesterdayKey;
  }

  if (checkKey !== null) {
    while (completedDateSet.has(checkKey)) {
      currentStreak++;
      checkKey = offsetLocalDate(checkKey, -1);
    }
  }

  // Calculate longest streak in history
  let longestStreak = 0;
  let running = 0;
  let prevDate: string | null = null;

  for (const dateStr of sortedDates) {
    if (prevDate === null) {
      running = 1;
    } else {
      const expectedNext = offsetLocalDate(prevDate, 1);
      if (dateStr === expectedNext) {
        running++;
      } else {
        running = 1;
      }
    }
    prevDate = dateStr;
    if (running > longestStreak) {
      longestStreak = running;
    }
  }

  longestStreak = Math.max(longestStreak, currentStreak);

  return {
    currentStreak,
    longestStreak,
    lastCompletedDate,
  };
}
