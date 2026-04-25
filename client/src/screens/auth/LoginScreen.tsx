import { AuthField } from '@/components/AuthField';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export function LoginScreen() {
  const { showSignUp, signIn } = useAuth();

  return (
    <AuthLayout
      badge="Client Access"
      title="Welcome back"
      subtitle="Sign in to open the client workspace, check the dashboard, and stay on top of inventory and analytics."
      submitLabel="Sign In"
      alternateLabel="Need an account? Create one"
      onSubmit={() =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            signIn();
            resolve();
          }, 350);
        })
      }
      onAlternatePress={showSignUp}
    >
      <AuthField label="Email" placeholder="you@example.com" />
      <AuthField label="Password" placeholder="••••••••" secureTextEntry />
    </AuthLayout>
  );
}
