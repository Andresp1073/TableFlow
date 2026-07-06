export interface Role {
  id: string;
  code: string;
  name: string;
  description: string | null;
  restaurantId: string | null;
  isSystem: boolean;
  isDefault: boolean;
  priority: number;
  color: string | null;
  icon: string | null;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}
