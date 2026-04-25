import { AuthField } from '@/components/AuthField';
import { AuthLayout } from '@/components/AuthLayout';
import { useAuth } from '@/context/AuthContext';

export function SignUpScreen() {
  const { showLogin, signIn } = useAuth();

  return (
    <AuthLayout
      badge="Create Account"
      title="Set up your client access"
      subtitle="Create a starter account for this flow, then continue directly into the client dashboard experience."
      submitLabel="Create Account"
      alternateLabel="Already have an account? Sign in"
      onSubmit={() =>
        new Promise<void>((resolve) => {
          setTimeout(() => {
            signIn();
            resolve();
          }, 350);
        })
      }
      onAlternatePress={showLogin}
    >
      <AuthField label="Full Name" placeholder="Your name" />
      <AuthField label="Email" placeholder="you@example.com" />
      <AuthField label="Password" placeholder="Create a password" secureTextEntry />
    </AuthLayout>
  );
}
