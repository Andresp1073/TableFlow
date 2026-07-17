'use client';

import { createContext, useContext, forwardRef, useId } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/cn';
import { Label } from '@/components/ui/label';

interface FormFieldContextValue {
  id: string;
  name?: string;
  error?: string;
  required?: boolean;
}

const FormFieldContext = createContext<FormFieldContextValue | undefined>(undefined);

function useFormField() {
  const context = useContext(FormFieldContext);
  if (!context) throw new Error('useFormField must be used within <FormField>');
  return context;
}

interface FormFieldProps {
  children: React.ReactNode;
  name?: string;
  error?: string;
  required?: boolean;
}

function FormField({ children, name, error, required }: FormFieldProps) {
  const id = useId();
  return (
    <FormFieldContext.Provider value={{ id, name, error, required }}>
      {children}
    </FormFieldContext.Provider>
  );
}

const FormItem = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, ...props }, ref) => {
  useFormField();
  return <div ref={ref} className={cn('space-y-1.5', className)} {...props} />;
});
FormItem.displayName = 'FormItem';

type FormLabelProps = React.HTMLAttributes<HTMLLabelElement> & {
  required?: boolean;
};

const FormLabel = forwardRef<HTMLLabelElement, FormLabelProps>(({ className, children, ...props }, ref) => {
  const { id, error, required } = useFormField();
  return (
    <Label
      ref={ref}
      htmlFor={id}
      className={cn(error && 'text-destructive', className)}
      {...props}
    >
      {children}
      {required && <span className="ml-1 text-destructive" aria-hidden="true">*</span>}
    </Label>
  );
});
FormLabel.displayName = 'FormLabel';

const FormControl = forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ ...props }, ref) => {
  const { id, error } = useFormField();
  return (
    <Slot
      ref={ref}
      id={id}
      aria-invalid={!!error}
      aria-describedby={error ? `${id}-error` : undefined}
      {...props}
    />
  );
});
FormControl.displayName = 'FormControl';

const FormDescription = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, ...props }, ref) => {
    const { id } = useFormField();
    return (
      <p
        ref={ref}
        id={`${id}-description`}
        className={cn('text-xs text-muted-foreground', className)}
        {...props}
      />
    );
  },
);
FormDescription.displayName = 'FormDescription';

const FormMessage = forwardRef<HTMLParagraphElement, React.HTMLAttributes<HTMLParagraphElement>>(
  ({ className, children, ...props }, ref) => {
    const { id, error } = useFormField();
    const body = error ?? children;
    if (!body) return null;
    return (
      <p
        ref={ref}
        id={`${id}-error`}
        role="alert"
        className={cn('text-xs font-medium text-destructive', className)}
        {...props}
      >
        {body}
      </p>
    );
  },
);
FormMessage.displayName = 'FormMessage';

function FormRequiredIndicator({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span className={cn('text-destructive', className)} aria-hidden="true" {...props}>
      *
    </span>
  );
}

export {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormRequiredIndicator,
  useFormField,
};
