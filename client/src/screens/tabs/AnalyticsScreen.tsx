import { ClientTabLayout } from '@/components/ClientTabLayout';

export function AnalyticsScreen() {
  return (
    <ClientTabLayout
      label="Analytics"
      title="Watch trends before they become problems."
      subtitle="Use analytics for client reporting, movement patterns, and the signals that explain how inventory performance is shifting."
      highlights={['Trend summaries for recent movement', 'Demand shifts and top movers', 'Performance signals that support better decisions']}
    />
  );
}
