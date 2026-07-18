'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Eye, EyeOff } from 'lucide-react';
import { loginSchema, type LoginFormData } from '@/lib/auth-schemas';
import { useLogin } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { t } from '@/lib/i18n';

export function LoginForm() {
  const { login, isLoading, error } = useLogin();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberSession: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      await login(data);
    } catch {
      // Error is handled by the hook
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5" noValidate>
      <div className="space-y-1.5 text-center">
        <h1 className="text-xl font-semibold tracking-tight">{t('Welcome back')}</h1>
        <p className="text-sm text-muted-foreground">{t('Sign in to your account to continue')}</p>
      </div>

      {error && (
        <Alert variant="error">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <FormField name="email" error={errors.email?.message}>
        <FormItem>
          <FormLabel>{t('Email')}</FormLabel>
          <FormControl>
            <Input
              type="email"
              placeholder={t('name@example.com')}
              autoComplete="email"
              autoFocus
              disabled={isLoading}
              {...register('email')}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <FormField name="password" error={errors.password?.message}>
        <FormItem>
          <div className="flex items-center justify-between">
            <FormLabel>{t('Password')}</FormLabel>
            <Link
              href="/forgot-password"
              className="text-xs text-primary hover:underline"
              tabIndex={isLoading ? -1 : 0}
            >
              {t('Forgot password?')}
            </Link>
          </div>
          <FormControl>
            <div className="relative">
              <Input
                type={showPassword ? 'text' : 'password'}
                placeholder={t('Enter your password')}
                autoComplete="current-password"
                disabled={isLoading}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                aria-label={showPassword ? t('Hide password') : t('Show password')}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </FormControl>
          <FormMessage />
        </FormItem>
      </FormField>

      <div className="flex items-center gap-2">
        <Checkbox id="remember" disabled={isLoading} {...register('rememberSession')} />
        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
          {t('Remember me')}
        </Label>
      </div>

      <Button type="submit" className="w-full" loading={isLoading}>
        {isLoading ? t('Signing in...') : t('Sign in')}
      </Button>
    </form>
  );
}
