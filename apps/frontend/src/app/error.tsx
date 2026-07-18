'use client';

import { ErrorState } from '@/components/ui/error-state';
import { t } from '@/lib/i18n';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <ErrorState
        title={t('Something went wrong')}
        message={error.message ?? t('An unexpected error occurred. Please try again.')}
        onRetry={reset}
      />
    </div>
  );
}
