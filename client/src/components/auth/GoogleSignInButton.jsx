import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { signInWithPopup, signOut } from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../../services/firebase.js';
import {
  firebaseAuthApi,
  verifyTwoFactorApi,
  resendTwoFactorApi,
} from '../../services/authClient.js';
import { useAuth } from '../../context/AuthContext.jsx';
import {
  User,
  Building,
  Loader2,
  AlertCircle,
  X,
  ShieldCheck,
  ArrowRight,
  RotateCw,
} from 'lucide-react';

export const GoogleSignInButton = ({ onErrorMessage }) => {
  const navigate = useNavigate();
  const { setAuthUser } = useAuth();

  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [cachedIdToken, setCachedIdToken] = useState('');
  const [selectedRole, setSelectedRole] = useState('tenant');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [localError, setLocalError] = useState('');

  // 2-Step Verification State
  const [show2FAModal, setShow2FAModal] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState('');
  const [twoFactorEmail, setTwoFactorEmail] = useState('');
  const [otpDigits, setOtpDigits] = useState(['', '', '', '', '', '']);
  const [twoFactorSubmitting, setTwoFactorSubmitting] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState('');
  const [resendCountdown, setResendCountdown] = useState(30);
  const [isResending, setIsResending] = useState(false);

  const otpInputRefs = useRef([]);

  useEffect(() => {
    let timer;
    if (show2FAModal && resendCountdown > 0) {
      timer = setInterval(() => {
        setResendCountdown((prev) => prev - 1);
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [show2FAModal, resendCountdown]);

  // Auto-focus first input box when 2FA modal opens
  useEffect(() => {
    if (show2FAModal) {
      setTimeout(() => {
        otpInputRefs.current[0]?.focus();
      }, 100);
    }
  }, [show2FAModal]);

  const reportError = (msg) => {
    setLocalError(msg);
    if (onErrorMessage) onErrorMessage(msg);
  };

  const clearErrors = () => {
    setLocalError('');
    setTwoFactorError('');
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

      // 3. Send ID token to backend
      const response = await firebaseAuthApi({ idToken });
      const data = response?.data?.data || response?.data || {};

      // 4. Check if backend requires user to choose a role (first-time sign-in)
      if (data.requiresRole) {
        setCachedIdToken(idToken);
        setShowRoleModal(true);
        setIsLoading(false);
        return;
      }

      // 5. Check if backend initiated 2-Step Verification
      if (data.requires2FA) {
        await signOut(auth);
        setTwoFactorToken(data.tempToken);
        setTwoFactorEmail(data.email);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCountdown(30);
        setShow2FAModal(true);
        setIsLoading(false);
        return;
      }

      // 6. Direct sign-in fallback (if 2FA wasn't triggered)
      await signOut(auth);
      const authenticatedUser = data.user;
      setAuthUser(authenticatedUser);
      handleRedirectByRole(authenticatedUser.role);
    } catch (error) {
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

      // Role selected: now proceed to 2-Step Verification
      if (data.requires2FA) {
        await signOut(auth);
        setShowRoleModal(false);
        setCachedIdToken('');
        setTwoFactorToken(data.tempToken);
        setTwoFactorEmail(data.email);
        setOtpDigits(['', '', '', '', '', '']);
        setResendCountdown(30);
        setShow2FAModal(true);
        return;
      }

      await signOut(auth);
      setShowRoleModal(false);
      setCachedIdToken('');
      const authenticatedUser = data.user;
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

  // OTP Box Handlers
  const handleOtpChange = (index, value) => {
    const cleaned = value.replace(/\D/g, '');
    const newDigits = [...otpDigits];

    if (cleaned.length > 1) {
      // User pasted multiple digits into one box
      const pasteValues = cleaned.slice(0, 6).split('');
      pasteValues.forEach((char, i) => {
        newDigits[i] = char;
      });
      setOtpDigits(newDigits);
      const nextIndex = Math.min(pasteValues.length, 5);
      otpInputRefs.current[nextIndex]?.focus();
      return;
    }

    newDigits[index] = cleaned;
    setOtpDigits(newDigits);

    // Auto-advance to next box if digit entered
    if (cleaned && index < 5) {
      otpInputRefs.current[index + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpDigits[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (!pasteData) return;

    const newDigits = [...otpDigits];
    pasteData.split('').forEach((char, i) => {
      newDigits[i] = char;
    });
    setOtpDigits(newDigits);
    const targetIndex = Math.min(pasteData.length, 5);
    otpInputRefs.current[targetIndex]?.focus();
  };

  const handleVerify2FA = async (e) => {
    if (e) e.preventDefault();
    const code = otpDigits.join('');
    if (code.length !== 6) {
      setTwoFactorError('Please enter all 6 digits of the verification code.');
      return;
    }

    setTwoFactorSubmitting(true);
    setTwoFactorError('');

    try {
      const response = await verifyTwoFactorApi({
        tempToken: twoFactorToken,
        code,
      });

      const authenticatedUser =
        response?.data?.user ||
        response?.data?.data?.user ||
        response?.user ||
        response?.data ||
        {};

      setShow2FAModal(false);
      setTwoFactorToken('');
      setOtpDigits(['', '', '', '', '', '']);

      if (authenticatedUser && (authenticatedUser.id || authenticatedUser.role || authenticatedUser.email)) {
        setAuthUser(authenticatedUser);
        handleRedirectByRole(authenticatedUser.role || 'tenant');
      } else {
        throw new Error('Verification succeeded but user profile was not returned. Please try signing in again.');
      }
    } catch (error) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.message ||
        'Invalid or expired verification code. Please check your Gmail.';
      setTwoFactorError(serverMsg);
    } finally {
      setTwoFactorSubmitting(false);
    }
  };

  const handleResend2FA = async () => {
    if (resendCountdown > 0 || isResending) return;
    setIsResending(true);
    setTwoFactorError('');

    try {
      const response = await resendTwoFactorApi({ tempToken: twoFactorToken });
      const data = response?.data?.data || response?.data || {};
      if (data.tempToken) {
        setTwoFactorToken(data.tempToken);
      }
      setResendCountdown(30);
      setOtpDigits(['', '', '', '', '', '']);
      otpInputRefs.current[0]?.focus();
    } catch (error) {
      setTwoFactorError(error?.response?.data?.message || 'Failed to resend code. Please try again.');
    } finally {
      setIsResending(false);
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
          className="w-full flex items-center justify-center gap-3 rounded-xl border border-theme-border bg-theme-surface hover:bg-theme-surface-hover py-3 px-4 text-xs font-semibold text-theme-primary shadow-xs focus:outline-hidden focus:ring-2 focus:ring-purple-500/20 disabled:opacity-50 transition-all cursor-pointer"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
              <span>Connecting to Google...</span>
            </>
          ) : (
            <>
              {/* Google G Logo */}
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
            <div className="w-full border-t border-theme-border/70" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-theme-surface px-3 text-theme-muted font-bold">
              or continue with email
            </span>
          </div>
        </div>
      </div>

      {/* Role Picker Modal for New Google Users */}
      {showRoleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 dark:bg-black/75 backdrop-blur-md">
          <div className="w-full max-w-md rounded-2xl border border-theme-border bg-white dark:bg-[#131d31] p-6 shadow-2xl space-y-5 transition-colors text-theme-primary">
            <div className="flex items-center justify-between pb-3 border-b border-theme-border/60">
              <div>
                <h3 className="font-serif text-lg font-bold text-theme-primary">Select Account Role</h3>
                <p className="text-xs text-theme-muted mt-0.5">
                  Choose how you want to use PG Finder:
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
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer ${
                  selectedRole === 'tenant'
                    ? 'border-purple-600 bg-purple-500/10 text-purple-600 ring-1 ring-purple-600 shadow-xs'
                    : 'border-theme-border bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#131d31] text-purple-600 shadow-2xs">
                  <User className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs">Tenant</span>
                <span className="text-[10px] text-theme-muted leading-tight">
                  Search &amp; book verified accommodations
                </span>
              </button>

              <button
                type="button"
                onClick={() => setSelectedRole('owner')}
                className={`flex flex-col items-center justify-center gap-2 rounded-xl border p-4 text-center transition-all cursor-pointer ${
                  selectedRole === 'owner'
                    ? 'border-purple-600 bg-purple-500/10 text-purple-600 ring-1 ring-purple-600 shadow-xs'
                    : 'border-theme-border bg-slate-50 dark:bg-slate-800/60 hover:bg-slate-100 dark:hover:bg-slate-800 text-theme-secondary hover:text-theme-primary'
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white dark:bg-[#131d31] text-purple-600 shadow-2xs">
                  <Building className="h-5 w-5" />
                </div>
                <span className="font-bold text-xs">PG Owner</span>
                <span className="text-[10px] text-theme-muted leading-tight">
                  List properties &amp; manage room bookings
                </span>
              </button>
            </div>

            <div className="pt-2 flex justify-end gap-2 border-t border-theme-border/60">
              <button
                type="button"
                onClick={() => {
                  setShowRoleModal(false);
                  setCachedIdToken('');
                }}
                className="rounded-xl border border-theme-border bg-white dark:bg-[#131d31] px-4 py-2 text-xs font-semibold text-theme-secondary hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRoleSubmit}
                disabled={modalSubmitting}
                className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 px-5 py-2 text-xs font-bold text-white shadow-xs disabled:opacity-50 transition-colors"
              >
                {modalSubmitting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Continuing...</span>
                  </>
                ) : (
                  <span>Continue</span>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Two-Step Verification Modal (Clean Light Theme Overlay) */}
      {show2FAModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-white/70 dark:bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md rounded-2xl border border-theme-border/80 bg-white dark:bg-[#131d31] p-7 sm:p-8 shadow-2xl shadow-slate-900/10 overflow-hidden transition-all text-theme-primary">
            {/* Close Button */}
            <button
              type="button"
              onClick={() => {
                setShow2FAModal(false);
                setTwoFactorToken('');
              }}
              className="absolute top-4 right-4 text-theme-muted hover:text-theme-primary p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Modal Brand Badge & Header */}
            <div className="text-center relative z-10">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 text-white shadow-md mx-auto mb-3">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="font-serif text-2xl font-bold tracking-tight text-theme-primary">
                Two-Step Verification
              </h3>
              <p className="text-xs text-theme-muted mt-1.5 max-w-xs mx-auto leading-relaxed">
                We sent a 6-digit verification code to your Google account email:
              </p>
              <p className="text-xs font-bold text-purple-600 dark:text-purple-400 mt-1">
                {twoFactorEmail}
              </p>
            </div>

            {/* Error Notification */}
            {twoFactorError && (
              <div className="mt-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{twoFactorError}</span>
              </div>
            )}

            {/* OTP Form */}
            <form onSubmit={handleVerify2FA} className="mt-6 space-y-5 relative z-10">
              {/* 6 Digit Input Boxes */}
              <div className="flex justify-between items-center gap-2 sm:gap-2.5">
                {otpDigits.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => (otpInputRefs.current[index] = el)}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    onPaste={handleOtpPaste}
                    className="h-12 w-11 sm:h-14 sm:w-12 text-center text-xl font-bold rounded-xl border border-theme-border bg-slate-50 dark:bg-slate-800 text-theme-primary focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 outline-hidden font-mono shadow-2xs transition-all"
                  />
                ))}
              </div>

              {/* Verify & Continue Button */}
              <button
                type="submit"
                disabled={twoFactorSubmitting || otpDigits.join('').length !== 6}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-xs py-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-98 disabled:opacity-50 transition-all cursor-pointer"
              >
                {twoFactorSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Verifying Code...</span>
                  </>
                ) : (
                  <>
                    <span>Verify &amp; Sign In</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </>
                )}
              </button>

              {/* Resend Code Section */}
              <div className="flex items-center justify-center text-xs text-theme-muted gap-1 pt-1">
                <span>Didn&apos;t receive the code?</span>
                {resendCountdown > 0 ? (
                  <span className="font-semibold text-theme-primary">
                    Resend in {resendCountdown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResend2FA}
                    disabled={isResending}
                    className="font-bold text-purple-600 dark:text-purple-400 hover:underline flex items-center gap-1 cursor-pointer"
                  >
                    {isResending ? (
                      <Loader2 className="h-3 w-3 animate-spin" />
                    ) : (
                      <RotateCw className="h-3 w-3" />
                    )}
                    <span>Resend Code</span>
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default GoogleSignInButton;
