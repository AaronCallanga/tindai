import { ClientTabLayout } from '@/components/ClientTabLayout';

export function DashboardScreen() {
  return (
    <ClientTabLayout
      label="Dashboard"
      title="Run the day from one center view."
      subtitle="This is the focal tab of the client shell, built to surface today’s movement, alerts, and the fastest path to action."
      highlights={['Daily snapshot across operations', 'Low-stock and activity alerts in one place', 'Fast path into inventory and analytics']}
    />
  );
}
