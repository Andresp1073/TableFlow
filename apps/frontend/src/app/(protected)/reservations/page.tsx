import { CalendarCheck } from 'lucide-react';
import { PlaceholderPage } from '@/app/(protected)/placeholder-page';

export default function ReservationsPage() {
  return (
    <PlaceholderPage
      title="Reservations"
      description="View and manage all reservations across your restaurants."
      icon={<CalendarCheck className="h-5 w-5" />}
    />
  );
}
