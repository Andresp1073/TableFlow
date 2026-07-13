export interface CustomerSummary {
  id: string;
  restaurantId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}
