import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '../context/AuthContext.jsx';
import { loginSchema } from '../validators/authSchemas.js';
import { GoogleSignInButton } from '../components/auth/GoogleSignInButton.jsx';
import {
  Building2,
  ShieldCheck,
  BedDouble,
  MessageSquare,
  Calendar,
  ArrowRight,
  Mail,
  Lock,
  Loader2,
  AlertCircle,
  Compass,
  LayoutDashboard,
  CheckCircle2,
  Sparkles,
  LogOut,
} from 'lucide-react';

export const HomePage = () => {
  const { user, isAuthenticated, login, logout } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // Ensure inputs always start completely empty with no browser pre-fills
  useEffect(() => {
    reset({ email: '', password: '' });
  }, [reset]);

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      await login(formData);
      // Universal destination: all tenants, owners, and admins enter PG Finder
      navigate('/search');
    } catch (err) {
      setServerError(err.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/dashboard/admin';
    if (user.role === 'owner') return '/dashboard/owner';
    return '/dashboard/tenant';
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-140px)] flex items-center">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center w-full">
        {/* ========================================================= */}
        {/* LEFT COLUMN: Clean PG Finder Platform Overview            */}
        {/* ========================================================= */}
        <div className="lg:col-span-7 space-y-6">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-theme-brand-subtle px-3.5 py-1 text-xs font-semibold text-theme-brand border border-theme-border">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Verified Student & Professional Accommodations</span>
            </div>

            <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-theme-primary sm:text-4xl lg:text-5xl leading-tight">
              The modern way to discover, compare, and book Paying Guest (PG) stays.
            </h1>

            <p className="mt-4 text-sm text-theme-secondary leading-relaxed sm:text-base">
              PG Finder eliminates unverified broker listings, manual vacancy checks, and hidden fees.
              Connect directly with verified property managers, inspect live bed availability by room sharing, and complete bookings with zero friction.
            </p>
          </div>

          {/* 4 Core Pillars of PG Finder */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
            {/* Feature 1 */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-xs space-y-2 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-500">
                <BedDouble className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-theme-primary">Live Bed Vacancies</h3>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Inspect real-time bed inventories across Single, Double, and Triple sharing rooms with automated occupancy updates.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-xs space-y-2 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-theme-primary">Anti-Fraud Verified Reviews</h3>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Strict anti-fraud protection allows reviews only from residents with approved stays, guaranteeing authentic ratings.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-xs space-y-2 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500/10 text-indigo-500">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-theme-primary">Real-Time Direct Chat</h3>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Instant bidirectional messaging over WebSockets connects prospective tenants directly with property owners.
              </p>
            </div>

            {/* Feature 4 */}
            <div className="rounded-xl border border-theme-border bg-theme-surface p-4 shadow-xs space-y-2 transition-colors">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-purple-500/10 text-purple-500">
                <Calendar className="h-5 w-5" />
              </div>
              <h3 className="text-xs font-bold text-theme-primary">Seamless Booking Pipeline</h3>
              <p className="text-[11px] text-theme-muted leading-relaxed">
                Submit room requests, get instant owner approvals, and receive confirmation alerts and emails in real time.
              </p>
            </div>
          </div>
        </div>

        {/* ========================================================= */}
        {/* RIGHT COLUMN: Perfectly Centered Login Gateway            */}
        {/* ========================================================= */}
        <div className="lg:col-span-5 flex items-center justify-center w-full">
          {isAuthenticated ? (
            /* Logged-In Active Session Card */
            <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-sm space-y-6 transition-colors">
              <div className="text-center space-y-2">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-theme-brand-subtle text-theme-brand font-bold text-xl uppercase">
                  {user?.name?.[0] || 'U'}
                </div>
                <h2 className="text-xl font-bold text-theme-primary">Welcome Back, {user?.name}!</h2>
                <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-500 border border-emerald-500/20">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Session Active &bull; {user?.role?.toUpperCase()}</span>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <Link
                  to="/search"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-theme-brand py-3 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
                >
                  <Compass className="h-4 w-4" />
                  <span>Enter PG Finder / Explore Accommodations</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <Link
                  to={getDashboardPath()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface py-2.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                >
                  <LayoutDashboard className="h-4 w-4 text-theme-brand" />
                  <span>Open {user?.role === 'owner' ? 'Owner' : user?.role === 'admin' ? 'Admin' : 'Tenant'} Dashboard</span>
                </Link>

                <Link
                  to="/chat"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-theme-border bg-theme-surface py-2.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors shadow-xs"
                >
                  <MessageSquare className="h-4 w-4 text-theme-brand" />
                  <span>Go to Messages & Chat</span>
                </Link>
              </div>

              <div className="border-t border-theme-border pt-4 text-center">
                <button
                  type="button"
                  onClick={async () => {
                    await logout();
                    navigate('/');
                  }}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-muted hover:text-rose-500 transition-colors"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign Out / Switch Account</span>
                </button>
              </div>
            </div>
          ) : (
            /* Unauthenticated Centered Login Card */
            <div className="w-full max-w-md rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-sm space-y-6 transition-colors">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-theme-brand text-white shadow-xs">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <span className="text-[11px] font-semibold text-theme-muted bg-theme-surface-hover border border-theme-border px-2.5 py-1 rounded-full">
                    Platform Access
                  </span>
                </div>
                <h2 className="mt-4 text-xl font-bold tracking-tight text-theme-primary sm:text-2xl">
                  Sign in to PG Finder
                </h2>
                <p className="mt-1 text-xs text-theme-muted">
                  Enter your credentials to access your dashboard, bookings, and verified accommodations.
                </p>
              </div>

              {serverError && (
                <div className="flex items-start gap-2 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3 text-xs text-theme-error">
                  <AlertCircle className="h-4 w-4 shrink-0 text-theme-error mt-0.5" />
                  <span>{serverError}</span>
                </div>
              )}

              <GoogleSignInButton onErrorMessage={setServerError} />

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
                {/* Email Input */}
                <div>
                  <label className="block text-xs font-semibold text-theme-secondary mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                    <input
                      type="email"
                      autoComplete="off"
                      autoCorrect="off"
                      autoCapitalize="none"
                      spellCheck="false"
                      {...register('email')}
                      placeholder="Enter your email"
                      className={`w-full rounded-lg border bg-theme-surface pl-9 pr-3 py-2 text-xs text-theme-primary shadow-xs focus:outline-none focus:ring-1 transition-colors ${
                        errors.email
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand'
                      }`}
                    />
                  </div>
                  {errors.email && (
                    <p className="mt-1 text-[11px] text-rose-500">{errors.email.message}</p>
                  )}
                </div>

                {/* Password Input */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-semibold text-theme-secondary">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      className="text-[11px] font-medium text-theme-brand hover:underline transition-colors"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                    <input
                      type="password"
                      autoComplete="new-password"
                      {...register('password')}
                      placeholder="Enter your password"
                      className={`w-full rounded-lg border bg-theme-surface pl-9 pr-3 py-2 text-xs text-theme-primary shadow-xs focus:outline-none focus:ring-1 transition-colors ${
                        errors.password
                          ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-500'
                          : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand'
                      }`}
                    />
                  </div>
                  {errors.password && (
                    <p className="mt-1 text-[11px] text-rose-500">{errors.password.message}</p>
                  )}
                </div>

                {/* Sign In CTA */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover focus:outline-none transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <span>Sign In to PG Finder</span>
                  )}
                  {!isSubmitting && <ArrowRight className="h-3.5 w-3.5" />}
                </button>
              </form>

              {/* Registration Link */}
              <div className="border-t border-theme-border pt-4 text-center">
                <p className="text-xs text-theme-muted">
                  New to the platform?{' '}
                  <Link
                    to="/register"
                    className="font-semibold text-theme-brand hover:underline"
                  >
                    Create an account
                  </Link>
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default HomePage;
