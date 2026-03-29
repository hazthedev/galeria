// ============================================
// Galeria - Admin Login Form Component
// ============================================
// Login form specifically for administrators with MFA support

'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowLeft, Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { useAuth } from '@/lib/auth';
import type { IUser } from '@/lib/types';

// ============================================
// TYPES
// ============================================

interface LoginFormData {
  email: string;
  password: string;
  rememberMe: boolean;
}

interface AdminLoginFormProps {
  onSuccess?: () => void;
  className?: string;
}

interface LoginResponse {
  success: boolean;
  user?: IUser;
  sessionId?: string;
  message?: string;
  error?: string;
  mfaRequired?: boolean;
  mfaUserId?: string | null;
}

interface ApiError {
  error: string;
  message: string;
  code?: string;
}

// ============================================
// COMPONENT
// ============================================

export function AdminLoginForm({ onSuccess, className }: AdminLoginFormProps) {
  const { setAuthenticatedUser } = useAuth();
  const [formData, setFormData] = useState<LoginFormData>({
    email: '',
    password: '',
    rememberMe: false,
  });
  const [errors, setErrors] = useState<Partial<Record<keyof LoginFormData, string>>>({});
  const [apiError, setApiError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [mfaStep, setMfaStep] = useState(false);
  const [mfaUserId, setMfaUserId] = useState<string | null>(null);
  const [mfaEmail, setMfaEmail] = useState('');
  const [totpCode, setTotpCode] = useState('');
  const [mfaError, setMfaError] = useState<string | null>(null);

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof LoginFormData, string>> = {};

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const resetMfaState = () => {
    setMfaStep(false);
    setMfaUserId(null);
    setMfaEmail('');
    setTotpCode('');
    setMfaError(null);
  };

  const completeAdminLogin = (user: IUser | undefined) => {
    if (user) {
      setAuthenticatedUser(user, formData.rememberMe);
    }

    onSuccess?.();
    toast.success('Welcome back, Admin!');
    window.location.href = '/admin';
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setMfaError(null);

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          rememberMe: formData.rememberMe,
        }),
        credentials: 'include',
      });

      const data: LoginResponse | ApiError = await response.json();

      if (!response.ok) {
        const errorData = data as ApiError;
        const msg = errorData.message || 'Login failed. Please try again.';
        setApiError(msg);
        toast.error(msg);
        return;
      }

      const successData = data as LoginResponse;

      if (successData.mfaRequired === true && successData.mfaUserId) {
        setMfaUserId(successData.mfaUserId);
        setMfaEmail(formData.email.trim().toLowerCase());
        setMfaStep(true);
        setTotpCode('');
        setApiError(null);
        setMfaError(null);
        return;
      }

      if (!successData.success) {
        const msg = successData.error || 'Login failed. Please try again.';
        setApiError(msg);
        toast.error(msg);
        return;
      }

      if (successData.user?.role !== 'super_admin') {
        const msg = 'Access Denied. You do not have administrator privileges.';
        setApiError(msg);
        toast.error(msg);
        return;
      }

      completeAdminLogin(successData.user);
    } catch (error) {
      console.error('[ADMIN_LOGIN] Error:', error);
      const msg = 'An unexpected error occurred. Please try again.';
      setApiError(msg);
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleMfaSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setApiError(null);
    setMfaError(null);

    const cleanCode = totpCode.replace(/\D/g, '').slice(0, 6);
    if (cleanCode.length !== 6 || !mfaUserId) {
      setMfaError('Invalid code — please try again');
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/mfa/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          mfaUserId,
          token: cleanCode,
          email: mfaEmail,
          rememberMe: formData.rememberMe,
        }),
      });

      const data: LoginResponse | ApiError = await response.json();

      if (!response.ok) {
        setMfaError('Invalid code — please try again');
        return;
      }

      const successData = data as LoginResponse;
      if (!successData.success || successData.user?.role !== 'super_admin') {
        setMfaError('Invalid code — please try again');
        return;
      }

      resetMfaState();
      completeAdminLogin(successData.user);
    } catch (error) {
      console.error('[ADMIN_LOGIN_MFA] Error:', error);
      setMfaError('Invalid code — please try again');
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: keyof LoginFormData, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const next = { ...prev };
        delete next[field];
        return next;
      });
    }
  };

  return (
    <form
      onSubmit={mfaStep ? handleMfaSubmit : handleSubmit}
      className={clsx('space-y-5', className)}
    >
      {apiError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800 dark:bg-red-900/20 dark:text-red-300">
          <div className="flex items-center">
            <ShieldCheck className="mr-2 h-4 w-4" />
            {apiError}
          </div>
        </div>
      )}

      {mfaStep ? (
        <>
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Verify administrator access
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Enter the 6-digit code from your authenticator app to continue.
            </p>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {mfaEmail}
            </p>
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="admin-totp-code"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Verification code
            </label>
            <input
              id="admin-totp-code"
              type="text"
              autoFocus
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={totpCode}
              onChange={(e) => {
                setTotpCode(e.target.value.replace(/\D/g, '').slice(0, 6));
                if (mfaError) {
                  setMfaError(null);
                }
              }}
              className={clsx(
                'block min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm tracking-[0.35em]',
                'transition-colors duration-200 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                mfaError
                  ? 'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/10 dark:text-red-200'
                  : 'border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100'
              )}
              placeholder="123456"
              disabled={isLoading}
            />
            {mfaError && (
              <p className="text-sm text-red-600 dark:text-red-400">
                {mfaError}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isLoading}
              className={clsx(
                'flex min-h-11 flex-1 items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold',
                'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isLoading
                  ? 'bg-violet-800 text-white'
                  : 'bg-violet-900 text-white hover:bg-violet-950 focus:ring-violet-800 dark:bg-violet-800 dark:hover:bg-violet-900'
              )}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify'
              )}
            </button>

            <button
              type="button"
              onClick={resetMfaState}
              disabled={isLoading}
              className="flex min-h-11 flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-all duration-200 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </button>
          </div>
        </>
      ) : (
        <>
          <div className="space-y-1.5">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Admin Email
            </label>
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={formData.email}
              onChange={(e) => handleInputChange('email', e.target.value)}
              className={clsx(
                'block min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm',
                'transition-colors duration-200 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                {
                  'border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100':
                    !errors.email,
                  'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/10 dark:text-red-200':
                    errors.email,
                }
              )}
              aria-invalid={errors.email ? 'true' : 'false'}
              aria-describedby={errors.email ? 'email-error' : undefined}
              placeholder="admin@galeria.example"
              disabled={isLoading}
            />
            {errors.email && (
              <p id="email-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.email}
              </p>
            )}
          </div>

          <div className="space-y-1.5">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={(e) => handleInputChange('password', e.target.value)}
              className={clsx(
                'block min-h-11 w-full rounded-lg border px-4 py-2.5 text-sm',
                'transition-colors duration-200 placeholder:text-gray-400',
                'focus:outline-none focus:ring-2 focus:ring-offset-0',
                {
                  'border-gray-300 bg-white text-gray-900 focus:border-violet-500 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100':
                    !errors.password,
                  'border-red-300 bg-red-50 text-red-900 focus:border-red-500 focus:ring-red-500 dark:border-red-600 dark:bg-red-900/10 dark:text-red-200':
                    errors.password,
                }
              )}
              aria-invalid={errors.password ? 'true' : 'false'}
              aria-describedby={errors.password ? 'password-error' : undefined}
              placeholder="••••••••"
              disabled={isLoading}
            />
            {errors.password && (
              <p id="password-error" className="text-sm text-red-600 dark:text-red-400">
                {errors.password}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center">
              <input
                id="remember-me"
                type="checkbox"
                checked={formData.rememberMe}
                onChange={(e) => handleInputChange('rememberMe', e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-violet-600 focus:ring-violet-500 dark:border-gray-600 dark:bg-gray-800"
                disabled={isLoading}
              />
              <label
                htmlFor="remember-me"
                className="ml-2 block text-sm text-gray-700 dark:text-gray-300"
              >
                Remember me for 30 days
              </label>
            </div>

            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              Forgot password?
            </Link>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={clsx(
              'flex min-h-11 w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold',
              'transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2',
              'disabled:cursor-not-allowed disabled:opacity-50',
              isLoading
                ? 'bg-violet-800 text-white'
                : 'bg-violet-900 text-white hover:bg-violet-950 focus:ring-violet-800 dark:bg-violet-800 dark:hover:bg-violet-900'
            )}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Authenticating...
              </>
            ) : (
              'Admin Access'
            )}
          </button>
        </>
      )}
    </form>
  );
}
