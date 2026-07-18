import { t } from '@/lib/i18n';
import Link from 'next/link';
import { Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-warning/10">
        <Lock className="h-8 w-8 text-warning" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t('403 - Forbidden')}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {t('You do not have permission to access this page. Please contact your administrator if you believe this is an error.')}
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/dashboard">{t('Go to Dashboard')}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t('Go home')}</Link>
        </Button>
      </div>
    </div>
  );
}
