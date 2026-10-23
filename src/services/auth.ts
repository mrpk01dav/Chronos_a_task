/**
 * Chronos Secure Authentication Service
 * Standard W3C Web Cryptography API (PBKDF2-HMAC-SHA256, 100k iterations, 16-byte cryptographically secure salt)
 * Multi-user isolation, persistent sessions, password reset, email verification, and account deletion.
 */

import { AuthSession, UserAccountRecord, UserProfile } from '../types';

const AUTH_DB_NAME = 'chronos_auth_db';
const AUTH_DB_VERSION = 1;
const STORE_USERS = 'users';
const SESSION_STORAGE_KEY = 'chronos_auth_session';
const USERS_FALLBACK_KEY = 'chronos_auth_users_fallback';

// Helper: Convert ArrayBuffer / Uint8Array to hex string
function bufToHex(buffer: ArrayBuffer | Uint8Array): string {
  const bytes = buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer);
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

// Helper: Convert hex string to Uint8Array
function hexToBuf(hex: string): Uint8Array {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    bytes[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return bytes;
}

// Derive PBKDF2-HMAC-SHA256 hash using standard Web Crypto API
async function hashPasswordWithSalt(password: string, salt: Uint8Array): Promise<string> {
  const enc = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    enc.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );

  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt as unknown as BufferSource,
      iterations: 100000,
      hash: 'SHA-256',
    },
    passwordKey,
    256
  );

  return bufToHex(derivedBits);
}

function getLocalStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) return window.localStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).localStorage) return (globalThis as any).localStorage;
    if (typeof localStorage !== 'undefined') return localStorage;
  } catch {}
  return null;
}

function getSessionStorage(): Storage | null {
  try {
    if (typeof window !== 'undefined' && window.sessionStorage) return window.sessionStorage;
    if (typeof globalThis !== 'undefined' && (globalThis as any).sessionStorage) return (globalThis as any).sessionStorage;
    if (typeof sessionStorage !== 'undefined') return sessionStorage;
  } catch {}
  return null;
}

// Open isolated IndexedDB for user authentication
function openAuthDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const req = indexedDB.open(AUTH_DB_NAME, AUTH_DB_VERSION);
    req.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_USERS)) {
        const store = db.createObjectStore(STORE_USERS, { keyPath: 'id' });
        store.createIndex('email', 'email', { unique: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export class AuthService {
  private static isIdbSupported = typeof window !== 'undefined' && 'indexedDB' in window;

  // Retrieve all users (internal)
  private static async getAllUsers(): Promise<UserAccountRecord[]> {
    if (this.isIdbSupported) {
      try {
        const db = await openAuthDB();
        return await new Promise<UserAccountRecord[]>((resolve) => {
          const tx = db.transaction(STORE_USERS, 'readonly');
          const store = tx.objectStore(STORE_USERS);
          const req = store.getAll();
          req.onsuccess = () => resolve((req.result as UserAccountRecord[]) || []);
          req.onerror = () => resolve(this.getFallbackUsers());
        });
      } catch {
        return this.getFallbackUsers();
      }
    }
    return this.getFallbackUsers();
  }

  private static getFallbackUsers(): UserAccountRecord[] {
    try {
      const storage = getLocalStorage();
      const raw = storage ? storage.getItem(USERS_FALLBACK_KEY) : null;
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  }

  private static async saveUser(user: UserAccountRecord): Promise<void> {
    // 1. Save to localStorage fallback
    try {
      const users = this.getFallbackUsers().filter((u) => u.id !== user.id);
      users.push(user);
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(USERS_FALLBACK_KEY, JSON.stringify(users));
      }
    } catch {}

    // 2. Save to IndexedDB
    if (this.isIdbSupported) {
      try {
        const db = await openAuthDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_USERS, 'readwrite');
          const store = tx.objectStore(STORE_USERS);
          store.put(user);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('Auth IndexedDB save error:', err);
      }
    }
  }

  private static async removeUserRecord(userId: string): Promise<void> {
    try {
      const users = this.getFallbackUsers().filter((u) => u.id !== userId);
      const storage = getLocalStorage();
      if (storage) {
        storage.setItem(USERS_FALLBACK_KEY, JSON.stringify(users));
      }
    } catch {}

    if (this.isIdbSupported) {
      try {
        const db = await openAuthDB();
        await new Promise<void>((resolve, reject) => {
          const tx = db.transaction(STORE_USERS, 'readwrite');
          const store = tx.objectStore(STORE_USERS);
          store.delete(userId);
          tx.oncomplete = () => resolve();
          tx.onerror = () => reject(tx.error);
        });
      } catch (err) {
        console.warn('Auth IndexedDB delete error:', err);
      }
    }
  }

  // Find user by normalized email
  static async findUserByEmail(email: string): Promise<UserAccountRecord | null> {
    const normEmail = email.trim().toLowerCase();
    const users = await this.getAllUsers();
    return users.find((u) => u.email.toLowerCase() === normEmail) || null;
  }

  // Find user by ID
  static async findUserById(id: string): Promise<UserAccountRecord | null> {
    const users = await this.getAllUsers();
    return users.find((u) => u.id === id) || null;
  }

  // Convert account record to public profile (stripping cryptographic hashes)
  static toPublicProfile(record: UserAccountRecord): UserProfile {
    return {
      id: record.id,
      email: record.email,
      displayName: record.displayName,
      photoUrl: record.photoUrl,
      isEmailVerified: record.isEmailVerified,
      createdAt: record.createdAt,
      updatedAt: record.updatedAt,
    };
  }

  // 1. REGISTER
  static async register(
    email: string,
    password: string,
    displayName: string
  ): Promise<{ user: UserProfile; verificationCode: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedName = displayName.trim();

    // Validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      throw new Error('Please enter a valid email address.');
    }

    if (password.length < 6) {
      throw new Error('Password must be at least 6 characters long.');
    }

    if (!trimmedName) {
      throw new Error('Please provide a display name.');
    }

    const existing = await this.findUserByEmail(trimmedEmail);
    if (existing) {
      throw new Error('An account with this email address already exists.');
    }

    // Cryptographic Salt & PBKDF2 hash
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const saltHex = bufToHex(salt);
    const passwordHashHex = await hashPasswordWithSalt(password, salt);

    // Initial 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();
    const now = new Date().toISOString();

    const newRecord: UserAccountRecord = {
      id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      email: trimmedEmail,
      displayName: trimmedName,
      isEmailVerified: false,
      passwordHashHex,
      saltHex,
      verificationCode,
      createdAt: now,
      updatedAt: now,
    };

    await this.saveUser(newRecord);

    const publicProfile = this.toPublicProfile(newRecord);
    this.createSession(publicProfile);

    return { user: publicProfile, verificationCode };
  }

  // 2. LOGIN
  static async login(email: string, password: string): Promise<UserProfile> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(trimmedEmail);

    if (!user) {
      throw new Error('Invalid email or password.');
    }

    const salt = hexToBuf(user.saltHex);
    const candidateHashHex = await hashPasswordWithSalt(password, salt);

    if (candidateHashHex !== user.passwordHashHex) {
      throw new Error('Invalid email or password.');
    }

    const publicProfile = this.toPublicProfile(user);
    this.createSession(publicProfile);
    return publicProfile;
  }

  // 3. LOGOUT
  static logout(): void {
    try {
      getLocalStorage()?.removeItem(SESSION_STORAGE_KEY);
      getSessionStorage()?.removeItem(SESSION_STORAGE_KEY);
    } catch {}
  }

  // 4. SESSION RESTORATION
  static getCurrentSession(): AuthSession | null {
    try {
      const local = getLocalStorage();
      const session = getSessionStorage();
      const raw = local?.getItem(SESSION_STORAGE_KEY) || session?.getItem(SESSION_STORAGE_KEY);
      if (!raw) return null;
      const parsed: AuthSession = JSON.parse(raw);
      if (new Date(parsed.expiresAt) <= new Date()) {
        this.logout();
        return null;
      }
      return parsed;
    } catch {
      return null;
    }
  }

  private static createSession(user: UserProfile): AuthSession {
    // 30 days session expiry
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    const token = `sess_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
    const session: AuthSession = { token, user, expiresAt };
    try {
      getLocalStorage()?.setItem(SESSION_STORAGE_KEY, JSON.stringify(session));
    } catch {}
    return session;
  }

  // 5. REQUEST PASSWORD RESET
  static async requestPasswordReset(email: string): Promise<{ success: boolean; resetCode?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(trimmedEmail);

    if (!user) {
      // Do not reveal account existence
      return { success: true };
    }

    const resetCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 15 * 60 * 1000).toISOString(); // 15 mins

    user.resetToken = resetCode;
    user.resetTokenExpiry = expiry;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);
    return { success: true, resetCode };
  }

  // 6. RESET PASSWORD
  static async resetPassword(email: string, resetCode: string, newPassword: string): Promise<void> {
    const trimmedEmail = email.trim().toLowerCase();
    const user = await this.findUserByEmail(trimmedEmail);

    if (!user || user.resetToken !== resetCode.trim()) {
      throw new Error('Invalid or expired password reset code.');
    }

    if (user.resetTokenExpiry && new Date(user.resetTokenExpiry) <= new Date()) {
      throw new Error('Password reset code has expired. Please request a new one.');
    }

    if (newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters long.');
    }

    const salt = crypto.getRandomValues(new Uint8Array(16));
    user.saltHex = bufToHex(salt);
    user.passwordHashHex = await hashPasswordWithSalt(newPassword, salt);
    user.resetToken = undefined;
    user.resetTokenExpiry = undefined;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);
  }

  // 7. VERIFY EMAIL
  static async verifyEmail(userId: string, code: string): Promise<UserProfile> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (user.verificationCode !== code.trim()) {
      throw new Error('Incorrect verification code. Please check your code and try again.');
    }

    user.isEmailVerified = true;
    user.verificationCode = undefined;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);

    const publicProfile = this.toPublicProfile(user);
    this.createSession(publicProfile);
    return publicProfile;
  }

  // 8. RESEND VERIFICATION CODE
  static async resendVerificationCode(userId: string): Promise<string> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    user.verificationCode = newCode;
    user.updatedAt = new Date().toISOString();

    await this.saveUser(user);
    return newCode;
  }

  // 9. UPDATE PROFILE
  static async updateProfile(
    userId: string,
    updates: { displayName?: string; photoUrl?: string }
  ): Promise<UserProfile> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User not found.');
    }

    if (updates.displayName !== undefined) {
      const trimmed = updates.displayName.trim();
      if (!trimmed) throw new Error('Display name cannot be empty.');
      user.displayName = trimmed;
    }

    if (updates.photoUrl !== undefined) {
      user.photoUrl = updates.photoUrl.trim() || undefined;
    }

    user.updatedAt = new Date().toISOString();
    await this.saveUser(user);

    const publicProfile = this.toPublicProfile(user);
    this.createSession(publicProfile);
    return publicProfile;
  }

  // 10. DELETE ACCOUNT
  static async deleteAccount(userId: string, confirmPassword?: string): Promise<void> {
    const user = await this.findUserById(userId);
    if (!user) {
      throw new Error('User account not found.');
    }

    if (confirmPassword !== undefined) {
      const salt = hexToBuf(user.saltHex);
      const candidateHashHex = await hashPasswordWithSalt(confirmPassword, salt);
      if (candidateHashHex !== user.passwordHashHex) {
        throw new Error('Incorrect password. Account deletion aborted.');
      }
    }

    await this.removeUserRecord(userId);
    this.logout();
  }
}
