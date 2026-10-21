import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../services/firebase.js';
import { firebaseAuthApi } from '../../services/authClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { User, Building, Loader2, AlertCircle, X } from 'lucide-react';

export const GoogleSignInButton = ({ onErrorMessage }) => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [cachedIdToken, setCachedIdToken] = useState('');
  const [selectedRole, setSelectedRole] = useState('tenant');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  const reportError = (msg) => {
    setLocalError(msg);
    if (onErrorMessage) onErrorMessage(msg);
  };

  const clearErrors = () => {
    setLocalError('');
    if (onErrorMessage) onErrorMessage('');
  };

  const handleRedirectByRole = (role) => {
    if (role === 'owner') {
      navigate('/dashboard/owner', { replace: true });
    } else if (role === 'admin') {
      navigate('/dashboard/admin', { replace: true });
    } else {
      navigate('/search', { replace: true });
    }
  };

  const handleGoogleClick = async () => {
    clearErrors();

    if (!isFirebaseConfigured) {
      reportError('Google Sign-In is not configured yet. Please configure Firebase environment keys.');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Popup Google Sign-In using Firebase Auth
      const credential = await signInWithPopup(auth, googleProvider);
      const user = credential.user;

      if (!user) {
        throw new Error('Google authentication did not return a valid user profile.');
      }

      // 2. Obtain Firebase ID Token
      const idToken = await user.getIdToken(true);

      // 3. Send ID token to our backend
      const response = await firebaseAuthApi({ idToken });
      const data = response?.data?.data || response?.data || {};

      // 4. Check if backend requires user to choose a role (first-time sign-in)
      if (data.requiresRole) {
        setCachedIdToken(idToken);
        setShowRoleModal(true);
        setIsLoading(false);
        return;
      }

      // 5. Existing or linked user: sign out from Firebase client and adopt our httpOnly session
      await signOut(auth);
      const authenticatedUser = data.user;
      setAuthUser(authenticatedUser);
      handleRedirectByRole(authenticatedUser.role);
    } catch (error) {
      // Handle Firebase and network error codes with clear user-friendly messages
      const errorCode = error?.code || '';
      if (errorCode === 'auth/popup-closed-by-user') {
        reportError('Sign-in cancelled. Please try again.');
      } else if (errorCode === 'auth/popup-blocked') {
        reportError('Popup was blocked by your browser. Please allow popups for this site.');
      } else if (errorCode === 'auth/network-request-failed') {
        reportError('Network connection error. Please check your internet connection.');
      } else if (errorCode === 'auth/account-exists-with-different-credential') {
        reportError('An account already exists with this email under a different sign-in method.');
      } else {
        const serverMsg =
          error?.response?.data?.message ||
          error?.message ||
          'Failed to sign in with Google. Please try again.';
        reportError(serverMsg);
      }
      try {
        await signOut(auth);
      } catch {
        // Ignore signout cleanup errors
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!cachedIdToken) {
      reportError('Session expired. Please click Continue with Google again.');
      setShowRoleModal(false);
      return;
    }

    setModalSubmitting(true);
    setLocalError('');

    try {
      const response = await firebaseAuthApi({
        idToken: cachedIdToken,
        role: selectedRole,
      });

      const data = response?.data?.data || response?.data || {};
      const authenticatedUser = data.user;

      await signOut(auth);
      setShowRoleModal(false);
      setCachedIdToken('');
      setAuthUser(authenticatedUser);
      handleRedirectByRole(authenticatedUser.role);
    } catch (error) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Failed to complete account registration. Please try again.';
      reportError(serverMsg);
    } finally {
      setModalSubmitting(false);
    }
  };

  return (
    <>
      <div className="w-full space-y-3">
        {localError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3 text-xs text-theme-error">
            <AlertCircle className="h-4 w-4 shrink-0 text-theme-error mt-0.5" />
            <span>{localError}</span>
          </div>
        )}

        <button
          type="button"
          onClick={handleGoogleClick}
          disabled={isLoading}
          className="w-full flex items-center justify-center gap-3 rounded-lg border border-theme-border bg-theme-surface py-2.5 px-4 text-xs font-semibold text-theme-primary shadow-xs hover:bg-theme-surface-hover focus:outline-none focus:ring-2 focus:ring-theme-brand focus:ring-offset-1 disabled:opacity-50 transition-colors"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-theme-brand" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              {/* Official Google G Logo */}
              <svg className="h-4 w-4 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Continue with Google</span>
            </>
          )}
        </button>

        {/* Clean "or" divider */}
        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-theme-border" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-theme-surface px-3 text-theme-muted font-semibold">
              or continue with email
            </span>
          </div>
        </div>
      </div>

      {/* Role Picker Modal for New Google Users */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-6 shadow-xl space-y-5 transition-colors">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border">
              <div>
                <h3 className="text-base font-bold text-theme-primary">One quick step</h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  Select your account role to complete registration:
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setCachedIdToken('');
                }}
                className="text-theme-muted hover:text-theme-primary p-1 rounded-lg"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('tenant')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  selectedRole === 'tenant'
                    ? 'border-theme-brand bg-theme-brand-subtle text-theme-brand ring-1 ring-theme-brand shadow-xs'
                    : 'border-theme-border bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface hover:text-theme-primary'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-surface text-theme-brand shadow-2xs">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs">Tenant</span>
                <span className="text-[10px] text-theme-muted leading-tight">
                  I want to search and book verified accommodations
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('owner')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all ${
                  selectedRole === 'owner'
                    ? 'border-theme-brand bg-theme-brand-subtle text-theme-brand ring-1 ring-theme-brand shadow-xs'
                    : 'border-theme-border bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface hover:text-theme-primary'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-theme-surface text-theme-brand shadow-2xs">
                  <Building className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs">PG Owner</span>
                <span className="text-[10px] text-theme-muted leading-tight">
                  I want to list properties and manage room bookings
                </span>
              </button>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-theme-border">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setCachedIdToken('');
                }}
                className="rounded-lg border border-theme-border bg-theme-surface px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleSubmit}
                disabled={modalSubmitting}
                className="inline-flex items-center gap-1.5 rounded-lg bg-theme-brand px-5 py-2 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover disabled:opacity-50 transition-colors"
              >
                {modalSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Creating Account...</span>
                  </>
                ) : (
                  <span>Finish Registration</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;
