'use client';

import { useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { OrderSummary } from './order-summary';
import { PaymentForm } from './payment-form';
import { LoadingState } from '@/components/ui/loading-state';
import type { SalesOrder, OrderItem, CreateOrderInput, CreateOrderItemInput, SubmitOrderInput, ProcessPaymentInput, SubmitOrderResult, PaymentResult } from '@/lib/sales-types';

interface PosInterfaceProps {
  currentOrder: SalesOrder | null;
  orderItems: OrderItem[];
  isCreating: boolean;
  isSubmitting: boolean;
  isProcessingPayment: boolean;
  submitResult: SubmitOrderResult | null;
  paymentResult: PaymentResult | null;
  error: string | null;
  onAddItem: (item: CreateOrderItemInput) => void;
  onRemoveItem: (itemId: string) => void;
  onClearOrder: () => void;
  onCreateOrder: (data: CreateOrderInput) => void;
  onSubmitOrder: (data: SubmitOrderInput) => void;
  onProcessPayment: (data: ProcessPaymentInput) => void;
  onReset: () => void;
}

const QUICK_ITEMS = [
  { id: 'burger', name: 'Burger', price: 12.99, station: 'grill' },
  { id: 'fries', name: 'Fries', price: 4.99, station: 'preparation' },
  { id: 'pizza', name: 'Pizza', price: 14.99, station: 'grill' },
  { id: 'salad', name: 'Caesar Salad', price: 9.99, station: 'cold' },
  { id: 'pasta', name: 'Pasta', price: 11.99, station: 'grill' },
  { id: 'soda', name: 'Soft Drink', price: 2.49, station: 'bar' },
  { id: 'beer', name: 'Beer', price: 5.99, station: 'bar' },
  { id: 'wine', name: 'Glass of Wine', price: 8.99, station: 'bar' },
  { id: 'dessert', name: 'Dessert', price: 6.99, station: 'dessert' },
  { id: 'coffee', name: 'Coffee', price: 3.49, station: 'bar' },
  { id: 'sandwich', name: 'Sandwich', price: 10.99, station: 'preparation' },
  { id: 'soup', name: 'Soup', price: 5.99, station: 'grill' },
];

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'grill', label: 'Grill' },
  { id: 'bar', label: 'Bar' },
  { id: 'cold', label: 'Cold' },
  { id: 'preparation', label: 'Prep' },
];

export function PosInterface({
  currentOrder,
  orderItems,
  isCreating,
  isSubmitting,
  isProcessingPayment,
  submitResult,
  paymentResult,
  error,
  onAddItem,
  onRemoveItem,
  onClearOrder,
  onCreateOrder,
  onSubmitOrder,
  onProcessPayment,
  onReset,
}: PosInterfaceProps) {
  const [category, setCategory] = useState('all');
  const [showPayment, setShowPayment] = useState(false);
  const [tableId, setTableId] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerCount, setCustomerCount] = useState('');

  const filteredItems = category === 'all'
    ? QUICK_ITEMS
    : QUICK_ITEMS.filter((item) => item.station === category);

  function handleAddQuickItem(item: typeof QUICK_ITEMS[number]) {
    if (currentOrder) {
      onAddItem({
        menuItemId: item.id,
        menuItemName: item.name,
        quantity: 1,
        unitPrice: item.price,
        stationId: item.station,
      });
    }
  }

  function handleCheckout() {
    if (currentOrder) {
      onSubmitOrder({ kitchenId: 'kitchen-1' });
    }
  }

  function handleProcessPayment(data: ProcessPaymentInput) {
    if (currentOrder) {
      onProcessPayment(data);
    }
  }

  function handleNewOrder() {
    onCreateOrder({
      source: 'pos',
      tableId: tableId || null,
      customerName: customerName || null,
      customerCount: customerCount ? parseInt(customerCount, 10) : null,
    });
  }

  if (paymentResult) {
    return (
      <div className="max-w-md mx-auto py-8">
        <PaymentForm
          total={0}
          isProcessing={false}
          onProcessPayment={() => {}}
          paymentResult={paymentResult}
          onClose={onReset}
        />
      </div>
    );
  }

  const showNewOrderForm = !currentOrder && !isCreating;

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-4">
        {showNewOrderForm ? (
          <Card>
            <CardHeader>
              <CardTitle>New POS Order</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="space-y-2">
                  <Label htmlFor="pos-table">Table</Label>
                  <Input id="pos-table" value={tableId} onChange={(e) => setTableId(e.target.value)} placeholder="e.g. T-05" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos-customer">Customer</Label>
                  <Input id="pos-customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} placeholder="Walk-in" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pos-guests">Guests</Label>
                  <Input id="pos-guests" type="number" min={1} value={customerCount} onChange={(e) => setCustomerCount(e.target.value)} />
                </div>
              </div>
              <Button onClick={handleNewOrder} className="w-full" disabled={isCreating}>
                {isCreating ? <LoadingState message="Creating..." /> : 'Start New Order'}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card>
              <CardHeader>
                <CardTitle>Menu Items</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="all" onValueChange={setCategory}>
                  <TabsList className="mb-4">
                    {CATEGORIES.map((cat) => (
                      <TabsTrigger key={cat.id} value={cat.id}>{cat.label}</TabsTrigger>
                    ))}
                  </TabsList>
                  <TabsContent value={category}>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {filteredItems.map((item) => (
                        <Button
                          key={item.id}
                          variant="outline"
                          className="h-20 flex-col gap-1"
                          onClick={() => handleAddQuickItem(item)}
                          type="button"
                        >
                          <span className="text-sm font-medium">{item.name}</span>
                          <span className="text-xs text-muted-foreground">${item.price.toFixed(2)}</span>
                        </Button>
                      ))}
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>

            {error && (
              <Card className="border-destructive">
                <CardContent className="pt-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </div>

      <div className="space-y-4">
        <OrderSummary
          items={orderItems}
          onRemoveItem={onRemoveItem}
          onClear={onClearOrder}
        />

        {currentOrder && currentOrder.items.length > 0 && (
          <div className="flex flex-col gap-2">
            <Button
              className="w-full"
              onClick={handleCheckout}
              disabled={isSubmitting || submitResult !== null}
            >
              {isSubmitting ? (
                <LoadingState message="Submitting..." />
              ) : submitResult ? (
                'Submitted to Kitchen'
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  Submit Order
                </>
              )}
            </Button>

            {submitResult && (
              <Button
                className="w-full"
                variant="primary"
                onClick={() => setShowPayment(true)}
              >
                Proceed to Payment
              </Button>
            )}
          </div>
        )}
      </div>

      <Dialog open={showPayment} onOpenChange={setShowPayment}>
        <DialogContent className="sm:max-w-md">
          <DialogTitle>Payment</DialogTitle>
          <DialogDescription>Process payment for this order</DialogDescription>
          <PaymentForm
            total={currentOrder?.total ?? 0}
            isProcessing={isProcessingPayment}
            onProcessPayment={handleProcessPayment}
            paymentResult={paymentResult}
            onClose={() => {
              setShowPayment(false);
              onReset();
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
