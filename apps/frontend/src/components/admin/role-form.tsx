'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import type { CreateRoleDto, UpdateRoleDto, AdminRole } from '@/lib/admin-types';

interface RoleFormProps {
  initialData?: AdminRole;
  onSubmit: (data: CreateRoleDto | UpdateRoleDto) => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

export function RoleForm({ initialData, onSubmit, isSubmitting, mode }: RoleFormProps) {
  const [code, setCode] = useState(initialData?.code ?? '');
  const [name, setName] = useState(initialData?.name ?? '');
  const [description, setDescription] = useState(initialData?.description ?? '');
  const [priority, setPriority] = useState(initialData?.priority?.toString() ?? '0');
  const [color, setColor] = useState(initialData?.color ?? '');
  const [icon, setIcon] = useState(initialData?.icon ?? '');
  const [isDefault, setIsDefault] = useState(initialData?.isDefault ?? false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      onSubmit({
        code,
        name,
        description: description || undefined,
        priority: Number(priority) || 0,
        color: color || undefined,
        icon: icon || undefined,
        isDefault,
      } as CreateRoleDto);
    } else {
      const data: UpdateRoleDto = {};
      if (name !== initialData?.name) data.name = name;
      if (description !== (initialData?.description ?? '')) data.description = description || null;
      if (Number(priority) !== initialData?.priority) data.priority = Number(priority) || 0;
      if (color !== (initialData?.color ?? '')) data.color = color || null;
      if (icon !== (initialData?.icon ?? '')) data.icon = icon || null;
      if (isDefault !== initialData?.isDefault) data.isDefault = isDefault;
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="code">{t('Code')}</Label>
          <Input
            id="code"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            required
            placeholder={t("e.g., restaurant_manager")}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="name">{t('Name')}</Label>
        <Input
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder={t("e.g., Restaurant Manager")}
        />
      </div>

      <div className="space-y-2">
          <Label htmlFor="description">{t('Description')}</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="priority">{t('Priority')}</Label>
          <Input
            id="priority"
            type="number"
            min={0}
            max={9999}
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="color">{t('Color (optional)')}</Label>
          <Input id="color" value={color} onChange={(e) => setColor(e.target.value)} placeholder={t("#000000")} />
        </div>
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="icon">{t('Icon (optional)')}</Label>
          <Input id="icon" value={icon} onChange={(e) => setIcon(e.target.value)} />
        </div>
      )}

      <div className="flex items-center gap-3">
        <Switch id="isDefault" checked={isDefault} onCheckedChange={setIsDefault} />
          <Label htmlFor="isDefault">{t('Default role (auto-assigned to new users)')}</Label>
      </div>

      {initialData?.isSystem && (
        <p className="text-sm text-amber-600 dark:text-amber-400">
          {t('This is a system role. Some properties cannot be modified.')}
        </p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting || initialData?.isSystem}>
          {isSubmitting ? t('Saving...') : mode === 'create' ? t('Create Role') : t('Update Role')}
        </Button>
      </div>
    </form>
  );
}
