import { t } from '@/lib/i18n';
import { PageWrapper } from '@/components/layout/page-wrapper';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface PlaceholderPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export function PlaceholderPage({ title, description, icon }: PlaceholderPageProps) {
  return (
    <PageWrapper title={title} description={description}>
      <Card>
        <CardHeader>
          <div className="flex items-center gap-3">
            {icon && <div className="text-muted-foreground">{icon}</div>}
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>
                This page is under construction. Content will be implemented in a future phase.
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex h-48 items-center justify-center rounded-lg border-2 border-dashed border-muted-foreground/20">
            <p className="text-sm text-muted-foreground">
              {title} module coming soon
            </p>
          </div>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}
