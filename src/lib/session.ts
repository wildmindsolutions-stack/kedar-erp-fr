/** Roles that keep a long-lived session (no 30-minute auto logout). */
export const PRIVILEGED_SESSION_ROLES = ['Owner', 'Admin'] as const;

export const STANDARD_SESSION_MS = 30 * 60 * 1000; // 30 minutes

const SESSION_EXPIRES_KEY = 'kedar_session_expires_at';

export function isPrivilegedSessionRole(role: string): boolean {
  return PRIVILEGED_SESSION_ROLES.includes(role as (typeof PRIVILEGED_SESSION_ROLES)[number]);
}

export function setSessionExpiry(role: string) {
  if (isPrivilegedSessionRole(role)) {
    localStorage.removeItem(SESSION_EXPIRES_KEY);
    return;
  }
  localStorage.setItem(SESSION_EXPIRES_KEY, String(Date.now() + STANDARD_SESSION_MS));
}

export function clearSessionExpiry() {
  localStorage.removeItem(SESSION_EXPIRES_KEY);
}

export function isSessionExpired(): boolean {
  const raw = localStorage.getItem(SESSION_EXPIRES_KEY);
  if (!raw) return false;
  return Date.now() > Number(raw);
}

export function getSessionRemainingMs(): number | null {
  const raw = localStorage.getItem(SESSION_EXPIRES_KEY);
  if (!raw) return null;
  return Math.max(0, Number(raw) - Date.now());
}
