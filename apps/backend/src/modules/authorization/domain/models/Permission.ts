export interface Permission {
  id: string;
  code: string;
  name: string;
  description: string;
  module: string;
  resource: string;
  action: string;
  riskLevel: string;
  isSystem: boolean;
  createdAt: Date;
  updatedAt: Date;
}
