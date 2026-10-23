import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { Clock, ShieldAlert, LogOut, CheckCircle2 } from 'lucide-react';


const INACTIVITY_LIMIT_MS = 10 * 60 * 1000; 
const WARNING_TRIGGER_MS = 9 * 60 * 1000; 
const COUNTDOWN_TOTAL_SEC = 60;            

export const SessionTimeoutManager = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [showModal, setShowModal] = useState(false);
  const [secondsRemaining, setSecondsRemaining] = useState(COUNTDOWN_TOTAL_SEC);

  const lastActiveRef = useRef(Date.now());
  const showModalRef = useRef(false);
  showModalRef.current = showModal;

  // Sync initial activity time on login, resetting stale timestamps
  useEffect(() => {
    if (isAuthenticated) {
      const now = Date.now();
      const stored = localStorage.getItem('pg_last_active');
      const parsed = stored ? parseInt(stored, 10) : now;

      // Only preserve stored timestamp if it is recent (under 10 minutes)
      if (!Number.isNaN(parsed) && now - parsed < INACTIVITY_LIMIT_MS) {
        lastActiveRef.current = parsed;
      } else {
        lastActiveRef.current = now;
        try {
          localStorage.setItem('pg_last_active', now.toString());
          localStorage.removeItem('pg_session_logout');
        } catch {
          // Ignore storage errors
        }
      }
    }
  }, [isAuthenticated]);

  // Handle auto logout when timer expires
  const handleAutoLogout = useCallback(async () => {
    setShowModal(false);
    try {
      localStorage.setItem('pg_session_logout', Date.now().toString());
    } catch {
      // Ignore storage errors
    }
    await logout();
    navigate('/login?reason=inactivity', { replace: true });
  }, [logout, navigate]);

  // Handle user manual extend
  const handleStaySignedIn = () => {
    const now = Date.now();
    lastActiveRef.current = now;
    setShowModal(false);
    setSecondsRemaining(COUNTDOWN_TOTAL_SEC);
    try {
      localStorage.setItem('pg_last_active', now.toString());
    } catch {
      // Ignore storage errors
    }
  };

  // Throttled activity listener (resets inactivity timer on clicks, scrolls, keys)
  const handleUserActivity = useCallback(() => {
    // If the 1-minute warning countdown modal is already showing,
    // require an explicit click on "Stay Signed In" to dismiss.
    if (showModalRef.current) return;

    const now = Date.now();
    // Throttle to update at most once every 2 seconds
    if (now - lastActiveRef.current > 2000) {
      lastActiveRef.current = now;
      try {
        localStorage.setItem('pg_last_active', now.toString());
      } catch {
        // Ignore storage errors
      }
    }
  }, []);

  // Listen to window activity events
  useEffect(() => {
    if (!isAuthenticated) return;

    const activityEvents = [
      'mousemove',
      'mousedown',
      'keydown',
      'touchstart',
      'scroll',
      'click',
    ];

    activityEvents.forEach((evt) => {
      window.addEventListener(evt, handleUserActivity, { passive: true });
    });

    // Cross-tab synchronization
    const handleStorageChange = (e) => {
      if (e.key === 'pg_last_active' && e.newValue) {
        const remoteTimestamp = parseInt(e.newValue, 10);
        if (!Number.isNaN(remoteTimestamp) && remoteTimestamp > lastActiveRef.current) {
          lastActiveRef.current = remoteTimestamp;
          setShowModal(false);
          setSecondsRemaining(COUNTDOWN_TOTAL_SEC);
        }
      } else if (e.key === 'pg_session_logout') {
        logout();
        navigate('/login?reason=inactivity', { replace: true });
      }
    };

    window.addEventListener('storage', handleStorageChange);

    // Handle tab visibility change (e.g. user returns after being away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const stored = localStorage.getItem('pg_last_active');
        if (stored) {
          const parsed = parseInt(stored, 10);
          if (!Number.isNaN(parsed)) {
            lastActiveRef.current = parsed;
          }
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Backend 401 interception listener
    const handleUnauthorizedEvent = () => {
      handleAutoLogout();
    };

    window.addEventListener('pg_auth_unauthorized', handleUnauthorizedEvent);

    return () => {
      activityEvents.forEach((evt) => {
        window.removeEventListener(evt, handleUserActivity);
      });
      window.removeEventListener('storage', handleStorageChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('pg_auth_unauthorized', handleUnauthorizedEvent);
    };
  }, [isAuthenticated, handleUserActivity, handleAutoLogout, logout, navigate]);

  // Main 1-second interval ticker checking inactivity state
  useEffect(() => {
    if (!isAuthenticated) {
      if (showModal) setShowModal(false);
      return;
    }

    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActiveRef.current;

      if (elapsed >= INACTIVITY_LIMIT_MS) {
        // 10 minutes exceeded -> Auto logout immediately
        handleAutoLogout();
      } else if (elapsed >= WARNING_TRIGGER_MS) {
        // In the 1-minute countdown window (9 mins to 10 mins)
        const remaining = Math.max(0, Math.ceil((INACTIVITY_LIMIT_MS - elapsed) / 1000));
        setSecondsRemaining(remaining);
        if (!showModalRef.current) {
          setShowModal(true);
        }
      } else {
        // Inactivity is under 9 minutes
        if (showModalRef.current) {
          setShowModal(false);
          setSecondsRemaining(COUNTDOWN_TOTAL_SEC);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, handleAutoLogout, showModal]);

  // If user is not authenticated or not in warning phase, do not render modal
  if (!isAuthenticated || !showModal || !user) {
    return null;
  }

  // Format countdown mm:ss
  const minutes = Math.floor(secondsRemaining / 60);
  const seconds = secondsRemaining % 60;
  const formattedCountdown = `${minutes < 10 ? '0' : ''}${minutes}:${
    seconds < 10 ? '0' : ''
  }${seconds}`;

  // Progress percentage (60 down to 0)
  const progressPercent = Math.max(0, Math.min(100, (secondsRemaining / COUNTDOWN_TOTAL_SEC) * 100));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-md rounded-2xl border border-theme-border bg-white dark:bg-[#131d31] p-7 sm:p-8 shadow-2xl overflow-hidden transition-all text-theme-primary">
        {/* Subtle decorative glow */}
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header Icon */}
        <div className="text-center relative z-10">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500 shadow-xs mx-auto mb-3">
            <Clock className="h-7 w-7 animate-pulse" />
          </div>

          <h3 className="font-serif text-2xl font-bold tracking-tight text-theme-primary">
            Session Expiring Soon
          </h3>

          <p className="text-xs text-theme-muted mt-1.5 leading-relaxed max-w-xs mx-auto">
            You have been inactive for 9 minutes. For your security, your session will automatically end in:
          </p>

          {/* Large Countdown Display */}
          <div className="my-5">
            <div className="font-mono text-4xl font-extrabold tracking-wider text-amber-500">
              {formattedCountdown}
            </div>

            {/* Countdown progress bar */}
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-3 overflow-hidden">
              <div
                className="bg-amber-500 h-full rounded-full transition-all duration-1000 ease-linear"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <p className="text-[11px] text-theme-secondary mb-6">
            Click <strong>Stay Signed In</strong> to continue your session, or sign out now.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5 relative z-10">
          <button
            type="button"
            onClick={handleStaySignedIn}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs py-3.5 shadow-md shadow-indigo-500/20 hover:shadow-indigo-500/30 active:scale-98 transition-all cursor-pointer"
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>Stay Signed In</span>
          </button>

          <button
            type="button"
            onClick={handleAutoLogout}
            className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface hover:bg-slate-100 dark:hover:bg-slate-800 text-theme-secondary hover:text-theme-primary font-semibold text-xs py-2.5 transition-colors cursor-pointer"
          >
            <LogOut className="h-3.5 w-3.5 text-theme-muted" />
            <span>Sign Out Now</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SessionTimeoutManager;
