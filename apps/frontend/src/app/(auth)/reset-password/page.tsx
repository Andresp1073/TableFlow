import { Suspense } from 'react';
import { Spinner } from '@/components/ui/spinner';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';

function ResetPasswordFallback() {
  return (
    <div className="flex h-48 items-center justify-center">
      <Spinner size="lg" />
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<ResetPasswordFallback />}>
      <ResetPasswordForm />
    </Suspense>
  );
}
