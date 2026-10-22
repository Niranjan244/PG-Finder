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
  const [serverError, setServerError] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submittedEmail, setSubmittedEmail] = useState('');

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
      await forgotPasswordApi(formData.email);
      setSubmittedEmail(formData.email);
      setIsSubmitted(true);
    } catch (error) {
      setServerError(error.message || 'Failed to send password reset request. Please check your email.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-140px)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-xs transition-colors">
        {isSubmitted ? (
          <div className="space-y-5">
            <div className="text-center space-y-3">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500">
                <CheckCircle2 className="h-6 w-6" />
              </div>
              <h2 className="text-xl font-bold tracking-tight text-theme-primary">
                Password Reset Link Sent
              </h2>
              <p className="text-xs text-theme-secondary leading-relaxed max-w-sm mx-auto">
                If an account exists for <span className="font-semibold text-theme-primary">{submittedEmail}</span>, you will receive an email with instructions to reset your password.
              </p>
            </div>

            <div className="rounded-xl border border-theme-border bg-theme-surface-subtle p-4 text-xs text-theme-muted text-center">
              Please check your inbox (and spam or junk folder) and follow the link to reset your password.
            </div>

            <div className="pt-3 border-t border-theme-border flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => {
                  setIsSubmitted(false);
                  setSubmittedEmail('');
                }}
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
                Enter your registered email address to receive password reset instructions.
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
