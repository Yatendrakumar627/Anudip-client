import React, { createContext, useContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { showError, showSuccess, showWarning } from '../utils/notifications';

const AuthContext = createContext(null);

const SESSION_CACHE_KEY = 'anudip_admin_session_cache';
const SESSION_DURATION_MS = 15 * 60 * 1000; // Exact 15 minutes session duration

const API_BASE = (import.meta.env.VITE_API_URL || 'http://localhost:4000').replace(/\/$/, '');

// Helper to safely read and validate cached admin session
function getValidCachedSession() {
  try {
    const raw = sessionStorage.getItem(SESSION_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || !parsed.token || !parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    // Check if session has exceeded 15 minutes
    if (Date.now() >= parsed.expiresAt) {
      sessionStorage.removeItem(SESSION_CACHE_KEY);
      return null;
    }
    return parsed;
  } catch {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const navigate = useNavigate();

  // Initialize state directly from verified 15-minute cache
  const initialCache = useMemo(() => getValidCachedSession(), []);
  const [isAdmin, setIsAdmin] = useState(() => Boolean(initialCache));
  const [adminToken, setAdminToken] = useState(() => initialCache?.token || '');
  const [expiresAt, setExpiresAt] = useState(() => initialCache?.expiresAt || null);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [pendingRedirect, setPendingRedirect] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Remaining seconds counter
  const [remainingSeconds, setRemainingSeconds] = useState(() => {
    if (!initialCache?.expiresAt) return 0;
    return Math.max(0, Math.round((initialCache.expiresAt - Date.now()) / 1000));
  });

  const sessionExpiredNotified = useRef(false);

  // 15-Minute Auto-Expiration & Optimized Countdown (15-second tick to prevent whole-app re-render thrashing)
  useEffect(() => {
    if (!isAdmin || !expiresAt) {
      setRemainingSeconds(0);
      return;
    }

    const diff = expiresAt - Date.now();
    if (diff <= 0) {
      handleSessionExpired();
      return;
    }

    // Exact lock timer when session expires
    const lockTimer = setTimeout(() => {
      handleSessionExpired();
    }, diff);

    // Update countdown display every 15 seconds instead of every second
    const checkInterval = setInterval(() => {
      const remaining = Math.max(0, Math.round((expiresAt - Date.now()) / 1000));
      setRemainingSeconds(remaining);
    }, 15_000);

    return () => {
      clearTimeout(lockTimer);
      clearInterval(checkInterval);
    };
  }, [isAdmin, expiresAt]);

  // Session Expired Handler
  const handleSessionExpired = () => {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    setIsAdmin(false);
    setAdminToken('');
    setExpiresAt(null);
    setRemainingSeconds(0);

    if (!sessionExpiredNotified.current) {
      sessionExpiredNotified.current = true;
      showWarning(
        'Your 15-minute administrator session has expired. Please enter your password to continue.',
        'Session Expired'
      );
      setTimeout(() => {
        sessionExpiredNotified.current = false;
      }, 5000);
    }

    // If currently on an admin-restricted page, trigger modal
    const currentPath = window.location.pathname;
    if (['/batches', '/students', '/cohorts'].some((p) => currentPath.startsWith(p))) {
      setPendingRedirect(currentPath);
      setAuthModalOpen(true);
    }
  };

  // Login handler: verifies password and caches session for 15 minutes
  const login = async (password) => {
    if (!password || !password.trim()) {
      return { success: false, error: 'Please enter the administrator password.' };
    }

    setAuthLoading(true);
    const trimmed = password.trim();

    try {
      // 1. Verify credentials against backend server
      let res = null;
      try {
        res = await fetch(`${API_BASE}/api/auth/verify-admin`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password: trimmed }),
        });
      } catch {
        res = null;
      }

      if (res && res.ok) {
        const data = await res.json();
        const sessionExpiry = data.expiresAt || (Date.now() + SESSION_DURATION_MS);

        // Cache session for 15 minutes
        const cachePayload = {
          token: data.token || 'admin_token_active',
          expiresAt: sessionExpiry,
          loginTime: Date.now(),
          role: 'admin',
        };
        sessionStorage.setItem(SESSION_CACHE_KEY, JSON.stringify(cachePayload));

        setIsAdmin(true);
        setAdminToken(cachePayload.token);
        setExpiresAt(sessionExpiry);
        setRemainingSeconds(Math.round((sessionExpiry - Date.now()) / 1000));
        setAuthModalOpen(false);

        showSuccess('Administrator privileges unlocked for 15 minutes!', 'Access Granted');

        if (pendingRedirect) {
          navigate(pendingRedirect);
          setPendingRedirect(null);
        }
        return { success: true };
      }

      if (res && res.status === 401) {
        return { success: false, error: 'Incorrect administrator password. Please try again.' };
      }

      return { success: false, error: 'Incorrect administrator password. Please try again.' };
    } catch {
      return { success: false, error: 'Authentication service temporarily unavailable.' };
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout / Manual Lock
  const logout = () => {
    sessionStorage.removeItem(SESSION_CACHE_KEY);
    setIsAdmin(false);
    setAdminToken('');
    setExpiresAt(null);
    setRemainingSeconds(0);

    showSuccess('Administrator session locked. Switched to public view.', 'Locked');

    const currentPath = window.location.pathname;
    if (['/batches', '/students', '/cohorts'].some((p) => currentPath.startsWith(p))) {
      navigate('/lms-credential');
    }
  };

  // Format remaining seconds into "MM:SS" or "Xm Ys"
  const formattedRemaining = useMemo(() => {
    if (!isAdmin || remainingSeconds <= 0) return '00:00';
    const mins = Math.floor(remainingSeconds / 60);
    const secs = remainingSeconds % 60;
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  }, [isAdmin, remainingSeconds]);

  // Guard for protected routes
  const requireAdmin = (targetPath = null) => {
    if (isAdmin && expiresAt && Date.now() < expiresAt) return true;
    if (targetPath) setPendingRedirect(targetPath);
    setAuthModalOpen(true);
    return false;
  };

  const openLoginModal = useCallback((redirect = null) => {
    if (redirect) setPendingRedirect(redirect);
    setAuthModalOpen(true);
  }, []);

  const closeLoginModal = useCallback(() => {
    setAuthModalOpen(false);
    setPendingRedirect(null);
  }, []);

  const providerValue = useMemo(() => ({
    isAdmin,
    adminToken,
    expiresAt,
    remainingSeconds,
    formattedRemaining,
    authModalOpen,
    authLoading,
    openLoginModal,
    closeLoginModal,
    login,
    logout,
    requireAdmin,
  }), [
    isAdmin,
    adminToken,
    expiresAt,
    remainingSeconds,
    formattedRemaining,
    authModalOpen,
    authLoading,
    openLoginModal,
    closeLoginModal,
    login,
    logout,
    requireAdmin,
  ]);

  return (
    <AuthContext.Provider value={providerValue}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAdminAuth must be used within an AuthProvider');
  }
  return context;
}

export const useAuth = useAdminAuth;
