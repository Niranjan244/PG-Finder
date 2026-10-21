import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { registerSchema } from '../../validators/authSchemas.js';
import { UserPlus, AlertCircle, Loader2, User, Building } from 'lucide-react';

export const RegisterPage = () => {
  const { register: registerAuth } = useAuth();
  const navigate = useNavigate();
  const [serverError, setServerError] = useState('');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: '',
      email: '',
      phone: '',
      password: '',
      confirmPassword: '',
      role: 'tenant',
    },
  });

  const selectedRole = watch('role');

  const onSubmit = async (formData) => {
    setServerError('');
    try {
      const { confirmPassword, ...payload } = formData;
      await registerAuth(payload);
      // Universal destination: direct access into PG Finder
      navigate('/search', { replace: true });
    } catch (error) {
      setServerError(error.message || 'Registration failed. Please check your information.');
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-6 rounded-2xl border border-theme-border bg-theme-surface p-8 shadow-sm transition-colors">
        <div>
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-theme-brand-subtle text-theme-brand">
            <UserPlus className="h-5 w-5" />
          </div>
          <h2 className="mt-4 text-2xl font-bold tracking-tight text-theme-primary">
            Create an account
          </h2>
          <p className="mt-1 text-sm text-theme-muted">
            Join PG Finder to find or manage verified accommodations
          </p>
        </div>

        {/* Role Selection Tabs */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary mb-2">
            I am joining as:
          </label>
          <div className="grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={() => setValue('role', 'tenant', { shouldValidate: true })}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-xs font-semibold transition-all ${
                selectedRole === 'tenant'
                  ? 'border-theme-brand bg-theme-brand-subtle text-theme-brand shadow-xs ring-1 ring-theme-brand'
                  : 'border-theme-border bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface hover:text-theme-primary'
              }`}
            >
              <User className="h-4 w-4" />
              <span>Tenant (Seeker)</span>
            </button>
            <button
              type="button"
              onClick={() => setValue('role', 'owner', { shouldValidate: true })}
              className={`flex items-center justify-center gap-2 rounded-lg border py-2.5 px-3 text-xs font-semibold transition-all ${
                selectedRole === 'owner'
                  ? 'border-theme-brand bg-theme-brand-subtle text-theme-brand shadow-xs ring-1 ring-theme-brand'
                  : 'border-theme-border bg-theme-surface-hover text-theme-secondary hover:bg-theme-surface hover:text-theme-primary'
              }`}
            >
              <Building className="h-4 w-4" />
              <span>PG Owner</span>
            </button>
          </div>
          {errors.role && (
            <p className="mt-1 text-xs text-rose-500">{errors.role.message}</p>
          )}
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
              Full Name
            </label>
            <input
              type="text"
              autoComplete="name"
              {...register('name')}
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                errors.name
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
              }`}
              placeholder="e.g. Rahul Sharma"
            />
            {errors.name && (
              <p className="mt-1 text-xs text-rose-500">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
              Email Address
            </label>
            <input
              type="email"
              autoComplete="email"
              {...register('email')}
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                errors.email
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
              }`}
              placeholder="name@example.com"
            />
            {errors.email && (
              <p className="mt-1 text-xs text-rose-500">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
              Phone Number
            </label>
            <input
              type="tel"
              autoComplete="tel"
              {...register('phone')}
              className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                errors.phone
                  ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                  : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
              }`}
              placeholder="e.g. 9876543210"
            />
            {errors.phone && (
              <p className="mt-1 text-xs text-rose-500">{errors.phone.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
                Password
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                  errors.password
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
                }`}
                placeholder="Min 8 chars"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-rose-500">{errors.password.message}</p>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-theme-secondary">
                Confirm
              </label>
              <input
                type="password"
                autoComplete="new-password"
                {...register('confirmPassword')}
                className={`mt-1.5 block w-full rounded-lg border px-3 py-2 text-sm text-theme-primary bg-theme-surface placeholder-theme-muted focus:outline-none focus:ring-2 transition-colors ${
                  errors.confirmPassword
                    ? 'border-rose-400 focus:border-rose-500 focus:ring-rose-200'
                    : 'border-theme-border focus:border-theme-brand focus:ring-theme-brand/20'
                }`}
                placeholder="Repeat password"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-xs text-rose-500">{errors.confirmPassword.message}</p>
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-theme-brand py-2.5 text-sm font-semibold text-white shadow-xs hover:bg-theme-brand-hover focus:outline-none focus:ring-2 focus:ring-theme-brand focus:ring-offset-2 disabled:opacity-50 transition-colors mt-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Create Account</span>
            )}
          </button>
        </form>

        <div className="pt-4 text-center border-t border-theme-border">
          <p className="text-xs text-theme-secondary">
            Already have an account?{' '}
            <Link to="/" className="font-semibold text-theme-brand hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
