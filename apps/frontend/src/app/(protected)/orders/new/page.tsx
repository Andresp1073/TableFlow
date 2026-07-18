'use client';
import { t } from '@/lib/i18n';

import { useRouter } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRestaurant } from '@/providers/restaurant-provider';
import { useCreateOrder } from '@/hooks/use-orders';
import { OrderForm } from '@/components/orders/order-form';
import type { CreateOrderInput } from '@/lib/sales-types';

export default function NewOrderPage() {
  const router = useRouter();
  const { current } = useRestaurant();
  const restaurantId = current?.id ?? 'default';
  const createOrder = useCreateOrder();

  async function handleSubmit(data: CreateOrderInput) {
    try {
      const order = await createOrder.mutateAsync({ restaurantId, data });
      router.push(`/orders/${order.id}`);
    } catch {
      // Error handled by mutation
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon-sm" onClick={() => router.back()} aria-label={t("Go back")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">New Order</h1>
          <p className="text-sm text-muted-foreground">Create a new customer order</p>
        </div>
      </div>
      <OrderForm onSubmit={handleSubmit} isSubmitting={createOrder.isPending} />
    </div>
  );
}
