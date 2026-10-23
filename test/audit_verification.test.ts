/**
 * Chronos Audit Verification Automated Test Suite
 * Tests all P1 and P2 audit findings directly using real unit assertions.
 */

import { 
  localDateKey, 
  parseLocalDate, 
  offsetLocalDate, 
  isTaskOverdue, 
  calculateRealStreak 
} from '../src/utils/dateUtils';
import { calculateNextOccurrence } from '../src/services/notifications';
import { StorageService } from '../src/services/storage';
import { Task } from '../src/types';

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string, details?: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`  [PASS] ${testName}`);
  } else {
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('--- 1. Testing Local Date Key & Timezone Stability (P1-A) ---');
{
  // Test localDateKey creates YYYY-MM-DD
  const sample = new Date(2026, 9, 22, 15, 30, 0); // Oct 22, 2026 15:30:00 local
  const key = localDateKey(sample);
  assert(key === '2026-10-22', 'localDateKey formats correctly without UTC shift', `Got ${key}`);

  // Test offsetLocalDate
  const nextWeek = offsetLocalDate('2026-10-22', 7);
  assert(nextWeek === '2026-10-29', 'offsetLocalDate +7 days handles addition', `Got ${nextWeek}`);

  const prevMonth = offsetLocalDate('2026-03-01', -1);
  assert(prevMonth === '2026-02-28', 'offsetLocalDate -1 from March 1 in non-leap year yields Feb 28', `Got ${prevMonth}`);

  const leapPrevMonth = offsetLocalDate('2028-03-01', -1);
  assert(leapPrevMonth === '2028-02-29', 'offsetLocalDate -1 from March 1 in leap year (2028) yields Feb 29', `Got ${leapPrevMonth}`);
}

console.log('\n--- 2. Testing Recurrence Advancing & Month-End Clamping (P1-B) ---');
{
  const makeTask = (recurrence: any, dueDate = '2026-01-31'): Task => ({
    id: 'test-rec-1',
    title: 'Monthly Rent Payment',
    description: '',
    categoryId: 'personal',
    priority: 'high',
    dueDate,
    dueTime: '10:00',
    estimatedDuration: 15,
    completed: false,
    pinned: false,
    subtasks: [{ id: 'sub-1', title: 'Check bank balance', completed: true }],
    notes: '',
    recurrence,
    reminders: [],
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });

  // Daily recurrence
  const dailyTask = makeTask({ type: 'daily', interval: 1 }, '2026-10-22');
  const nextDaily = calculateNextOccurrence(dailyTask);
  assert(nextDaily !== null && nextDaily.dueDate === '2026-10-23', 'Daily recurrence advances 1 day', `Got ${nextDaily?.dueDate}`);

  // Monthly recurrence: Jan 31 -> Feb 28 (month-end clamp)
  const monthlyTaskJan31 = makeTask({ type: 'monthly', interval: 1 }, '2026-01-31');
  const nextMonthly = calculateNextOccurrence(monthlyTaskJan31);
  assert(nextMonthly !== null && nextMonthly.dueDate === '2026-02-28', 'Monthly Jan 31 clamps to Feb 28 in 2026 (preventing JS setMonth overflow into March)', `Got ${nextMonthly?.dueDate}`);

  // Monthly recurrence in leap year 2028: Jan 31 -> Feb 29
  const leapJan31 = makeTask({ type: 'monthly', interval: 1 }, '2028-01-31');
  const nextLeapFeb = calculateNextOccurrence(leapJan31);
  assert(nextLeapFeb !== null && nextLeapFeb.dueDate === '2028-02-29', 'Monthly Jan 31 clamps to Feb 29 in leap year 2028', `Got ${nextLeapFeb?.dueDate}`);

  // Yearly recurrence on leap day: Feb 29, 2028 -> Feb 28, 2029
  const leapYearTask = makeTask({ type: 'yearly', interval: 1 }, '2028-02-29');
  const nextYearly = calculateNextOccurrence(leapYearTask);
  assert(nextYearly !== null && nextYearly.dueDate === '2029-02-28', 'Yearly recurrence from Feb 29, 2028 clamps to Feb 28, 2029 in non-leap year', `Got ${nextYearly?.dueDate}`);

  // Subtasks reset
  assert(nextMonthly !== null && nextMonthly.subtasks[0].completed === false, 'Next recurring occurrence resets subtasks to incomplete');
}

console.log('\n--- 3. Testing Real Overdue Logic (P1-A & P2-D) ---');
{
  const testNow = new Date(2026, 9, 22, 16, 30, 0); // 2026-10-22 16:30 local

  const taskPastDay: Task = {
    id: 't-1',
    title: 'Past day task',
    description: '',
    categoryId: 'college',
    priority: 'high',
    dueDate: '2026-10-21',
    dueTime: '12:00',
    estimatedDuration: 30,
    completed: false,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '',
    updatedAt: '',
  };
  assert(isTaskOverdue(taskPastDay, testNow) === true, 'Task due on yesterday is overdue');

  const taskCompletedPastDay: Task = {
    ...taskPastDay,
    id: 't-1-comp',
    completed: true,
  };
  assert(isTaskOverdue(taskCompletedPastDay, testNow) === false, 'Completed past task is NEVER overdue');

  // Today with time: due 16:00 at 16:30 -> OVERDUE
  const taskTodayPastTime: Task = {
    ...taskPastDay,
    id: 't-2',
    dueDate: '2026-10-22',
    dueTime: '16:00',
  };
  assert(isTaskOverdue(taskTodayPastTime, testNow) === true, 'Task due today at 16:00 is overdue when current time is 16:30');

  // Today with time: due 17:00 at 16:30 -> NOT OVERDUE
  const taskTodayFutureTime: Task = {
    ...taskPastDay,
    id: 't-3',
    dueDate: '2026-10-22',
    dueTime: '17:00',
  };
  assert(isTaskOverdue(taskTodayFutureTime, testNow) === false, 'Task due today at 17:00 is NOT overdue when current time is 16:30');

  // Today date-only (empty dueTime): stays active whole day -> NOT OVERDUE
  const taskTodayDateOnly: Task = {
    ...taskPastDay,
    id: 't-4',
    dueDate: '2026-10-22',
    dueTime: '',
  };
  assert(isTaskOverdue(taskTodayDateOnly, testNow) === false, 'Date-only task scheduled for today stays active all day and is not overdue at 16:30');
}

console.log('\n--- 4. Testing Truthful Streak Calculations (P1-D) ---');
{
  const refDate = new Date(2026, 9, 24, 18, 0, 0); // 2026-10-24

  // No completed tasks
  const streakEmpty = calculateRealStreak([], refDate);
  assert(streakEmpty.currentStreak === 0 && streakEmpty.longestStreak === 0, 'Zero completed tasks yields 0-day streak');

  // Tasks completed on consecutive days: 2026-10-22, 2026-10-23, 2026-10-24
  const makeCompleted = (id: string, dateStr: string): Task => ({
    id,
    title: `Task ${id}`,
    description: '',
    categoryId: 'general',
    priority: 'medium',
    dueDate: dateStr,
    dueTime: '12:00',
    estimatedDuration: 15,
    completed: true,
    completedAt: `${dateStr}T14:20:00.000Z`,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '',
    updatedAt: '',
  });

  const consecutiveTasks = [
    makeCompleted('1', '2026-10-22'),
    makeCompleted('2', '2026-10-23'),
    makeCompleted('3', '2026-10-24'),
  ];
  const streak3 = calculateRealStreak(consecutiveTasks, refDate);
  assert(streak3.currentStreak === 3 && streak3.longestStreak === 3, 'Consecutive 3 days yields truthful 3-day streak', `Got ${streak3.currentStreak}`);

  // Broken streak (gap): completed on 2026-10-20, none on 2026-10-21, 22, 23, 24
  const brokenTasks = [makeCompleted('old', '2026-10-20')];
  const streakBroken = calculateRealStreak(brokenTasks, refDate);
  assert(streakBroken.currentStreak === 0, 'Broken streak with gap yields 0-day current streak');
}

console.log('\n--- 5. Testing Storage Initialization & Persistence (P1-C) ---');
{
  // Test generateSeedTasks returns empty array to prevent unwanted demo tasks
  const seed = StorageService.generateSeedTasks();
  assert(Array.isArray(seed) && seed.length === 0, 'generateSeedTasks returns empty array [] preventing unwanted mock task insertion');

  // Mock localStorage for test environment
  const mockStorage: Record<string, string> = {};
  const origLocal = (global as any).localStorage;
  (global as any).localStorage = {
    getItem: (k: string) => mockStorage[k] || null,
    setItem: (k: string, v: string) => { mockStorage[k] = v; },
    removeItem: (k: string) => { delete mockStorage[k]; },
    clear: () => { Object.keys(mockStorage).forEach(k => delete mockStorage[k]); },
  };

  // Simulate first install marking
  mockStorage['chronos_installed'] = '1';
  mockStorage['chronos_tasks'] = JSON.stringify([]);

  // Verify getTasksFallback respects empty list and does NOT inject seed tasks
  const tasksAfterInstall = (StorageService as any).getTasksFallback();
  assert(Array.isArray(tasksAfterInstall) && tasksAfterInstall.length === 0, 'getTasksFallback respects chronos_installed and preserves 0 tasks without re-seeding');

  // Save a custom task
  const userTask: Task = {
    id: 'user-task-1',
    title: 'Important Exam Study',
    description: '',
    categoryId: 'college',
    priority: 'high',
    dueDate: '2026-10-25',
    dueTime: '09:00',
    estimatedDuration: 120,
    completed: false,
    pinned: true,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T10:00:00.000Z',
  };
  mockStorage['chronos_tasks'] = JSON.stringify([userTask]);

  const retrieved = (StorageService as any).getTasksFallback();
  assert(retrieved.length === 1 && retrieved[0].title === 'Important Exam Study', 'User task retrieved faithfully from fallback storage');

  // Restore original global
  (global as any).localStorage = origLocal;
}

console.log(`\n========================================`);
console.log(`TEST SUMMARY: ${passedTests} / ${totalTests} assertions passed.`);
console.log(`========================================`);
if (passedTests === totalTests) {
  console.log('ALL AUDIT STABILIZATION TESTS PASSED!\n');
} else {
  console.error('SOME TESTS FAILED!\n');
  process.exit(1);
}
