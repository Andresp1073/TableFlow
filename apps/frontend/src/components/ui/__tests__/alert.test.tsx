import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Alert, AlertTitle, AlertDescription } from '../alert';

describe('Alert', () => {
  it('renders alert with title and description', () => {
    render(
      <Alert>
        <AlertTitle>Warning</AlertTitle>
        <AlertDescription>This is a warning alert.</AlertDescription>
      </Alert>,
    );
    expect(screen.getByText('Warning')).toBeInTheDocument();
    expect(screen.getByText('This is a warning alert.')).toBeInTheDocument();
  });

  it('has role="alert"', () => {
    render(<Alert>Alert</Alert>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('applies variant classes', () => {
    render(<Alert variant="error">Error</Alert>);
    const alert = screen.getByRole('alert');
    expect(alert.className).toContain('border-destructive');
  });
});
