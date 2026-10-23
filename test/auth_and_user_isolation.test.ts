/**
 * Chronos Authentication, User Profiles & Personal Task Management Verification Suite
 * Offline-First Architecture (W3C Web Crypto PBKDF2 + User-Scoped Data Isolation)
 */

import { Task, UserProfile } from '../src/types';
import { AuthService } from '../src/services/auth';
import { StorageService } from '../src/services/storage';

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

async function runTests() {
  console.log('===============================================================');
  console.log('CHRONOS AUTHENTICATION & MULTI-USER ISOLATION TEST SUITE');
  console.log('===============================================================\n');

// Set up mock window / localStorage for headless Node environment
const memoryStorage: Record<string, string> = {};
const mockStorage = {
  getItem: (k: string) => memoryStorage[k] ?? null,
  setItem: (k: string, v: string) => { memoryStorage[k] = String(v); },
  removeItem: (k: string) => { delete memoryStorage[k]; },
  clear: () => { Object.keys(memoryStorage).forEach(k => delete memoryStorage[k]); },
};

(globalThis as any).localStorage = mockStorage;
(globalThis as any).sessionStorage = mockStorage;
if (typeof globalThis.window === 'undefined') {
  (globalThis as any).window = {
    localStorage: mockStorage,
    sessionStorage: mockStorage,
  };
}

  // --- 1. Password Security & PBKDF2 Cryptographic Validation ---
  console.log('--- 1. Testing Cryptographic Security & Password Hashing ---');
  let aliceProfile: UserProfile | null = null;
  let aliceVerificationCode = '';
  {
    // Register Alice
    const regResult = await AuthService.register(
      'Alice.Smith@ChronosApp.com',
      'SecurePassword123!',
      'Alice Smith'
    );

    assert(!!regResult.user, 'Alice user registration succeeded');
    assert(regResult.user.email === 'alice.smith@chronosapp.com', 'Email normalized to lowercase');
    assert(regResult.user.displayName === 'Alice Smith', 'Display name preserved');
    assert(regResult.user.isEmailVerified === false, 'New user starts with isEmailVerified = false');
    assert(typeof regResult.verificationCode === 'string' && regResult.verificationCode.length === 6, 'Initial 6-digit verification code generated');

    aliceProfile = regResult.user;
    aliceVerificationCode = regResult.verificationCode;

    // Verify raw cryptographic record has salt and PBKDF2 hash (not plaintext)
    const rawRecord = await AuthService.findUserByEmail('alice.smith@chronosapp.com');
    assert(!!rawRecord, 'Raw user record stored in local database');
    assert(rawRecord?.passwordHashHex !== 'SecurePassword123!', 'Password is NOT stored in plaintext');
    assert(typeof rawRecord?.saltHex === 'string' && rawRecord.saltHex.length === 32, '16-byte random salt stored as 32 hex chars');
    assert(typeof rawRecord?.passwordHashHex === 'string' && rawRecord.passwordHashHex.length === 64, '256-bit PBKDF2 hash stored as 64 hex chars');

    // Duplicate email registration should fail cleanly
    let duplicateFailed = false;
    try {
      await AuthService.register('ALICE.SMITH@chronosapp.com', 'OtherPassword456!', 'Alice Clone');
    } catch (e: any) {
      duplicateFailed = true;
      assert(e.message.includes('already exists'), 'Duplicate email caught with clear message');
    }
    assert(duplicateFailed, 'Duplicate email registration rejected');
  }

  // --- 2. Authentication, Login & Session Management ---
  console.log('\n--- 2. Testing Sign In & Session Management ---');
  {
    // Failed login with wrong password
    let badPasswordFailed = false;
    try {
      await AuthService.login('alice.smith@chronosapp.com', 'WrongPassword!');
    } catch (e: any) {
      badPasswordFailed = true;
      assert(e.message === 'Invalid email or password.', 'Generic security-safe error message');
    }
    assert(badPasswordFailed, 'Login fails with wrong password');

    // Successful login
    const loginUser = await AuthService.login('alice.smith@chronosapp.com', 'SecurePassword123!');
    assert(loginUser.id === aliceProfile!.id, 'Login succeeds and returns user profile');

    // Check current active session
    const active = AuthService.getCurrentSession();
    assert(active !== null, 'Active session is present');
    assert(active?.user.id === aliceProfile!.id, 'Active session user ID matches Alice');
    assert(active?.user.email === 'alice.smith@chronosapp.com', 'Active session email is preserved');
  }

  // --- 3. Email Verification Flow ---
  console.log('\n--- 3. Testing 6-Digit Email Verification Flow ---');
  {
    // Resend verification code
    const resendCode = await AuthService.resendVerificationCode(aliceProfile!.id);
    assert(typeof resendCode === 'string' && resendCode.length === 6, 'Resend generated new 6-digit code');

    // Submit invalid code
    let badCodeFailed = false;
    try {
      await AuthService.verifyEmail(aliceProfile!.id, '000000');
    } catch {
      badCodeFailed = true;
    }
    assert(badCodeFailed, 'Invalid email verification code rejected');

    // Submit valid code
    const verifiedUser = await AuthService.verifyEmail(aliceProfile!.id, resendCode);
    assert(verifiedUser.isEmailVerified === true, 'User isEmailVerified updated to true');

    const updatedSession = AuthService.getCurrentSession();
    assert(updatedSession?.user.isEmailVerified === true, 'Active session reflects email verified');
  }

  // --- 4. Password Reset Flow ---
  console.log('\n--- 4. Testing Password Reset Flow ---');
  {
    const reqReset = await AuthService.requestPasswordReset('alice.smith@chronosapp.com');
    assert(reqReset.success === true, 'Password reset request succeeded');
    assert(typeof reqReset.resetCode === 'string' && reqReset.resetCode.length === 6, '6-digit reset code issued');

    // Attempt reset with invalid code
    let badResetFailed = false;
    try {
      await AuthService.resetPassword('alice.smith@chronosapp.com', '999999', 'BrandNewPassword2026!');
    } catch {
      badResetFailed = true;
    }
    assert(badResetFailed, 'Reset fails with incorrect reset code');

    // Reset with valid code
    await AuthService.resetPassword('alice.smith@chronosapp.com', reqReset.resetCode!, 'BrandNewPassword2026!');
    assert(true, 'Password successfully reset with valid code');

    // Old password fails
    let oldPasswordFailed = false;
    try {
      await AuthService.login('alice.smith@chronosapp.com', 'SecurePassword123!');
    } catch {
      oldPasswordFailed = true;
    }
    assert(oldPasswordFailed, 'Old password rejected after password reset');

    // New password succeeds
    const freshLogin = await AuthService.login('alice.smith@chronosapp.com', 'BrandNewPassword2026!');
    assert(freshLogin.id === aliceProfile!.id, 'New password successfully authenticates');
  }

  // --- 5. User Profile Update ---
  console.log('\n--- 5. Testing Profile Updates ---');
  {
    const updated = await AuthService.updateProfile(aliceProfile!.id, {
      displayName: 'Alice S. (Lead Architect)',
    });
    assert(updated.displayName === 'Alice S. (Lead Architect)', 'Display name updated');

    const currentSession = AuthService.getCurrentSession();
    assert(currentSession?.user.displayName === 'Alice S. (Lead Architect)', 'Active session reflects new display name');
  }

  // --- 6. User-Scoped Task Storage Isolation (User A vs User B vs Anonymous) ---
  console.log('\n--- 6. Testing Multi-User Task Storage Isolation ---');
  let bobProfile: UserProfile | null = null;
  {
    // Register Bob
    const bobReg = await AuthService.register(
      'bob.builder@chronosapp.com',
      'BobSecurePassword123!',
      'Bob Builder'
    );
    bobProfile = bobReg.user;
    assert(!!bobProfile, 'Bob registered successfully');

    // Create tasks for Alice
    const aliceTasks: Task[] = [
      {
        id: 'task-alice-01',
        title: 'Review System Architecture',
        description: 'Ensure offline-first data isolation',
        categoryId: 'projects',
        priority: 'high',
        dueDate: '2026-10-23',
        dueTime: '10:00',
        estimatedDuration: 60,
        completed: false,
        pinned: true,
        recurrence: { type: 'none' },
        reminders: [],
        subtasks: [],
        notes: '',
        userId: aliceProfile!.id,
        createdAt: '2026-10-23T01:00:00Z',
        updatedAt: '2026-10-23T01:00:00Z',
      },
      {
        id: 'task-alice-02',
        title: 'Complete Security Audit',
        description: 'Verify PBKDF2 hash rounds and salts',
        categoryId: 'work',
        priority: 'medium',
        dueDate: '2026-10-24',
        dueTime: '14:00',
        estimatedDuration: 45,
        completed: true,
        completedAt: '2026-10-23T01:30:00Z',
        completionRemark: 'All unit tests passing 100%',
        pinned: false,
        recurrence: { type: 'none' },
        reminders: [],
        subtasks: [],
        notes: '',
        userId: aliceProfile!.id,
        createdAt: '2026-10-23T01:00:00Z',
        updatedAt: '2026-10-23T01:30:00Z',
      },
    ];

    // Create tasks for Bob
    const bobTasks: Task[] = [
      {
        id: 'task-bob-01',
        title: 'Construct Infrastructure Rig',
        description: 'Foundation and framework setup',
        categoryId: 'work',
        priority: 'high',
        dueDate: '2026-10-25',
        dueTime: '08:00',
        estimatedDuration: 120,
        completed: false,
        pinned: false,
        recurrence: { type: 'none' },
        reminders: [],
        subtasks: [],
        notes: '',
        userId: bobProfile.id,
        createdAt: '2026-10-23T01:10:00Z',
        updatedAt: '2026-10-23T01:10:00Z',
      },
    ];

    // Create anonymous/guest tasks
    const anonTasks: Task[] = [
      {
        id: 'task-anon-01',
        title: 'Guest Planning Task',
        description: 'Created before login',
        categoryId: 'personal',
        priority: 'low',
        dueDate: '2026-10-26',
        dueTime: '12:00',
        estimatedDuration: 30,
        completed: false,
        pinned: false,
        recurrence: { type: 'none' },
        reminders: [],
        subtasks: [],
        notes: '',
        createdAt: '2026-10-23T00:00:00Z',
        updatedAt: '2026-10-23T00:00:00Z',
      },
    ];

    // Save all sets of tasks
    await StorageService.saveTasks(aliceTasks, aliceProfile!.id);
    await StorageService.saveTasks(bobTasks, bobProfile.id);
    await StorageService.saveTasks(anonTasks); // anonymous

    // Verify isolation: Retrieving Alice's tasks returns ONLY Alice's tasks
    const retrievedAlice = await StorageService.getTasks(aliceProfile!.id);
    assert(retrievedAlice.length === 2, `Alice retrieved exactly 2 tasks (got ${retrievedAlice.length})`);
    assert(retrievedAlice.every(t => t.userId === aliceProfile!.id), "All Alice's tasks have Alice's userId");
    assert(!retrievedAlice.some(t => t.id === 'task-bob-01'), "Alice's list does NOT contain Bob's tasks");
    assert(!retrievedAlice.some(t => t.id === 'task-anon-01'), "Alice's list does NOT contain anonymous tasks");

    // Verify isolation: Retrieving Bob's tasks returns ONLY Bob's tasks
    const retrievedBob = await StorageService.getTasks(bobProfile.id);
    assert(retrievedBob.length === 1, `Bob retrieved exactly 1 task (got ${retrievedBob.length})`);
    assert(retrievedBob[0].id === 'task-bob-01', "Bob retrieved task-bob-01");
    assert(retrievedBob[0].userId === bobProfile.id, "Bob's task has Bob's userId");
    assert(!retrievedBob.some(t => t.id === 'task-alice-01'), "Bob's list does NOT contain Alice's tasks");

    // Verify isolation: Anonymous tasks retrieved when userId is undefined
    const retrievedAnon = await StorageService.getTasks();
    assert(retrievedAnon.length === 1, `Anonymous tasks retrieved (got ${retrievedAnon.length})`);
    assert(retrievedAnon[0].id === 'task-anon-01', 'Anonymous task retrieved correctly');
  }

  // --- 7. Anonymous Task Migration Flow ---
  console.log('\n--- 7. Testing Anonymous Task Migration Flow ---');
  let charlieProfile: UserProfile | null = null;
  {
    // Register User Charlie
    const charlieReg = await AuthService.register(
      'charlie@chronosapp.com',
      'CharliePassword123!',
      'Charlie Day'
    );
    charlieProfile = charlieReg.user;
    assert(!!charlieProfile, 'Charlie registered');

    // Check Charlie initially has 0 tasks
    const charlieInitial = await StorageService.getTasks(charlieProfile.id);
    assert(charlieInitial.length === 0, 'Charlie has 0 tasks initially');

    // Migrate anonymous tasks into Charlie's account
    const migratedCount = await StorageService.migrateAnonymousTasks(charlieProfile.id);
    assert(migratedCount === 1, `Migrated 1 anonymous task into Charlie (got ${migratedCount})`);

    // Charlie now has 1 task with Charlie's userId
    const charlieTasks = await StorageService.getTasks(charlieProfile.id);
    assert(charlieTasks.length === 1, 'Charlie now has 1 task');
    assert(charlieTasks[0].id === 'task-anon-01', 'Charlie owns task-anon-01');
    assert(charlieTasks[0].userId === charlieProfile.id, 'task-anon-01 now has Charlie userId');

    // Anonymous pool is now empty
    const remainingAnon = await StorageService.getTasks();
    assert(remainingAnon.length === 0, 'Anonymous task pool is now empty');
  }

  // --- 8. Secure Account Deletion & Cascading Clean-up ---
  console.log('\n--- 8. Testing Secure Account Deletion ---');
  {
    // Wrong password for account deletion fails
    let wrongPasswordDelFailed = false;
    try {
      await AuthService.deleteAccount(charlieProfile!.id, 'WrongPassword!');
    } catch {
      wrongPasswordDelFailed = true;
    }
    assert(wrongPasswordDelFailed, 'Account deletion fails if password does not match');

    // Charlie deletes account with valid password
    await AuthService.deleteAccount(charlieProfile!.id, 'CharliePassword123!');
    assert(true, 'Charlie account deletion succeeded');

    // Clean up Charlie's tasks
    await StorageService.deleteUserTasks(charlieProfile!.id);

    // Verify Charlie session is cleared
    const postSession = AuthService.getCurrentSession();
    assert(postSession === null, 'Session is cleared upon account deletion');

    // Verify Charlie cannot log in anymore
    let postLoginFailed = false;
    try {
      await AuthService.login('charlie@chronosapp.com', 'CharliePassword123!');
    } catch {
      postLoginFailed = true;
    }
    assert(postLoginFailed, 'Deleted user cannot log in');

    // Verify other users (Alice & Bob) are completely unaffected
    const aliceStillExists = await StorageService.getTasks(aliceProfile!.id);
    assert(aliceStillExists.length === 2, "Alice's tasks intact after Charlie deletion");
    const bobStillExists = await StorageService.getTasks(bobProfile!.id);
    assert(bobStillExists.length === 1, "Bob's tasks intact after Charlie deletion");
  }

  // --- 9. Android Architecture Verification ---
  console.log('\n--- 9. Android Native Architecture & Room Schema ---');
  {
    const fs = await import('fs');
    const path = await import('path');

    // Check TaskEntity.kt contains userId
    const taskEntityPath = path.resolve('android/app/src/main/java/com/chronos/tasktracker/data/model/TaskEntity.kt');
    const taskEntityCode = fs.readFileSync(taskEntityPath, 'utf-8');
    assert(taskEntityCode.includes('val userId: String? = null'), 'Android TaskEntity includes nullable userId');

    // Check UserEntity.kt exists and contains required fields
    const userEntityPath = path.resolve('android/app/src/main/java/com/chronos/tasktracker/data/model/UserEntity.kt');
    const userEntityCode = fs.readFileSync(userEntityPath, 'utf-8');
    assert(userEntityCode.includes('val id: String'), 'Android UserEntity includes id');
    assert(userEntityCode.includes('val email: String'), 'Android UserEntity includes email');
    assert(userEntityCode.includes('val passwordHash: String'), 'Android UserEntity includes passwordHash');
    assert(userEntityCode.includes('val salt: String'), 'Android UserEntity includes salt');

    // Check AppDatabase.kt version and migrations
    const appDbPath = path.resolve('android/app/src/main/java/com/chronos/tasktracker/data/local/AppDatabase.kt');
    const appDbCode = fs.readFileSync(appDbPath, 'utf-8');
    assert(appDbCode.includes('version = 3'), 'Android AppDatabase upgraded to version 3');
    assert(appDbCode.includes('MIGRATION_1_2') && appDbCode.includes('MIGRATION_2_3'), 'AppDatabase registers non-destructive MIGRATION_1_2 and MIGRATION_2_3');
    assert(appDbCode.includes('ALTER TABLE tasks ADD COLUMN userId TEXT DEFAULT NULL'), 'MIGRATION_2_3 executes non-destructive column addition');
    assert(appDbCode.includes('CREATE TABLE IF NOT EXISTS users'), 'MIGRATION_2_3 creates users table');

    // Check TaskDao.kt contains user-scoped queries
    const taskDaoPath = path.resolve('android/app/src/main/java/com/chronos/tasktracker/data/local/TaskDao.kt');
    const taskDaoCode = fs.readFileSync(taskDaoPath, 'utf-8');
    assert(taskDaoCode.includes('fun getTasksByUser'), 'TaskDao contains getTasksByUser query');
    assert(taskDaoCode.includes('claimAnonymousTasks'), 'TaskDao contains claimAnonymousTasks query');
  }

  console.log('\n===============================================================');
  console.log(`AUTH & USER ISOLATION RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
