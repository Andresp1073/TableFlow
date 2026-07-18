import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { t } from '@/lib/i18n';

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center">
      <p className="text-6xl font-bold text-muted-foreground">404</p>
      <h1 className="mt-4 text-xl font-semibold">{t('Page not found')}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {t('The page you are looking for does not exist or has been moved.')}
      </p>
      <Button asChild className="mt-6">
        <Link href="/dashboard">{t('Go to Dashboard')}</Link>
      </Button>
    </div>
  );
}
