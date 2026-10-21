import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { forgotPasswordApi } from '../../services/authClient.js';
import {
  Mail,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  ArrowRight,
  Copy,
  Check,
} from 'lucide-react';

const forgotPasswordSchema = z.object({
  email: z
    .string()
    .trim()
    .min(1, 'Email address is required')
    .email('Please enter a valid email address')
    .toLowerCase(),
});

export const ForgotPasswordPage = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');
  const [resetData, setResetData] = useState(null);
  const [copied, setCopied] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const response = await forgotPasswordApi(formData.email);
      const payload = response.data || response;
      setResetData(payload);
    } catch (error) {
      setServerError(error.message || 'Failed to send password reset request. Please check your email.');
    }
  };

  const handleCopy = () => {
    const directUrl =
      resetData?.resetUrl || `${window.location.origin}/reset-password/${resetData?.resetToken}`;
    navigator.clipboard.writeText(directUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-xs transition-colors">
        {resetData ? (
          <div className="space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-theme-primary">
                Reset Authorized
              </h2>
              <p className="text-xs text-theme-secondary leading-relaxed max-w-sm mx-auto">
                Account found for <span className="font-semibold text-theme-primary">{resetData.email}</span>.
                You can reset your password immediately right here in the browser.
              </p>
            </div>

            {/* In-Browser Direct Reset Call-to-Action */}
            <div className="rounded-xl border border-theme-brand/30 bg-theme-brand-subtle p-4 space-y-3">
              <div className="flex items-center gap-2 text-theme-brand font-semibold text-xs">
                <KeyRound className="h-4 w-4" />
                <span>Reset In-Browser Immediately</span>
              </div>
              <p className="text-[11px] text-theme-secondary">
                Click below to open the password update form directly without needing to open your email:
              </p>
              <button
                type="button"
                onClick={() => navigate(`/reset-password/${resetData.resetToken}`)}
                className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                <span>Proceed to Set New Password</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Direct Link Copy */}
            <div className="space-y-1.5 pt-1">
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-theme-muted">
                Direct Reset URL
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={
                    resetData.resetUrl ||
                    `${window.location.origin}/reset-password/${resetData.resetToken}`
                  }
                  className="flex-1 rounded-lg border border-theme-border bg-theme-surface-hover px-3 py-1.5 text-xs font-mono text-theme-primary select-all"
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="inline-flex items-center gap-1 rounded-lg border border-theme-border bg-theme-surface px-3 py-1.5 text-xs font-semibold text-theme-secondary hover:bg-theme-surface-hover hover:text-theme-primary transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="h-3.5 w-3.5 text-emerald-500" />
                      <span className="text-emerald-500">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="h-3.5 w-3.5 text-theme-muted" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-theme-muted">
                A copy was also dispatched to your email inbox for your records.
              </p>
            </div>

            <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => setResetData(null)}
                className="font-medium text-theme-muted hover:text-theme-primary"
              >
                Use another email
              </button>
              <Link
                to="/"
                className="inline-flex items-center gap-1 font-semibold text-theme-brand hover:underline"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div>
              <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand mb-3">
                <KeyRound className="h-5 w-5" />
              </div>
              <h1 className="text-center text-2xl font-bold tracking-tight text-theme-primary">
                Forgot your password?
              </h1>
              <p className="mt-1 text-center text-xs text-theme-muted">
                Enter your registered email address to reset your password directly in the browser.
              </p>
            </div>

            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3.5 text-xs text-theme-error">
                <AlertCircle className="h-4 w-4 shrink-0 text-theme-error mt-0.5" />
                <span>{serverError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" autoComplete="off">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
                  Email Address
                </label>
                <div className="relative mt-1.5">
                  <input
                    type="email"
                    autoComplete="off"
                    {...register('email')}
                    className={`block w-full rounded-lg border pl-9 pr-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                      errors.email
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
                    }`}
                    placeholder="Enter your email"
                  />
                  <Mail className="absolute left-3 top-2.5 h-4 w-4 text-theme-muted" />
                </div>
                {errors.email && (
                  <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-theme-brand py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-theme-brand-hover focus:outline-none focus:ring-2 focus:ring-theme-brand focus:ring-offset-2 disabled:opacity-50 transition-colors"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Authorizing Reset...</span>
                  </>
                ) : (
                  <span>Continue to Reset</span>
                )}
              </button>
            </form>

            <div className="pt-4 text-center border-t border-theme-border">
              <Link
                to="/"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-theme-secondary hover:text-theme-primary transition-colors"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>Back to Sign In</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default ForgotPasswordPage;
