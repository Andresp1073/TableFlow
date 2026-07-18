import { Card, CardContent } from '@/components/ui/card';
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  return (
    <Card>
      <CardContent className="p-6">
        <LoginForm />
      </CardContent>
    </Card>
  );
}
