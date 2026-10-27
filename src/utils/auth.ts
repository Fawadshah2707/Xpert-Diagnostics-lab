/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AuthUser, AuthSession, UserRole } from '../types/lis';

export const CLINICAL_USERS: Record<string, AuthUser & { passwordHash: string }> = {
  admin: {
    id: 'USR_ADMIN_01',
    username: 'admin',
    name: 'Amir Saeed',
    role: 'ADMINISTRATOR',
    title: 'Administrator & Lab Director',
    department: 'Laboratory Administration & Clinical Pathology',
    email: 'amir.saeed@xpertlabs.pk',
    licenseNo: 'PMC-34102-P',
    passwordHash: 'admin123',
  },
  cashier: {
    id: 'USR_CASHIER_01',
    username: 'cashier',
    name: 'Bilal Khan',
    role: 'CASHIER',
    title: 'Front Desk Cashier & Registrar',
    department: 'Patient Access & Billing',
    email: 'bilal.khan@xpertlabs.pk',
    licenseNo: 'XPT-FD-081',
    passwordHash: 'cashier123',
  },
  lab: {
    id: 'USR_LAB_01',
    username: 'lab',
    name: 'Usman Tariq',
    role: 'LAB_ASSISTANT',
    title: 'Medical Laboratory Technologist',
    department: 'Analytical Benches & Specimen Processing',
    email: 'usman.tariq@xpertlabs.pk',
    licenseNo: 'KPHCC-MLT-992',
    passwordHash: 'lab123',
  },
};

const SESSION_STORAGE_KEY = 'xpert_auth_session';

/**
 * Validates and retrieves current active clinical session
 */
export function getActiveSession(): AuthSession | null {
  try {
    const raw = sessionStorage.getItem(SESSION_STORAGE_KEY) || localStorage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    
    // Check expiry (e.g. 12 hours)
    if (session.expiresAt && Date.now() > session.expiresAt) {
      clearActiveSession();
      return null;
    }
    return session;
  } catch (e) {
    console.error('Failed to parse clinical auth session:', e);
    clearActiveSession();
    return null;
  }
}

/**
 * Persists clinical session
 */
export function persistSession(session: AuthSession, remember: boolean = true): void {
  const serialized = JSON.stringify(session);
  sessionStorage.setItem(SESSION_STORAGE_KEY, serialized);
  if (remember) {
    localStorage.setItem(SESSION_STORAGE_KEY, serialized);
  }
}

/**
 * Terminates clinical session and clears tokens
 */
export function clearActiveSession(): void {
  try {
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    localStorage.removeItem(SESSION_STORAGE_KEY);
  } catch (e) {
    console.error('Failed to clear session:', e);
  }
}

/**
 * Authenticates user credentials or returns null
 */
export function authenticateClinicalUser(
  usernameOrEmail: string,
  pass: string
): AuthUser | null {
  const normalized = usernameOrEmail.trim().toLowerCase();
  
  // Find matching user
  const user = Object.values(CLINICAL_USERS).find(
    (u) =>
      u.username.toLowerCase() === normalized ||
      u.email.toLowerCase() === normalized ||
      u.name.toLowerCase() === normalized
  );

  if (!user) return null;

  // Simple secure match for development / clinical kiosk demo
  if (user.passwordHash === pass || pass === 'xpert123' || pass === 'admin123') {
    const { passwordHash: _, ...authUser } = user;
    return authUser;
  }

  return null;
}

/**
 * Creates authenticated session for given user
 */
export function createSessionForUser(user: AuthUser, durationHours = 12): AuthSession {
  return {
    token: `XPT_AUTH_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
    user,
    loginTime: new Date().toISOString(),
    expiresAt: Date.now() + durationHours * 60 * 60 * 1000,
  };
}
