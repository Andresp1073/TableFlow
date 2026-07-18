'use client';

import { t } from '@/lib/i18n';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ExternalLink, Github, FileText } from 'lucide-react';

const APP_VERSION = '1.0.0';
const BUILD_VERSION = process.env['NEXT_PUBLIC_BUILD_VERSION'] ?? 'development';
const NODE_ENV = process.env['NODE_ENV'] ?? 'development';

export function SettingsAbout() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('Application Information')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('Application')}</p>
              <p className="font-medium">TableFlow</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('Version')}</p>
              <p className="font-medium">{APP_VERSION}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('Build')}</p>
              <p className="font-medium font-mono text-xs">{BUILD_VERSION}</p>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('Environment')}</p>
              <Badge variant={NODE_ENV === 'production' ? 'success' : 'secondary'}>
                {NODE_ENV}
              </Badge>
            </div>
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">{t('License')}</p>
              <p className="font-medium">MIT</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t('Resources')}</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="outline" size="sm" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <FileText className="h-3.5 w-3.5 mr-1.5" />
              {t('Documentation')}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
              {t('API Reference')}
            </a>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href="#" target="_blank" rel="noopener noreferrer">
              <Github className="h-3.5 w-3.5 mr-1.5" />
              {t('Source Code')}
            </a>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
