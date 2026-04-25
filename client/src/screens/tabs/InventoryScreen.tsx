import { ClientTabLayout } from '@/components/ClientTabLayout';

export function InventoryScreen() {
  return (
    <ClientTabLayout
      label="Paninda"
      title="Dito mo mababantayan ang paninda."
      subtitle="Makikita mo rito ang bilang, malapit maubos, at mga huling galaw."
      highlights={['Handa na ang listahan ng paninda', 'May mga produktong malapit maubos', 'May bagong galaw ngayong araw']}
    />
  );
}
