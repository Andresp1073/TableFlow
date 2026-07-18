import { t } from '@/lib/i18n';
import Link from 'next/link';
import { ShieldX } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function UnauthorizedPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10">
        <ShieldX className="h-8 w-8 text-destructive" />
      </div>
      <h1 className="mt-6 text-2xl font-bold">{t('401 - Unauthorized')}</h1>
      <p className="mt-2 text-sm text-muted-foreground max-w-md">
        {t('You need to be authenticated to access this page. Please sign in to continue.')}
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/login">{t('Sign in')}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/">{t('Go home')}</Link>
        </Button>
      </div>
    </div>
  );
}
