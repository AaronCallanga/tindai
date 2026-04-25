import { useAuth } from '@/context/AuthContext';
import { HomeTabs } from '@/screens/HomeTabs';
import { LoginScreen } from '@/screens/auth/LoginScreen';
import { SignUpScreen } from '@/screens/auth/SignUpScreen';
import { OnboardingAnalyticsScreen } from '@/screens/onboarding/OnboardingAnalyticsScreen';
import { OnboardingDashboardScreen } from '@/screens/onboarding/OnboardingDashboardScreen';
import { OnboardingInventoryScreen } from '@/screens/onboarding/OnboardingInventoryScreen';

export function RootNavigator() {
  const { activeRoute } = useAuth();

  if (activeRoute.kind === 'onboarding') {
    if (activeRoute.step === 1) {
      return <OnboardingInventoryScreen />;
    }

    if (activeRoute.step === 2) {
      return <OnboardingDashboardScreen />;
    }

    return <OnboardingAnalyticsScreen />;
  }

  if (activeRoute.kind === 'auth') {
    return activeRoute.screen === 'login' ? <LoginScreen /> : <SignUpScreen />;
  }

  return <HomeTabs />;
}
