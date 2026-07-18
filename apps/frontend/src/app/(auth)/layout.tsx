import Link from 'next/link';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30">
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-12">
        <Link href="/login" className="mb-8">
          <span className="text-xl font-bold">TableFlow</span>
        </Link>

        <div className="w-full max-w-sm">
          {children}
        </div>

        <p className="mt-8 text-xs text-muted-foreground">
          &copy; {new Date().getFullYear()} TableFlow. All rights reserved.
        </p>
      </div>
    </div>
  );
}
