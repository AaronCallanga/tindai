import { useEffect, useMemo, useState } from 'react';

import { AnalyticsView } from '@/features/analytics/AnalyticsView';
import { loadAnalyticsSalesRows } from '@/features/analytics/analyticsRepository';
import { buildAnalyticsViewModel, type AnalyticsSalesRow } from '@/features/analytics/buildAnalyticsViewModel';
import { useLocalData } from '@/features/local-data/LocalDataContext';

type AnalyticsTabKey = 'Overview' | 'Insights' | 'Predictions & AI';

export function AnalyticsScreen() {
  const { store, inventoryItems } = useLocalData();
  const [activeTab, setActiveTab] = useState<AnalyticsTabKey>('Overview');
  const [salesRows, setSalesRows] = useState<AnalyticsSalesRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isDisposed = false;

    async function load() {
      if (!store) {
        setSalesRows([]);
        setError(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        const rows = await loadAnalyticsSalesRows(store.id);

        if (!isDisposed) {
          setSalesRows(rows);
        }
      } catch (caughtError) {
        if (!isDisposed) {
          setError(caughtError instanceof Error ? caughtError.message : 'Unable to load analytics.');
          setSalesRows([]);
        }
      } finally {
        if (!isDisposed) {
          setIsLoading(false);
        }
      }
    }

    void load();

    return () => {
      isDisposed = true;
    };
  }, [inventoryItems, store]);

  const viewModel = useMemo(
    () =>
      buildAnalyticsViewModel({
        currencyCode: store?.currencyCode ?? 'PHP',
        timezone: store?.timezone ?? 'Asia/Manila',
        inventoryItems,
        salesRows,
      }),
    [inventoryItems, salesRows, store?.currencyCode, store?.timezone],
  );

  return (
    <AnalyticsView
      activeTab={activeTab}
      error={error}
      isLoading={isLoading}
      onTabChange={setActiveTab}
      storeName={store?.name ?? 'your store'}
      viewModel={viewModel}
    />
  );
}
