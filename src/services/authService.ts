import type { User, UserRole } from '../types';
import { API_BASE_URL } from './apiClient';

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  createdAt: string;
}

const STORAGE_USERS_KEY = 'emmanuel_auth_users_v1';
const STORAGE_SESSION_KEY = 'emmanuel_active_user_session_v1';

// Simple deterministic hash for browser client-side storage demo
function hashPassword(password: string): string {
  let hash = 0;
  for (let i = 0; i < password.length; i++) {
    const char = password.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash |= 0;
  }
  return 'sha_' + Math.abs(hash).toString(16) + '_sec';
}

function generateZeroTrustToken(): string {
  const bytes = new Uint8Array(16);
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    window.crypto.getRandomValues(bytes);
    return 'zt_' + Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
  }
  return 'zt_fallback_' + Math.random().toString(36).substring(2, 12);
}

// Default pre-seeded clinical security credentials
const INITIAL_DEMO_USERS: StoredAccount[] = [
  {
    id: 'USR-88210',
    name: 'Dr. Emmanuel Security Officer',
    email: 'officer@emmanuel.health',
    passwordHash: hashPassword('Security2026!'),
    role: 'Security Officer',
    createdAt: new Date('2026-01-15T08:00:00Z').toISOString()
  },
  {
    id: 'USR-88211',
    name: 'Elena Vance (Auditor)',
    email: 'auditor@emmanuel.health',
    passwordHash: hashPassword('Auditor2026!'),
    role: 'Compliance Auditor',
    createdAt: new Date('2026-02-10T09:30:00Z').toISOString()
  },
  {
    id: 'USR-88212',
    name: 'Chief Security Officer',
    email: 'admin@emmanuel.health',
    passwordHash: hashPassword('AdminMaster2026!'),
    role: 'Super Admin',
    createdAt: new Date('2026-01-01T00:00:00Z').toISOString()
  }
];

class AuthService {
  private getStoredUsers(): StoredAccount[] {
    try {
      const stored = localStorage.getItem(STORAGE_USERS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (e) {
      console.warn('[AuthService] Could not read localStorage:', e);
    }
    // Initialize default seed users
    this.saveStoredUsers(INITIAL_DEMO_USERS);
    return INITIAL_DEMO_USERS;
  }

  private saveStoredUsers(users: StoredAccount[]): void {
    try {
      localStorage.setItem(STORAGE_USERS_KEY, JSON.stringify(users));
    } catch (e) {
      console.warn('[AuthService] Could not write to localStorage:', e);
    }
  }

  public getCurrentUser(): User | null {
    try {
      const session = localStorage.getItem(STORAGE_SESSION_KEY);
      if (session) {
        const user: User = JSON.parse(session);
        if (user && user.isAuthenticated) {
          return user;
        }
      }
    } catch (e) {
      console.warn('[AuthService] Could not parse session:', e);
    }
    return null;
  }

  public async signIn(email: string, password: string): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedEmail = email.trim().toLowerCase();
    
    // First attempt backend authentication if available
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, password }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        const user: User = {
          userID: data.userID || 'USR-' + Math.floor(10000 + Math.random() * 90000),
          userName: data.userName || data.name,
          email: data.email,
          role: data.role || 'Security Officer',
          lastLogin: new Date().toISOString(),
          sessionToken: data.sessionToken || generateZeroTrustToken(),
          isAuthenticated: true
        };
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
        return { success: true, user };
      }
    } catch {
      // Backend not running, proceed to local client authentication
    }

    // Client-side authentication fallback
    const users = this.getStoredUsers();
    const account = users.find(u => u.email.toLowerCase() === trimmedEmail);

    if (!account) {
      return { 
        success: false, 
        error: 'No security account registered with this email address.' 
      };
    }

    const providedHash = hashPassword(password);
    if (account.passwordHash !== providedHash) {
      return { 
        success: false, 
        error: 'Invalid password. Please check your credentials.' 
      };
    }

    const user: User = {
      userID: account.id,
      userName: account.name,
      role: account.role,
      email: account.email,
      lastLogin: new Date().toISOString(),
      sessionToken: generateZeroTrustToken(),
      isAuthenticated: true
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  public async signUp(
    name: string, 
    email: string, 
    password: string, 
    role: UserRole
  ): Promise<{ success: boolean; user?: User; error?: string }> {
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();

    if (!trimmedName) {
      return { success: false, error: 'Full name is required.' };
    }
    if (!trimmedEmail || !trimmedEmail.includes('@')) {
      return { success: false, error: 'A valid email address is required.' };
    }
    if (password.length < 6) {
      return { success: false, error: 'Password must be at least 6 characters long.' };
    }

    // Attempt backend registration if available
    try {
      const res = await fetch(`${API_BASE_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmedName, email: trimmedEmail, password, role }),
        signal: AbortSignal.timeout(2000)
      });
      if (res.ok) {
        const data = await res.json();
        const user: User = {
          userID: data.userID || 'USR-' + Math.floor(10000 + Math.random() * 90000),
          userName: data.userName || trimmedName,
          email: data.email || trimmedEmail,
          role: data.role || role,
          lastLogin: new Date().toISOString(),
          sessionToken: data.sessionToken || generateZeroTrustToken(),
          isAuthenticated: true
        };
        localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
        return { success: true, user };
      }
    } catch {
      // Backend not running, proceed to local client registration
    }

    const users = this.getStoredUsers();
    if (users.some(u => u.email.toLowerCase() === trimmedEmail)) {
      return { 
        success: false, 
        error: 'An account with this email address already exists. Please sign in instead.' 
      };
    }

    const newAccount: StoredAccount = {
      id: 'USR-' + Math.floor(10000 + Math.random() * 90000),
      name: trimmedName,
      email: trimmedEmail,
      passwordHash: hashPassword(password),
      role,
      createdAt: new Date().toISOString()
    };

    users.push(newAccount);
    this.saveStoredUsers(users);

    const user: User = {
      userID: newAccount.id,
      userName: newAccount.name,
      role: newAccount.role,
      email: newAccount.email,
      lastLogin: newAccount.createdAt,
      sessionToken: generateZeroTrustToken(),
      isAuthenticated: true
    };

    localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(user));
    return { success: true, user };
  }

  public signOut(): void {
    try {
      localStorage.removeItem(STORAGE_SESSION_KEY);
    } catch (e) {
      console.warn('[AuthService] Could not clear session:', e);
    }
  }

  public switchRole(role: UserRole): User | null {
    const current = this.getCurrentUser();
    if (!current) return null;

    const updated: User = {
      ...current,
      role,
      sessionToken: generateZeroTrustToken()
    };
    try {
      localStorage.setItem(STORAGE_SESSION_KEY, JSON.stringify(updated));
    } catch (e) {
      console.warn('[AuthService] Could not update session role:', e);
    }
    return updated;
  }

  public getDemoAccounts() {
    return [
      {
        role: 'Security Officer' as UserRole,
        name: 'Dr. Emmanuel Security Officer',
        email: 'officer@emmanuel.health',
        password: 'Security2026!',
        description: 'Threat hunting, telemetry stream & automated playbooks'
      },
      {
        role: 'Compliance Auditor' as UserRole,
        name: 'Elena Vance (Auditor)',
        email: 'auditor@emmanuel.health',
        password: 'Auditor2026!',
        description: 'Regulatory audit reports, MIA vulnerability metrics'
      },
      {
        role: 'Super Admin' as UserRole,
        name: 'Chief Security Officer',
        email: 'admin@emmanuel.health',
        password: 'AdminMaster2026!',
        description: 'Zero Trust policy governance & full cluster access'
      }
    ];
  }
}

export const authService = new AuthService();
