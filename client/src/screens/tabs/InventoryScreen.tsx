import { ClientTabLayout } from '@/components/ClientTabLayout';

export function InventoryScreen() {
  return (
    <ClientTabLayout
      label="Inventory"
      title="Stay close to stock movement."
      subtitle="Use this tab as the client’s working inventory view for product health, low-stock attention, and recent adjustments."
      highlights={['64 tracked SKUs ready', '8 items need restock review', '2 warehouse updates landed today']}
    />
  );
}
