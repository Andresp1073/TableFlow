'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/providers/auth-provider';
import { loginSchema, forgotPasswordSchema, resetPasswordSchema } from '@/lib/auth-schemas';
import * as authApi from '@/services/auth';
import type { LoginFormData, ForgotPasswordFormData, ResetPasswordFormData } from '@/lib/auth-schemas';

interface UseLoginReturn {
  login: (data: LoginFormData) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

export function useLogin(): UseLoginReturn {
  const { login: authLogin } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(
    async (data: LoginFormData) => {
      setIsLoading(true);
      setError(null);
      try {
        const parsed = loginSchema.parse(data);
        await authLogin(parsed.email, parsed.password);
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('An unexpected error occurred. Please try again.');
        }
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [authLogin],
  );

  return { login, isLoading, error };
}

interface UseForgotPasswordReturn {
  submit: (data: ForgotPasswordFormData) => Promise<boolean>;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function useForgotPassword(): UseForgotPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: ForgotPasswordFormData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const parsed = forgotPasswordSchema.parse(data);
      await authApi.forgotPassword({ email: parsed.email });
      setIsSuccess(true);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { submit, isLoading, isSuccess, error };
}

interface UseResetPasswordReturn {
  submit: (data: ResetPasswordFormData) => Promise<boolean>;
  isLoading: boolean;
  isSuccess: boolean;
  error: string | null;
}

export function useResetPassword(): UseResetPasswordReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = useCallback(async (data: ResetPasswordFormData): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    setIsSuccess(false);
    try {
      const parsed = resetPasswordSchema.parse(data);
      await authApi.resetPassword({
        token: parsed.token,
        password: parsed.password,
        passwordConfirmation: parsed.passwordConfirmation,
      });
      setIsSuccess(true);
      return true;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred. Please try again.');
      }
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { submit, isLoading, isSuccess, error };
}
