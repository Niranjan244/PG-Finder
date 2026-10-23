import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { loginSchema } from '../../validators/authSchemas.js';
import { GoogleSignInButton } from '../../components/auth/GoogleSignInButton.jsx';
import { ThemeToggle } from '../../components/common/ThemeToggle.jsx';
import {
  Building2,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ArrowLeft,
  AlertCircle,
  Loader2,
  Eye,
  EyeOff,
  Mail,
  Lock,
  MessageSquare,
} from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isInteractive, setIsInteractive] = useState(false);

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

  // Ensure fields are reset to empty on initial mount
  useEffect(() => {
    reset({ email: '', password: '' });
    const timer = setTimeout(() => {
      reset({ email: '', password: '' });
    }, 100);
    return () => clearTimeout(timer);
  }, [reset]);

  const handleActivateFields = () => {
    if (!isInteractive) {
      setIsInteractive(true);
    }
  };

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const loggedUser = await login(formData);
      if (loggedUser?.role === 'admin') {
        navigate('/dashboard/admin', { replace: true });
      } else if (loggedUser?.role === 'owner') {
        navigate('/dashboard/owner', { replace: true });
      } else {
        navigate('/search', { replace: true });
      }
    } catch (error) {
      setServerError(error.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="h-screen w-full bg-theme-bg text-theme-primary overflow-hidden flex flex-col relative select-none">
      {/* Luminous Aurora Glow Canvas (Matches Landing Page Style) */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft upper violet glow */}
        <div className="absolute -top-24 right-1/4 w-[700px] h-[450px] bg-purple-500/12 dark:bg-purple-600/18 blur-[150px] rounded-full" />
        {/* Central warm amber radiant glow */}
        <div className="absolute top-48 left-1/3 -translate-x-1/2 w-[700px] h-[400px] bg-amber-400/16 dark:bg-amber-500/12 blur-[160px] rounded-full" />
        {/* Lower indigo fill */}
        <div className="absolute -bottom-10 left-10 w-[550px] h-[350px] bg-indigo-500/10 dark:bg-indigo-500/14 blur-[140px] rounded-full" />
      </div>

      {/* Top Header Navigation */}
      <header className="relative z-20 flex h-16 shrink-0 items-center justify-between border-b border-theme-border/60 bg-theme-surface/75 px-6 backdrop-blur-md sm:px-10">
        <Link to="/" className="flex items-center gap-3 group">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 via-indigo-600 to-violet-500 text-white shadow-xs group-hover:scale-105 transition-transform">
            <Building2 className="h-5 w-5" />
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-lg font-black tracking-tight text-theme-primary leading-none">
              PG FINDER
            </span>
            <span className="text-[10px] text-theme-muted tracking-wide mt-0.5 font-medium">
              Verified Stays &bull; Zero Brokerage
            </span>
          </div>
        </Link>

        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 rounded-full border border-theme-border bg-theme-surface px-3.5 py-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-primary hover:bg-theme-surface-hover transition-colors shadow-2xs"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>Back to Home</span>
          </Link>
        </div>
      </header>

      {/* Main Split Layout: Balanced 50/50 Screen */}
      <main className="relative z-10 flex flex-1 flex-col lg:flex-row overflow-hidden">
        {/* Left Side: Overview of PG Finder (Centered & Spacious) */}
        <section className="hidden lg:flex lg:w-1/2 flex-col justify-between px-10 xl:px-16 py-8 border-r border-theme-border/50 overflow-hidden">
          <div className="w-full max-w-xl mx-auto my-auto space-y-6">
            {/* Top Pill Tag */}
            <div className="inline-flex items-center gap-2 rounded-full border border-theme-border/80 bg-theme-surface/80 backdrop-blur-sm px-4 py-1.5 text-xs font-semibold text-theme-secondary shadow-2xs w-fit">
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
              <span>Welcome Back to PG Finder</span>
            </div>

            {/* Editorial Headline with Rich Gradient Accent */}
            <h1 className="font-serif text-3xl sm:text-4xl xl:text-5xl font-bold tracking-tight text-theme-primary leading-[1.14]">
              Your gateway to verified{' '}
              <span className="italic font-serif bg-gradient-to-r from-purple-600 via-indigo-600 to-violet-500 dark:from-purple-400 dark:via-indigo-300 dark:to-violet-400 bg-clip-text text-transparent">
                accommodations &amp; co-living.
              </span>
            </h1>

            {/* Two-line Overview Description */}
            <div className="text-sm sm:text-base text-theme-secondary space-y-1.5 font-normal leading-relaxed">
              <p>Find verified PG accommodations and modern co-living stays with zero broker fees.</p>
              <p>Connect directly with owners, inspect live bed availability, and book your room online.</p>
            </div>

            {/* Feature Cards with Status Badges (Matches Reference Layout) */}
            <div className="space-y-3.5 pt-2">
              {/* Card 1 */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-theme-border/70 bg-theme-surface/70 hover:bg-theme-surface/90 p-4 backdrop-blur-xs transition-all shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                    <ShieldCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-theme-primary">
                      Zero Brokerage &amp; Verified Listings
                    </h4>
                    <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
                      Direct admission with authentic photos and transparent pricing.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-md">
                  VERIFIED STAYS
                </span>
              </div>

              {/* Card 2 */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-theme-border/70 bg-theme-surface/70 hover:bg-theme-surface/90 p-4 backdrop-blur-xs transition-all shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-theme-primary">
                      Real-Time Bed &amp; Room Availability
                    </h4>
                    <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
                      Check live vacancy for single, double, and shared rooms instantly.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-md">
                  LIVE INVENTORY
                </span>
              </div>

              {/* Card 3 */}
              <div className="flex items-center justify-between gap-4 rounded-xl border border-theme-border/70 bg-theme-surface/70 hover:bg-theme-surface/90 p-4 backdrop-blur-xs transition-all shadow-2xs">
                <div className="flex items-center gap-3.5">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <MessageSquare className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="text-xs sm:text-sm font-bold text-theme-primary">
                      Direct In-App Chat with Owners
                    </h4>
                    <p className="text-[11px] sm:text-xs text-theme-muted mt-0.5">
                      Message property owners directly to schedule visits &amp; confirm stays.
                    </p>
                  </div>
                </div>
                <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-md">
                  DIRECT CHAT
                </span>
              </div>
            </div>
          </div>

          {/* Bottom Trust Indicators */}
          <div className="w-full max-w-xl mx-auto pt-4 border-t border-theme-border/50 flex items-center justify-between text-xs text-theme-muted font-medium">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              Verified Accommodations
            </span>
            <span>&bull;</span>
            <span>Dynamic Bed Booking</span>
            <span>&bull;</span>
            <span>Dedicated Dashboards</span>
          </div>
        </section>

        {/* Right Side: Generously Sized Login Panel (Matches Reference Style) */}
        <section className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-10 xl:px-16 py-8 overflow-y-auto lg:overflow-hidden">
          <div className="w-full max-w-[480px] sm:max-w-[500px] rounded-2xl border border-theme-border/80 bg-theme-surface/90 backdrop-blur-xl p-8 sm:p-10 shadow-2xl shadow-indigo-950/10">
            {/* Header */}
            <div className="mb-6">
              <h2 className="font-serif text-3xl font-bold tracking-tight text-theme-primary">
                Welcome back
              </h2>
              <p className="text-xs sm:text-sm text-theme-muted mt-1.5">
                Sign in to access your PG bookings, saved stays, or owner dashboard.
              </p>
            </div>

            {/* Server Error Alert */}
            {serverError && (
              <div className="mb-4 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/10 p-3 text-xs text-rose-600 dark:text-rose-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Google Sign In */}
            <GoogleSignInButton onErrorMessage={setServerError} />

            {/* Credentials Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              {/* Invisible absorbers to prevent aggressive browser autofill on initial mount */}
              <input type="text" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />
              <input type="password" style={{ display: 'none' }} tabIndex="-1" aria-hidden="true" autoComplete="off" />

              <div>
                <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-secondary mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                  <input
                    type="email"
                    autoComplete="off"
                    readOnly={!isInteractive}
                    onFocus={handleActivateFields}
                    onClick={handleActivateFields}
                    {...register('email')}
                    className={`w-full rounded-xl border pl-10 pr-4 py-3 text-sm text-theme-primary bg-theme-surface/80 placeholder-theme-muted focus:outline-hidden focus:ring-2 transition-all ${
                      errors.email
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-theme-border focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                    placeholder="name@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.email.message}</p>
                )}
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold uppercase tracking-wider text-theme-secondary">
                    Password
                  </label>
                  <Link
                    to="/forgot-password"
                    className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
                  >
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-theme-muted" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    readOnly={!isInteractive}
                    onFocus={handleActivateFields}
                    onClick={handleActivateFields}
                    {...register('password')}
                    className={`w-full rounded-xl border pl-10 pr-10 py-3 text-sm text-theme-primary bg-theme-surface/80 placeholder-theme-muted focus:outline-hidden focus:ring-2 transition-all ${
                      errors.password
                        ? 'border-rose-400 focus:ring-rose-400/20'
                        : 'border-theme-border focus:border-purple-500 focus:ring-purple-500/20'
                    }`}
                    placeholder="Enter your password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary transition-colors cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-[11px] text-rose-500 font-medium">{errors.password.message}</p>
                )}
              </div>

              {/* Keep me signed in checkbox */}
              <div className="flex items-center pt-1">
                <label className="flex items-center gap-2.5 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-theme-border text-purple-600 focus:ring-purple-500/30 accent-purple-600"
                  />
                  <span className="text-xs text-theme-secondary font-medium">
                    Keep me signed in on this device
                  </span>
                </label>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-indigo-700 hover:from-purple-700 hover:to-indigo-800 text-white font-bold text-sm py-3.5 shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 active:scale-98 disabled:opacity-60 transition-all cursor-pointer"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Signing in...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </form>

            {/* Switch to Register */}
            <div className="mt-6 pt-5 border-t border-theme-border/60 text-center">
              <p className="text-xs sm:text-sm text-theme-secondary">
                Don&apos;t have an account yet?{' '}
                <Link
                  to="/register"
                  className="font-bold text-purple-600 dark:text-purple-400 hover:underline"
                >
                  Create Account
                </Link>
              </p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
