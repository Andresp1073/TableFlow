import { t } from '@/lib/i18n';
import Link from 'next/link';
import { Clock, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function SessionExpiredPage() {
  return (
    <Card>
      <CardContent className="p-6 text-center space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-warning/10">
          <Clock className="h-6 w-6 text-warning" />
        </div>
        <div className="space-y-1.5">
          <h1 className="text-xl font-semibold tracking-tight">Session expired</h1>
          <p className="text-sm text-muted-foreground">
            Your session has expired due to inactivity. Please sign in again to continue.
          </p>
        </div>
        <Button asChild>
          <Link href="/login">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Sign in again
          </Link>
        </Button>
      </CardContent>
    </Card>
  );
}
