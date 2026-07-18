'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { KeyRound, LogOut } from 'lucide-react';

export function SettingsSecurity() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Password</CardTitle>
          <CardDescription>Manage your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Password</p>
              <p className="text-sm text-muted-foreground">
                Last changed: Unknown (use authentication settings to change)
              </p>
            </div>
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/settings" target="_blank" rel="noopener noreferrer">
                <KeyRound className="h-3.5 w-3.5 mr-1.5" />
                Change Password
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Two-Factor Authentication</CardTitle>
          <CardDescription>Enhance your account security with 2FA.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                Add an extra layer of security to your account.
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">Coming Soon</Badge>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Active Sessions</CardTitle>
          <CardDescription>Manage your active login sessions.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <p className="text-sm font-medium">Current Session</p>
              <p className="text-sm text-muted-foreground">
                You are currently logged in to this device.
              </p>
            </div>
            <Badge variant="success" className="text-xs">Active</Badge>
          </div>
          <div className="mt-4">
            <Button variant="outline" size="sm" asChild>
              <a href="/admin/settings" target="_blank" rel="noopener noreferrer">
                <LogOut className="h-3.5 w-3.5 mr-1.5" />
                Session Management
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
