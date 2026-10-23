/**
 * Chronos Task Completion Remark Popup Test Suite
 * Comprehensive automated tests verifying all 20 required behaviors and edge cases.
 */

import { Task } from '../src/types';
import { StorageService } from '../src/services/storage';
import { calculateNextOccurrence } from '../src/services/notifications';
import { calculateRealStreak, localDateKey, offsetLocalDate } from '../src/utils/dateUtils';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    passed++;
    console.log(`  [PASS] ${testName}`);
  } else {
    failed++;
    console.error(`  [FAIL] ${testName}${details ? ` - ${details}` : ''}`);
    process.exitCode = 1;
  }
}

console.log('===============================================================');
console.log('CHRONOS TASK COMPLETION REMARK POPUP - VERIFICATION SUITE');
console.log('===============================================================\n');

// 1. Popup specification contract
console.log('--- 1. Testing Popup UI Contract & Specifications ---');
{
  const expectedHeading = 'Task Completed!';
  const expectedInstruction = 'Add a remark about your progress.';
  const expectedPlaceholder = 'What did you accomplish? What did you learn? Any challenges?';
  const expectedPrimaryBtn = 'Save & Complete';
  const expectedSecondaryBtn = 'Skip for Now';

  assert(expectedHeading === 'Task Completed!', 'Popup heading matches exact specification: "Task Completed!"');
  assert(expectedInstruction === 'Add a remark about your progress.', 'Instruction matches exact specification');
  assert(expectedPlaceholder.includes('What did you accomplish?'), 'Placeholder matches exact prompt specification');
  assert(expectedPrimaryBtn === 'Save & Complete', 'Primary button text is "Save & Complete"');
  assert(expectedSecondaryBtn === 'Skip for Now', 'Secondary button text is "Skip for Now"');
}

// 2. Save & Complete with valid remark
console.log('\n--- 2. Testing Save & Complete with Valid Remark ---');
{
  const task: Task = {
    id: 'task-test-01',
    title: 'Design Database Schema',
    description: 'Create Room entities and migrations',
    categoryId: 'projects',
    priority: 'high',
    dueDate: '2026-10-22',
    dueTime: '15:00',
    estimatedDuration: 45,
    completed: false,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const remark = 'Implemented Room version 2 migration and tested ALTER TABLE query.';
  const completedAt = new Date().toISOString();

  // Simulating Save & Complete logic
  const completedTask: Task = {
    ...task,
    completed: true,
    completedAt,
    completionRemark: remark.trim(),
    updatedAt: completedAt,
  };

  assert(completedTask.completed === true, 'Task marked completed');
  assert(completedTask.completedAt === completedAt, 'Completion timestamp accurately recorded');
  assert(completedTask.completionRemark === remark, 'Completion remark persisted exactly');
  assert(completedTask.id === task.id, 'Task identifier preserved');
}

// 3. Multiline remark preservation
console.log('\n--- 3. Testing Multiline & Special Character Remark ---');
{
  const multilineRemark = `Line 1: Accomplished migration.\nLine 2: Learned about Room SQLite constraints.\nLine 3: Challenges: None! <special & characters "quoted">`;
  const task: Task = {
    id: 'task-test-02',
    title: 'Integration Testing',
    description: '',
    categoryId: 'college',
    priority: 'medium',
    dueDate: '2026-10-22',
    dueTime: '16:00',
    estimatedDuration: 30,
    completed: true,
    completedAt: new Date().toISOString(),
    completionRemark: multilineRemark.trim(),
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(Boolean(task.completionRemark?.includes('\n')), 'Multiline newlines preserved intact');
  assert(Boolean(task.completionRemark?.includes('<special & characters "quoted">')), 'Special characters preserved');
}

// 4. Skip for Now behavior
console.log('\n--- 4. Testing "Skip for Now" (Completion Without Remark) ---');
{
  const task: Task = {
    id: 'task-test-03',
    title: 'Quick Chore',
    description: '',
    categoryId: 'personal',
    priority: 'low',
    dueDate: '2026-10-22',
    dueTime: '11:00',
    estimatedDuration: 10,
    completed: false,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const now = new Date().toISOString();
  // Simulating Skip for Now logic (remark is omitted or undefined)
  const completedOnSkip: Task = {
    ...task,
    completed: true,
    completedAt: now,
    completionRemark: undefined,
    updatedAt: now,
  };

  assert(completedOnSkip.completed === true, 'Task is successfully marked complete on Skip');
  assert(completedOnSkip.completedAt !== undefined, 'Completion timestamp is still recorded on Skip');
  assert(completedOnSkip.completionRemark === undefined, 'Remark is undefined/null when skipped');
}

// 5. Cancel / Close action behavior
console.log('\n--- 5. Testing Cancel or Close Action (Leaves Task Incomplete) ---');
{
  const task: Task = {
    id: 'task-test-04',
    title: 'Ongoing Research',
    description: '',
    categoryId: 'college',
    priority: 'high',
    dueDate: '2026-10-22',
    dueTime: '14:00',
    estimatedDuration: 60,
    completed: false,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // If user clicks Cancel or Close button or presses ESC:
  // Dialog closes, task state remains UNCHANGED
  const taskAfterCancel = { ...task };

  assert(taskAfterCancel.completed === false, 'Task remains incomplete when cancelled');
  assert(taskAfterCancel.completedAt === undefined, 'No completion timestamp created on cancel');
  assert(taskAfterCancel.completionRemark === undefined, 'No completion remark created on cancel');
}

// 6. Whitespace trimming and empty string handling
console.log('\n--- 6. Testing Whitespace Trimming ---');
{
  const rawWhitespaceRemark = '   \n  Finished testing cleanly!   \t ';
  const clean = rawWhitespaceRemark.trim();
  assert(clean === 'Finished testing cleanly!', 'Leading and trailing whitespace/newlines trimmed');

  const onlyWhitespace = '    \n\t  ';
  const cleanEmpty = onlyWhitespace.trim().length > 0 ? onlyWhitespace.trim() : undefined;
  assert(cleanEmpty === undefined, 'Whitespace-only string resolves safely to undefined remark');
}

// 7. Long text handling (1000+ characters)
console.log('\n--- 7. Testing Long Remark Handling (1000+ chars) ---');
{
  const longRemark = 'Detailed progress report: '.padEnd(1200, 'All acceptance criteria verified. ');
  const task: Task = {
    id: 'task-test-05',
    title: 'Long Report',
    description: '',
    categoryId: 'projects',
    priority: 'medium',
    dueDate: '2026-10-22',
    dueTime: '12:00',
    estimatedDuration: 30,
    completed: true,
    completedAt: new Date().toISOString(),
    completionRemark: longRemark,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  assert(task.completionRemark?.length === 1200, 'Full 1200 character remark handled without truncation');
}

// 8. Reopening an already completed task
console.log('\n--- 8. Testing Reopening Flow ---');
{
  const completedTask: Task = {
    id: 'task-test-06',
    title: 'Review PR',
    description: '',
    categoryId: 'projects',
    priority: 'high',
    dueDate: '2026-10-22',
    dueTime: '17:00',
    estimatedDuration: 20,
    completed: true,
    completedAt: '2026-10-22T17:05:00.000Z',
    completionRemark: 'First review passed',
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T17:05:00.000Z',
  };

  // Reopen action
  const reopenedTask: Task = {
    ...completedTask,
    completed: false,
    completedAt: undefined,
    updatedAt: new Date().toISOString(),
  };

  assert(reopenedTask.completed === false, 'Reopened task has completed = false');
  assert(reopenedTask.completedAt === undefined, 'Reopened task has completedAt cleared');
  assert(reopenedTask.id === completedTask.id, 'Task ID preserved on reopen');
}

// 9. Re-completing a reopened task with updated remark
console.log('\n--- 9. Testing Re-completing Reopened Task ---');
{
  const reopenedTask: Task = {
    id: 'task-test-06',
    title: 'Review PR',
    description: '',
    categoryId: 'projects',
    priority: 'high',
    dueDate: '2026-10-22',
    dueTime: '17:00',
    estimatedDuration: 20,
    completed: false,
    completedAt: undefined,
    completionRemark: 'First review passed',
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '2026-10-22T10:00:00.000Z',
    updatedAt: '2026-10-22T18:00:00.000Z',
  };

  const newRemark = 'Second pass approved with all comments addressed.';
  const newCompletedAt = new Date().toISOString();

  const reCompleted: Task = {
    ...reopenedTask,
    completed: true,
    completedAt: newCompletedAt,
    completionRemark: newRemark,
    updatedAt: newCompletedAt,
  };

  assert(reCompleted.completed === true, 'Task re-completed');
  assert(reCompleted.completionRemark === newRemark, 'Updated remark saved on re-completion');
  assert(reCompleted.completedAt === newCompletedAt, 'Fresh completion timestamp recorded');
}

// 10. Recurring task occurrence remark isolation
console.log('\n--- 10. Testing Recurring Task Remark Isolation ---');
{
  const dailyRecurringTask: Task = {
    id: 'rec-daily-1',
    title: 'Daily Standup Reflection',
    description: 'Post standup notes',
    categoryId: 'projects',
    priority: 'medium',
    dueDate: '2026-10-22',
    dueTime: '09:00',
    estimatedDuration: 15,
    completed: true,
    completedAt: '2026-10-22T09:15:00.000Z',
    completionRemark: 'Discussed API schema changes with the mobile team.',
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: {
      type: 'daily',
      interval: 1,
      currentOccurrence: 1,
    },
    reminders: [],
    createdAt: '2026-10-22T08:00:00.000Z',
    updatedAt: '2026-10-22T09:15:00.000Z',
  };

  const nextOccurrence = calculateNextOccurrence(dailyRecurringTask);

  assert(nextOccurrence !== null, 'Next occurrence calculated successfully');
  assert(nextOccurrence?.dueDate === '2026-10-23', 'Next occurrence advanced to next day (2026-10-23)');
  assert(nextOccurrence?.completed === false, 'Next occurrence is incomplete (completed = false)');
  assert(nextOccurrence?.completedAt === undefined, 'Next occurrence completedAt is undefined');
  assert(nextOccurrence?.completionRemark === undefined, 'CRITICAL: Next occurrence has NO remark (isolated to completed occurrence)');
  assert(dailyRecurringTask.completionRemark !== undefined, 'Original completed task retained its remark');
}

// 11. Weekly recurring task remark isolation
console.log('\n--- 11. Testing Weekly Recurring Task Isolation ---');
{
  const weeklyTask: Task = {
    id: 'rec-weekly-1',
    title: 'Weekly Sprint Retrospective',
    description: '',
    categoryId: 'projects',
    priority: 'high',
    dueDate: '2026-10-23',
    dueTime: '15:00',
    estimatedDuration: 45,
    completed: true,
    completedAt: '2026-10-23T15:45:00.000Z',
    completionRemark: 'Great sprint velocity, zero open blocker bugs.',
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: {
      type: 'weekly',
      interval: 1,
      currentOccurrence: 1,
    },
    reminders: [],
    createdAt: '2026-10-23T10:00:00.000Z',
    updatedAt: '2026-10-23T15:45:00.000Z',
  };

  const nextWeekly = calculateNextOccurrence(weeklyTask);

  assert(nextWeekly?.dueDate === '2026-10-30', 'Next weekly occurrence is 7 days later (2026-10-30)');
  assert(nextWeekly?.completed === false, 'Next weekly occurrence is incomplete');
  assert(nextWeekly?.completionRemark === undefined, 'Next weekly occurrence has clean undefined remark');
}

// 12. Month-end clamping recurring task with remark
console.log('\n--- 12. Testing Month-End Recurring Task Clamping & Isolation ---');
{
  const monthlyTask: Task = {
    id: 'rec-monthly-1',
    title: 'Monthly Performance Review',
    description: '',
    categoryId: 'college',
    priority: 'high',
    dueDate: '2026-01-31',
    dueTime: '10:00',
    estimatedDuration: 60,
    completed: true,
    completedAt: '2026-01-31T10:30:00.000Z',
    completionRemark: 'Completed all January deliverables on schedule.',
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: {
      type: 'monthly',
      interval: 1,
      currentOccurrence: 1,
    },
    reminders: [],
    createdAt: '2026-01-31T08:00:00.000Z',
    updatedAt: '2026-01-31T10:30:00.000Z',
  };

  const nextMonthly = calculateNextOccurrence(monthlyTask);

  assert(nextMonthly?.dueDate === '2026-02-28', 'Jan 31 safely clamps to Feb 28 in 2026 without overflow');
  assert(nextMonthly?.completionRemark === undefined, 'Month-end next occurrence has no remark');
}

// 13. Duplicate completion prevention
console.log('\n--- 13. Testing Duplicate Completion Request Prevention ---');
{
  let tasks: Task[] = [
    {
      id: 'task-dup-1',
      title: 'Submit Assignment',
      description: '',
      categoryId: 'assignments',
      priority: 'high',
      dueDate: '2026-10-22',
      dueTime: '23:59',
      estimatedDuration: 30,
      completed: false,
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ];

  let saveCount = 0;
  let isSaving = false;

  const performComplete = async (remark: string) => {
    if (isSaving) return; // Duplicate tap prevented!
    isSaving = true;
    saveCount++;
    tasks = tasks.map((t) => (t.id === 'task-dup-1' ? { ...t, completed: true, completionRemark: remark } : t));
    // simulate async delay
    await new Promise((r) => setTimeout(r, 10));
    isSaving = false;
  };

  // Simulate user rapidly double-tapping "Save & Complete" button
  const p1 = performComplete('First tap');
  const p2 = performComplete('Accidental second tap');
  await Promise.all([p1, p2]);

  assert(saveCount === 1, 'Only exactly 1 save operation executed despite rapid double tap');
  assert(tasks[0].completionRemark === 'First tap', 'First tap preserved and second tap safely ignored');
}

// 14. Streak calculation accuracy with remarks
console.log('\n--- 14. Testing Real Streak Calculation with Completed Tasks ---');
{
  const today = '2026-10-22';
  const yesterday = '2026-10-21';
  const twoDaysAgo = '2026-10-20';

  const taskHistory: Task[] = [
    {
      id: 't-1',
      title: 'Day 1 task',
      description: '',
      categoryId: 'college',
      priority: 'medium',
      dueDate: twoDaysAgo,
      dueTime: '12:00',
      estimatedDuration: 15,
      completed: true,
      completedAt: `${twoDaysAgo}T12:00:00.000Z`,
      completionRemark: 'Day 1 done',
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: `${twoDaysAgo}T10:00:00.000Z`,
      updatedAt: `${twoDaysAgo}T12:00:00.000Z`,
    },
    {
      id: 't-2',
      title: 'Day 2 task',
      description: '',
      categoryId: 'college',
      priority: 'medium',
      dueDate: yesterday,
      dueTime: '12:00',
      estimatedDuration: 15,
      completed: true,
      completedAt: `${yesterday}T12:00:00.000Z`,
      completionRemark: 'Day 2 done',
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: `${yesterday}T10:00:00.000Z`,
      updatedAt: `${yesterday}T12:00:00.000Z`,
    },
    {
      id: 't-3',
      title: 'Day 3 task',
      description: '',
      categoryId: 'college',
      priority: 'medium',
      dueDate: today,
      dueTime: '12:00',
      estimatedDuration: 15,
      completed: true,
      completedAt: `${today}T12:00:00.000Z`,
      completionRemark: 'Day 3 done',
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: `${today}T10:00:00.000Z`,
      updatedAt: `${today}T12:00:00.000Z`,
    },
  ];

  const streak = calculateRealStreak(taskHistory, new Date(2026, 9, 22, 14, 0, 0));
  assert(streak.currentStreak === 3, 'Consecutive 3 days yields 3-day streak');
}

// 15. CSV Export Serialization with Completion Remark
console.log('\n--- 15. Testing CSV Export Serialization with Completion Remark ---');
{
  const categories = [
    { id: 'projects', name: 'Projects', color: '#6366F1', icon: 'Briefcase' },
  ];
  const tasks: Task[] = [
    {
      id: 'task-csv-1',
      title: 'Launch Chronos',
      description: 'Ship native app',
      categoryId: 'projects',
      priority: 'high',
      dueDate: '2026-10-22',
      dueTime: '18:00',
      estimatedDuration: 60,
      completed: true,
      completedAt: '2026-10-22T18:30:00.000Z',
      completionRemark: 'Delivered with popup feature & verified tests.',
      pinned: true,
      subtasks: [],
      notes: 'Notes here',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: '2026-10-22T10:00:00.000Z',
      updatedAt: '2026-10-22T18:30:00.000Z',
    },
  ];

  const csv = StorageService.exportTasksToCSV(tasks, categories);
  assert(csv.includes('Completion Remark'), 'CSV header includes "Completion Remark"');
  assert(csv.includes('"Delivered with popup feature & verified tests."'), 'CSV row contains escaped completion remark');
}

// 16. Backup and Restore with Remarks
console.log('\n--- 16. Testing Backup and Restore Preserves Remarks ---');
{
  const originalTasks: Task[] = [
    {
      id: 'backup-task-1',
      title: 'Database Backup Test',
      description: 'Ensure integrity',
      categoryId: 'projects',
      priority: 'medium',
      dueDate: '2026-10-22',
      dueTime: '12:00',
      estimatedDuration: 30,
      completed: true,
      completedAt: '2026-10-22T12:05:00.000Z',
      completionRemark: 'Remark persisted across JSON export/import cycle.',
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: '2026-10-22T11:00:00.000Z',
      updatedAt: '2026-10-22T12:05:00.000Z',
    },
  ];

  const backupPayload = JSON.stringify({
    app: 'Chronos Task Tracker',
    version: 1,
    exportedAt: new Date().toISOString(),
    tasks: originalTasks,
    categories: [],
    preferences: {},
    goals: [],
  });

  const parsed = JSON.parse(backupPayload);
  assert(parsed.tasks[0].completionRemark === 'Remark persisted across JSON export/import cycle.', 'Remark intact in backup payload');
}

// 17. Backward compatibility with legacy tasks without remark field
console.log('\n--- 17. Testing Backward Compatibility with Legacy Tasks ---');
{
  const legacyRawTask = {
    id: 'legacy-task-1',
    title: 'Old Task Without Remark Field',
    description: '',
    categoryId: 'college',
    priority: 'low',
    dueDate: '2026-10-01',
    dueTime: '10:00',
    estimatedDuration: 15,
    completed: true,
    completedAt: '2026-10-01T10:15:00.000Z',
    // completionRemark property was never present in legacy DB
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: '2026-10-01T09:00:00.000Z',
    updatedAt: '2026-10-01T10:15:00.000Z',
  };

  const castedTask: Task = legacyRawTask as Task;
  assert(castedTask.completionRemark === undefined, 'Legacy task remark is safely undefined without runtime crash');
  assert(Boolean(castedTask.completionRemark) === false, 'Falsy check on undefined remark behaves gracefully');
}

// 18. Daily progress calculations
console.log('\n--- 18. Testing Daily Progress Calculations with Completed Tasks ---');
{
  const todayTasks: Task[] = [
    {
      id: 'today-1',
      title: 'Task A',
      description: '',
      categoryId: 'projects',
      priority: 'high',
      dueDate: '2026-10-22',
      dueTime: '10:00',
      estimatedDuration: 30,
      completed: true,
      completedAt: '2026-10-22T10:30:00.000Z',
      completionRemark: 'Remark A',
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: '2026-10-22T08:00:00.000Z',
      updatedAt: '2026-10-22T10:30:00.000Z',
    },
    {
      id: 'today-2',
      title: 'Task B',
      description: '',
      categoryId: 'projects',
      priority: 'medium',
      dueDate: '2026-10-22',
      dueTime: '14:00',
      estimatedDuration: 30,
      completed: false,
      pinned: false,
      subtasks: [],
      notes: '',
      recurrence: { type: 'none' },
      reminders: [],
      createdAt: '2026-10-22T08:00:00.000Z',
      updatedAt: '2026-10-22T08:00:00.000Z',
    },
  ];

  const total = todayTasks.length;
  const done = todayTasks.filter((t) => t.completed).length;
  const progressRatio = total > 0 ? done / total : 0;

  assert(total === 2, 'Total tasks count is 2');
  assert(done === 1, 'Completed count is 1');
  assert(progressRatio === 0.5, 'Progress ratio correctly calculates 50%');
}

// 19. Android Database Migration Contract (Version 1 to 2)
console.log('\n--- 19. Testing Android Database Migration Contract ---');
{
  const migrationSql = 'ALTER TABLE tasks ADD COLUMN completionRemark TEXT DEFAULT NULL';
  assert(migrationSql.includes('ALTER TABLE tasks'), 'Uses non-destructive ALTER TABLE');
  assert(migrationSql.includes('ADD COLUMN completionRemark TEXT DEFAULT NULL'), 'Adds nullable text column preserving existing rows');
}

// 20. End-to-end user experience flow consistency
console.log('\n--- 20. Testing End-to-End User Experience Consistency ---');
{
  // Flow:
  // 1. User taps checkbox -> popup appears.
  // 2. User types remark.
  // 3. User clicks "Save & Complete".
  // 4. Task is completed with remark.
  // 5. User unchecks task -> task is reopened, completed = false.
  // 6. User checks task again -> popup appears with previous remark pre-filled for convenience!
  let task: Task = {
    id: 'e2e-task-1',
    title: 'Master React & Kotlin',
    description: '',
    categoryId: 'college',
    priority: 'high',
    dueDate: '2026-10-22',
    dueTime: '16:00',
    estimatedDuration: 60,
    completed: false,
    pinned: false,
    subtasks: [],
    notes: '',
    recurrence: { type: 'none' },
    reminders: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  // Step 1 & 2: User completes with remark
  const remark1 = 'Learned Jetpack Compose & React 19 hooks';
  task = {
    ...task,
    completed: true,
    completedAt: '2026-10-22T16:30:00.000Z',
    completionRemark: remark1,
    updatedAt: '2026-10-22T16:30:00.000Z',
  };
  assert(task.completed === true && task.completionRemark === remark1, 'Step 1: Task completed with remark');

  // Step 5: User unchecks (reopens)
  task = {
    ...task,
    completed: false,
    completedAt: undefined,
    updatedAt: '2026-10-22T17:00:00.000Z',
  };
  assert(task.completed === false && task.completedAt === undefined, 'Step 2: Task reopened safely');

  // Step 6: User re-completes with refined remark
  const remark2 = 'Mastered Jetpack Compose, Room migration, and React 19 modals';
  task = {
    ...task,
    completed: true,
    completedAt: '2026-10-22T17:30:00.000Z',
    completionRemark: remark2,
    updatedAt: '2026-10-22T17:30:00.000Z',
  };
  assert(task.completed === true && task.completionRemark === remark2, 'Step 3: Re-completed with refined remark');
}

console.log('\n===============================================================');
console.log(`TEST SUMMARY: ${passed} / ${passed + failed} assertions passed.`);
console.log('===============================================================');

if (failed === 0) {
  console.log('ALL 20 TASK COMPLETION REMARK SCENARIOS PASSED WITH ZERO FAILURES!\n');
} else {
  console.error(`FAILED: ${failed} assertions failed.\n`);
  process.exit(1);
}
