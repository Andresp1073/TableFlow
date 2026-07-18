import Link from 'next/link';
import { t } from '@/lib/i18n';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/login" className="mb-8">
          <span className="text-xl font-bold">{t('TableFlow')}</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          {t('© {year} TableFlow. All rights reserved.', { year: new Date().getFullYear() })}
        </p>
      </div>
    </div>
  );
}
