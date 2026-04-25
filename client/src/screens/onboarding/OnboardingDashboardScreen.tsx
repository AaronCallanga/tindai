import { useAuth } from '@/context/AuthContext';
import { OnboardingLayout } from '@/components/OnboardingLayout';

export function OnboardingDashboardScreen() {
  const { nextOnboardingStep, skipOnboarding } = useAuth();

  return (
    <OnboardingLayout
      step={2}
      eyebrow="Stay in Control"
      title="See the business pulse at a glance."
      description="Use the dashboard as the focal point of the app so clients can read what matters right away without digging through menus."
      panelTitle="One warm, central control panel"
      panelBody="Dashboard becomes the operational center: alerts, daily movement, and recent activity show up together in a way that feels immediate."
      points={['Review the day’s priorities faster', 'Surface operational alerts early', 'Keep Inventory and Analytics one tap away']}
      nextLabel="Next"
      onNext={nextOnboardingStep}
      onSkip={skipOnboarding}
    />
  );
}
