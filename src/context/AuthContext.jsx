import React, { createContext, useContext, useState, useCallback } from 'react';

// ─── Storage Keys ─────────────────────────────────────────────────────────────
const STORAGE_KEY_USERS   = 'finpilot_users';
const STORAGE_KEY_SESSION = 'finpilot_session';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function loadUsers() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USERS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveUsers(users) {
  localStorage.setItem(STORAGE_KEY_USERS, JSON.stringify(users));
}

function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SESSION);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveSession(user) {
  if (user) localStorage.setItem(STORAGE_KEY_SESSION, JSON.stringify(user));
  else       localStorage.removeItem(STORAGE_KEY_SESSION);
}

// Per-user financial data key
export function financialDataKey(userId) {
  return `finpilot_data_${userId}`;
}

export function loadFinancialData(userId) {
  try {
    const raw = localStorage.getItem(financialDataKey(userId));
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

export function saveFinancialData(userId, data) {
  localStorage.setItem(financialDataKey(userId), JSON.stringify(data));
}

// SHA-256 hash with fixed salt (client-side demo only)
async function hashPassword(password) {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'finpilot_salt_2026');
  const buf  = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// ─── Context ──────────────────────────────────────────────────────────────────
const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(() => loadSession());
  const [authError,   setAuthError]   = useState('');
  const [authLoading, setAuthLoading] = useState(false);

  /** Create a new account. Returns { ok: boolean }. */
  const signup = useCallback(async ({ name, email, password }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const users      = loadUsers();
      const normalised = email.trim().toLowerCase();

      if (users.find(u => u.email === normalised)) {
        setAuthError('An account with this email already exists.');
        return { ok: false };
      }

      const hash    = await hashPassword(password);
      const newUser = {
        id:                   `FP-${Date.now()}-IN`,
        name:                 name.trim(),
        email:                normalised,
        role:                 'Principal Quant',
        createdAt:            new Date().toISOString(),
        hasCompletedOnboarding: false,
      };

      saveUsers([...users, { ...newUser, passwordHash: hash }]);

      // Session never carries passwordHash or hasCompletedOnboarding flag —
      // we reload both from the users array each time to stay in sync.
      const session = {
        id:    newUser.id,
        name:  newUser.name,
        email: newUser.email,
        role:  newUser.role,
        hasCompletedOnboarding: false,
      };
      saveSession(session);
      setCurrentUser(session);
      return { ok: true };
    } catch {
      setAuthError('Something went wrong. Please try again.');
      return { ok: false };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  /** Sign in an existing user. Returns { ok: boolean }. */
  const login = useCallback(async ({ email, password }) => {
    setAuthLoading(true);
    setAuthError('');
    try {
      const users      = loadUsers();
      const normalised = email.trim().toLowerCase();
      const found      = users.find(u => u.email === normalised);

      if (!found) {
        setAuthError('No account found with that email.');
        return { ok: false };
      }

      const hash = await hashPassword(password);
      if (hash !== found.passwordHash) {
        setAuthError('Incorrect password. Please try again.');
        return { ok: false };
      }

      const session = {
        id:    found.id,
        name:  found.name,
        email: found.email,
        role:  found.role,
        hasCompletedOnboarding: found.hasCompletedOnboarding ?? false,
      };
      saveSession(session);
      setCurrentUser(session);
      return { ok: true };
    } catch {
      setAuthError('Something went wrong. Please try again.');
      return { ok: false };
    } finally {
      setAuthLoading(false);
    }
  }, []);

  /** Called by the onboarding wizard when the user finishes setup.
   *  Persists the financial data blob and marks onboarding complete. */
  const completeOnboarding = useCallback((financialData) => {
    if (!currentUser) return;

    // Persist financial data under the user's own key
    saveFinancialData(currentUser.id, financialData);

    // Mark onboarding done in users registry
    const users   = loadUsers();
    const updated = users.map(u =>
      u.id === currentUser.id ? { ...u, hasCompletedOnboarding: true } : u
    );
    saveUsers(updated);

    // Update session
    const session = { ...currentUser, hasCompletedOnboarding: true };
    saveSession(session);
    setCurrentUser(session);
  }, [currentUser]);

  /** Sign out. */
  const logout = useCallback(() => {
    saveSession(null);
    setCurrentUser(null);
    setAuthError('');
  }, []);

  /** Update display name / role. */
  const updateProfile = useCallback(({ name, role }) => {
    if (!currentUser) return;
    const users   = loadUsers();
    const updated = users.map(u =>
      u.id === currentUser.id
        ? { ...u, name: name ?? u.name, role: role ?? u.role }
        : u
    );
    saveUsers(updated);
    const session = { ...currentUser, name: name ?? currentUser.name, role: role ?? currentUser.role };
    saveSession(session);
    setCurrentUser(session);
  }, [currentUser]);

  const value = {
    currentUser,
    authError,
    authLoading,
    setAuthError,
    signup,
    login,
    logout,
    updateProfile,
    completeOnboarding,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
