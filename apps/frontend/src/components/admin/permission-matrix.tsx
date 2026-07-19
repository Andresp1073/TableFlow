'use client';
import { t } from '@/lib/i18n';

import { useState, useMemo } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/cn';
import { RISK_LEVEL_COLORS, type PermissionGroup } from '@/lib/admin-types';
import { Search } from 'lucide-react';

interface PermissionMatrixProps {
  groups: PermissionGroup[];
  selectedIds: string[];
  onToggle: (permissionId: string) => void;
  readOnly?: boolean;
}

export function PermissionMatrix({ groups, selectedIds, onToggle, readOnly = false }: PermissionMatrixProps) {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    if (!search) return groups;
    const q = search.toLowerCase();
    return groups
      .map((g) => ({
        ...g,
        permissions: g.permissions.filter(
          (p) =>
            p.code.toLowerCase().includes(q) ||
            p.name.toLowerCase().includes(q) ||
            p.description.toLowerCase().includes(q) ||
            p.resource.toLowerCase().includes(q) ||
            p.action.toLowerCase().includes(q),
        ),
      }))
      .filter((g) => g.permissions.length > 0);
  }, [groups, search]);

  if (groups.length === 0) {
    return <p className="text-sm text-muted-foreground py-4">{t("No permissions found.")}</p>;
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t("Search permissions...")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
          aria-label={t("Search permissions")}
        />
      </div>

      <div className="space-y-6">
        {filtered.map((group) => {
          const allSelected = group.permissions.every((p) => selectedIds.includes(p.id));
          const someSelected = group.permissions.some((p) => selectedIds.includes(p.id));

          return (
            <div key={group.module}>
              <div className="flex items-center gap-2 mb-2">
                <h3 className="text-sm font-semibold capitalize">{group.module}</h3>
                {!readOnly && (
                  <button
                    onClick={() => {
                      const allIds = group.permissions.map((p) => p.id);
                      const action = allSelected ? 'remove' : 'add';
                      for (const id of allIds) {
                        if ((action === 'add') !== selectedIds.includes(id)) {
                          onToggle(id);
                        }
                      }
                    }}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                    >
                      {allSelected ? t('Deselect all') : t('Select all')}
                    </button>
                )}
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {group.permissions.map((permission) => {
                  const isSelected = selectedIds.includes(permission.id);
                  return (
                    <button
                      key={permission.id}
                      onClick={() => !readOnly && onToggle(permission.id)}
                      disabled={readOnly}
                      className={cn(
                        'flex items-start gap-2 rounded-lg border p-3 text-left text-sm transition-colors',
                        isSelected
                          ? 'border-primary bg-primary/5 ring-1 ring-primary'
                          : 'border-border hover:border-muted-foreground/30',
                        readOnly && 'cursor-default',
                      )}
                      role={readOnly ? undefined : 'checkbox'}
                      aria-checked={isSelected}
                      aria-label={`${permission.name} - ${permission.code}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-medium truncate">{permission.name}</span>
                          <Badge
                            variant="outline"
                            className={cn('text-[10px] px-1.5 py-0', RISK_LEVEL_COLORS[permission.riskLevel])}
                          >
                            {permission.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono truncate">
                          {permission.code}
                        </p>
                        {permission.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {permission.description}
                          </p>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
