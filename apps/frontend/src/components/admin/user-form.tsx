'use client';
import { t } from '@/lib/i18n';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import type { AdminRole, CreateUserDto, UpdateUserDto } from '@/lib/admin-types';

interface UserFormProps {
  roles: AdminRole[];
  initialData?: Partial<CreateUserDto>;
  onSubmit: (data: CreateUserDto | UpdateUserDto) => void;
  isSubmitting?: boolean;
  mode: 'create' | 'edit';
}

export function UserForm({ roles, initialData, onSubmit, isSubmitting, mode }: UserFormProps) {
  const [email, setEmail] = useState(initialData?.email ?? '');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState(initialData?.firstName ?? '');
  const [lastName, setLastName] = useState(initialData?.lastName ?? '');
  const [phone, setPhone] = useState(initialData?.phone ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(initialData?.roleIds ?? []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      onSubmit({
        email,
        password,
        firstName,
        lastName,
        phone: phone || undefined,
        roleIds: selectedRoles.length > 0 ? selectedRoles : undefined,
      } as CreateUserDto);
    } else {
      const data: UpdateUserDto = {};
      if (email !== initialData?.email) data.email = email;
      if (firstName !== initialData?.firstName) data.firstName = firstName;
      if (lastName !== initialData?.lastName) data.lastName = lastName;
      if (phone !== (initialData?.phone ?? '')) data.phone = phone || null;
      onSubmit(data);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-lg">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="firstName">First Name</Label>
          <Input id="firstName" value={firstName} onChange={(e) => setFirstName(e.target.value)} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="lastName">Last Name</Label>
          <Input id="lastName" value={lastName} onChange={(e) => setLastName(e.target.value)} required />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="phone">Phone (optional)</Label>
        <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} />
      </div>

      {mode === 'create' && (
        <div className="space-y-2">
          <Label htmlFor="roles">Roles</Label>
          <select
            id="roles"
            multiple
            onChange={(e) => {
              const options = (e.target as HTMLSelectElement).options;
              const selected: string[] = [];
              for (let i = 0; i < options.length; i++) {
                const option = options[i];
                if (option && option.selected) selected.push(option.value);
              }
              setSelectedRoles(selected);
            }}
            className="flex h-20 w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm"
          >
            {roles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create User' : 'Update User'}
        </Button>
      </div>
    </form>
  );
}
