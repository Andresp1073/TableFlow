'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff, ArrowLeft, ShieldCheck } from 'lucide-react';
import { resetPasswordSchema, type ResetPasswordFormData } from '@/lib/auth-schemas';
import { useResetPassword } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';

function getPasswordStrength(password: string): { label: string; color: string; width: string } {
  let score = 0;
  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[A-Z]/.test(password)) score++;
  if (/[a-z]/.test(password)) score++;
  if (/[0-9]/.test(password)) score++;
  if (/[^A-Za-z0-9]/.test(password)) score++;

  if (score <= 2) return { label: 'Weak', color: 'bg-destructive', width: 'w-1/3' };
  if (score <= 4) return { label: 'Medium', color: 'bg-warning', width: 'w-2/3' };
  return { label: 'Strong', color: 'bg-success', width: 'w-full' };
}

export function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get('token') ?? '';
  const { submit, isLoading, isSuccess, error } = useResetPassword();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      token,
      password: '',
      passwordConfirmation: '',
    },
  });

  const watchPassword = watch('password', '');
  const strength = getPasswordStrength(watchPassword);

  const onSubmit = async (data: ResetPasswordFormData) => {
    await submit(data);
  };

  if (!token) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Invalid reset link</h1>
            <p className="text-sm text-muted-foreground">
              This password reset link is invalid or has expired.
            </p>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/forgot-password">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Request new link
            </Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card>
        <CardContent className="p-6 text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-success/10">
            <ShieldCheck className="h-6 w-6 text-success" />
          </div>
          <div className="space-y-1.5">
            <h1 className="text-xl font-semibold tracking-tight">Password reset</h1>
            <p className="text-sm text-muted-foreground">
              Your password has been reset successfully.
            </p>
          </div>
          <Button size="sm" asChild>
            <Link href="/login">Sign in with new password</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent className="p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
          <div className="space-y-1.5 text-center">
            <h1 className="text-xl font-semibold tracking-tight">Set new password</h1>
            <p className="text-sm text-muted-foreground">
              Enter your new password below.
            </p>
          </div>

          {error && (
            <Alert variant="error">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <input type="hidden" {...register('token')} />

          <FormField name="password" error={errors.password?.message}>
            <FormItem>
              <FormLabel>New password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter new password"
                    autoComplete="new-password"
                    autoFocus
                    disabled={isLoading}
                    {...register('password')}
                    onChange={(e) => {
                      register('password').onChange(e);
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
              {watchPassword.length > 0 && (
                <div className="space-y-1">
                  <div className="flex h-1.5 w-full overflow-hidden rounded-full bg-muted">
                    <div className={`h-full ${strength.color} ${strength.width} transition-all duration-300`} />
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password strength: <span className="font-medium">{strength.label}</span>
                  </p>
                </div>
              )}
            </FormItem>
          </FormField>

          <FormField name="passwordConfirmation" error={errors.passwordConfirmation?.message}>
            <FormItem>
              <FormLabel>Confirm password</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    placeholder="Confirm new password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...register('passwordConfirmation')}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label={showConfirm ? 'Hide password' : 'Show password'}
                    tabIndex={-1}
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          </FormField>

          <Button type="submit" className="w-full" loading={isLoading}>
            {isLoading ? 'Resetting...' : 'Reset password'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
