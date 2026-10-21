import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { loginSchema } from '../../validators/authSchemas.js';
import { LogIn, AlertCircle, Loader2 } from 'lucide-react';

export const LoginPage = () => {
  const { login } = useAuth();
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

  useEffect(() => {
    reset({ email: '', password: '' });
  }, [reset]);

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      await login(formData);
      // Universal destination: all roles enter PG Finder
      navigate('/search', { replace: true });
    } catch (error) {
      setServerError(error.message || 'Authentication failed. Please verify your credentials.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-sm transition-colors">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
            <LogIn className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
            Sign in to your account
          </h2>
          <p className="mt-1 text-sm text-theme-muted">
            Enter your credentials to access your dashboard and bookings
          </p>
        </div>

        {serverError && (
          <div className="flex items-start gap-2.5 rounded-lg border border-theme-error/30 bg-theme-error-subtle p-3.5 text-xs text-theme-error">
            <AlertCircle className="h-4 w-4 shrink-0 text-theme-error mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" autoComplete="off">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="off"
              autoCorrect="off"
              autoCapitalize="none"
              spellCheck="false"
              {...register('email')}
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
              }`}
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <div className="flex items-center justify-between">
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
                Password
              </label>
              <Link
                to="/forgot-password"
                className="text-xs font-medium text-theme-brand hover:underline transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              autoComplete="new-password"
              {...register('password')}
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                errors.password
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
              }`}
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
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
                <span>Authenticating...</span>
              </>
            ) : (
              <span>Sign In</span>
            )}
          </button>
        </form>

        <div className="pt-4 text-center border-t border-theme-border">
          <p className="text-xs text-theme-secondary">
            Do not have an account?{' '}
            <Link to="/register" className="font-semibold text-theme-brand hover:underline">
              Create an account
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
