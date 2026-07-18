import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PaymentForm } from '../payment-form';

describe('PaymentForm', () => {
  it('shows total amount', () => {
    render(
      <PaymentForm
        total={28.06}
        isProcessing={false}
        onProcessPayment={vi.fn()}
        paymentResult={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('$28.06')).toBeInTheDocument();
  });

  it('shows payment method buttons', () => {
    render(
      <PaymentForm
        total={28.06}
        isProcessing={false}
        onProcessPayment={vi.fn()}
        paymentResult={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Credit Card')).toBeInTheDocument();
    expect(screen.getByText('Cash')).toBeInTheDocument();
  });

  it('shows tip options', () => {
    render(
      <PaymentForm
        total={28.06}
        isProcessing={false}
        onProcessPayment={vi.fn()}
        paymentResult={null}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('No Tip')).toBeInTheDocument();
    expect(screen.getByText('10%')).toBeInTheDocument();
    expect(screen.getByText('15%')).toBeInTheDocument();
  });

  it('shows success state after payment', () => {
    render(
      <PaymentForm
        total={28.06}
        isProcessing={false}
        onProcessPayment={vi.fn()}
        paymentResult={{
          orderId: 'order-1',
          status: 'completed',
          paymentStatus: 'paid',
          paymentTransactionId: 'txn-1234567890',
          total: 28.06,
          paid: 32.27,
          tip: 4.21,
          change: 0,
          providerReference: 'ref-123',
        }}
        onClose={vi.fn()}
      />,
    );
    expect(screen.getByText('Payment Successful')).toBeInTheDocument();
    expect(screen.getByText('$32.27')).toBeInTheDocument();
  });
});
