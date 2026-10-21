import React, { useState } from 'react';
import { Link, useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { resetPasswordApi } from '../../services/authClient.js';
import { Lock, Eye, EyeOff, Loader2, CheckCircle2, AlertCircle, ArrowLeft, KeyRound } from 'lucide-react';

const resetPasswordSchema = z
  .object({
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[a-zA-Z]/, 'Password must contain at least one letter'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),
  })
  .refine((formData) => formData.password === formData.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export const ResetPasswordPage = () => {
  const { token: paramToken } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = paramToken || searchParams.get('token') || '';

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [serverError, setServerError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: '', confirmPassword: '' },
  });

  const onSubmit = async (formData) => {
    if (!token) {
      setServerError('Reset token is missing from the URL. Please use the link sent to your email.');
      return;
    }

    setServerError('');
    try {
      await resetPasswordApi({ token, password: formData.password });
      setIsSuccess(true);
    } catch (error) {
      setServerError(error.message || 'Failed to reset password. The link may have expired.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-xs transition-colors">
        {isSuccess ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-theme-primary">
              Password Reset Complete
            </h2>
            <p className="text-xs text-theme-secondary leading-relaxed max-w-sm mx-auto">
              Your password has been successfully updated. You can now use your new password to sign in.
            </p>
            <div className="pt-4 border-t border-theme-border">
              <Link
                to="/"
                className="inline-flex w-full items-center justify-center rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                Continue to Sign In
              </Link>
            </div>
          </div>
        ) : !token ? (
          <div className="text-center space-y-4">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <AlertCircle className="h-6 w-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-theme-primary">
              Invalid or Missing Link
            </h2>
            <p className="text-xs text-theme-secondary leading-relaxed max-w-sm mx-auto">
              This password reset link is incomplete or missing a valid security token.
            </p>
            <div className="pt-4 border-t border-theme-border">
              <Link
                to="/forgot-password"
                className="inline-flex w-full items-center justify-center rounded-lg bg-theme-brand py-2.5 text-xs font-semibold text-white shadow-xs hover:bg-theme-brand-hover transition-colors"
              >
                Request a New Reset Link
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
                Set New Password
              </h1>
              <p className="mt-1 text-center text-xs text-theme-muted">
                Please enter and confirm your new secure password.
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
                  New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('password')}
                    className={`block w-full rounded-lg border pl-9 pr-10 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                      errors.password
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
                    }`}
                    placeholder="At least 8 characters with letters & numbers"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-theme-muted" />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-theme-muted hover:text-theme-primary"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
                  Confirm New Password
                </label>
                <div className="relative mt-1.5">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    autoComplete="new-password"
                    {...register('confirmPassword')}
                    className={`block w-full rounded-lg border pl-9 pr-10 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                      errors.confirmPassword
                        ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                        : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
                    }`}
                    placeholder="Re-type your new password"
                  />
                  <Lock className="absolute left-3 top-2.5 h-4 w-4 text-theme-muted" />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-theme-muted hover:text-theme-primary"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>
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
                    <span>Updating Password...</span>
                  </>
                ) : (
                  <span>Update Password</span>
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

export default ResetPasswordPage;
