import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { colors } from '@/navigation/colors';

import type { AnalyticsChartPoint, AnalyticsListItem, AnalyticsViewModel } from './buildAnalyticsViewModel';

type AnalyticsTabKey = 'Overview' | 'Insights' | 'Predictions & AI';

type AnalyticsViewProps = {
  storeName: string;
  activeTab: AnalyticsTabKey;
  onTabChange: (tab: AnalyticsTabKey) => void;
  viewModel: AnalyticsViewModel;
  isLoading: boolean;
  error: string | null;
};

const tabs: AnalyticsTabKey[] = ['Overview', 'Insights', 'Predictions & AI'];

export function AnalyticsView({
  storeName,
  activeTab,
  onTabChange,
  viewModel,
  isLoading,
  error,
}: AnalyticsViewProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.content} style={styles.screen} showsVerticalScrollIndicator={false}>
        <View style={styles.heroCard}>
          <Text style={styles.eyebrow}>Analytics</Text>
          <Text style={styles.title}>Current signals, changing patterns, next actions.</Text>
          <Text style={styles.subtitle}>
            Track {storeName} with a simple analytics flow built for sari-sari store decisions on a small screen.
          </Text>
        </View>

        <View style={styles.tabRow}>
          {tabs.map((tab) => {
            const isActive = tab === activeTab;

            return (
              <Pressable
                key={tab}
                onPress={() => onTabChange(tab)}
                style={[styles.tabButton, isActive ? styles.tabButtonActive : undefined]}
              >
                <Text style={[styles.tabButtonText, isActive ? styles.tabButtonTextActive : undefined]}>{tab}</Text>
              </Pressable>
            );
          })}
        </View>

        {error ? (
          <View style={styles.errorCard}>
            <Text style={styles.errorTitle}>Unable to refresh analytics</Text>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {activeTab === 'Overview' ? <OverviewTab viewModel={viewModel} /> : null}
        {activeTab === 'Insights' ? <InsightsTab viewModel={viewModel} isLoading={isLoading} /> : null}
        {activeTab === 'Predictions & AI' ? <PredictionsTab viewModel={viewModel} isLoading={isLoading} /> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function OverviewTab({ viewModel }: { viewModel: AnalyticsViewProps['viewModel'] }) {
  return (
    <View style={styles.sectionStack}>
      <View style={styles.metricGrid}>
        <MetricCard
          label={viewModel.overview.salesToday.label}
          value={viewModel.overview.salesToday.value}
          caption={viewModel.overview.salesToday.caption}
        />
        <MetricCard
          label={viewModel.overview.salesThisMonth.label}
          value={viewModel.overview.salesThisMonth.value}
          caption={viewModel.overview.salesThisMonth.caption}
        />
      </View>

      <TwoColumnLists
        leftTitle="Top Selling"
        leftItems={viewModel.overview.topSelling}
        rightTitle="Low Stock"
        rightItems={viewModel.overview.lowStock}
      />

      <TwoColumnLists
        leftTitle="Fast Moving"
        leftItems={viewModel.overview.fastMoving}
        rightTitle="Slow Moving"
        rightItems={viewModel.overview.slowMoving}
      />
    </View>
  );
}

function InsightsTab({
  viewModel,
  isLoading,
}: {
  viewModel: AnalyticsViewProps['viewModel'];
  isLoading: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      {viewModel.insights.emptyState ? (
        <EmptyStateCard
          title="Insights need more history"
          body={viewModel.insights.emptyState}
          loadingLabel={isLoading ? 'Refreshing local sales data...' : null}
        />
      ) : null}

      <SectionCard title="Sales Trend" subtitle="Daily sales over the last 7 days">
        <MiniBarChart points={viewModel.insights.salesTrend} />
      </SectionCard>

      <SectionCard title="Demand Shift" subtitle="Biggest product movement changes">
        <MiniBarChart points={viewModel.insights.demandTrend} />
      </SectionCard>

      <TwoColumnLists
        leftTitle="Trending Up"
        leftItems={viewModel.insights.risingDemand}
        rightTitle="Trending Down"
        rightItems={viewModel.insights.decliningDemand}
      />
    </View>
  );
}

function PredictionsTab({
  viewModel,
  isLoading,
}: {
  viewModel: AnalyticsViewProps['viewModel'];
  isLoading: boolean;
}) {
  return (
    <View style={styles.sectionStack}>
      {viewModel.predictions.emptyState ? (
        <EmptyStateCard
          title="Predictions are warming up"
          body={viewModel.predictions.emptyState}
          loadingLabel={isLoading ? 'Refreshing local sales data...' : null}
        />
      ) : null}

      <TwoColumnLists
        leftTitle="Demand Forecast"
        leftItems={viewModel.predictions.forecast}
        rightTitle="Restock Soon"
        rightItems={viewModel.predictions.restockSoon}
      />

      <SectionCard title="AI Recommendations" subtitle="Deterministic guidance from local sales patterns">
        <View style={styles.recommendationStack}>
          {viewModel.predictions.recommendations.map((recommendation) => (
            <View key={`${recommendation.title}-${recommendation.body}`} style={styles.recommendationCard}>
              <Text style={styles.recommendationTitle}>{recommendation.title}</Text>
              <Text style={styles.recommendationBody}>{recommendation.body}</Text>
            </View>
          ))}
        </View>
      </SectionCard>
    </View>
  );
}

function MetricCard({ label, value, caption }: { label: string; value: string; caption: string }) {
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricLabel}>{label}</Text>
      <Text style={styles.metricValue}>{value}</Text>
      <Text style={styles.metricCaption}>{caption}</Text>
    </View>
  );
}

function TwoColumnLists({
  leftTitle,
  leftItems,
  rightTitle,
  rightItems,
}: {
  leftTitle: string;
  leftItems: AnalyticsListItem[];
  rightTitle: string;
  rightItems: AnalyticsListItem[];
}) {
  return (
    <View style={styles.listGrid}>
      <SectionCard title={leftTitle}>
        <RankedList items={leftItems} />
      </SectionCard>
      <SectionCard title={rightTitle}>
        <RankedList items={rightItems} />
      </SectionCard>
    </View>
  );
}

function SectionCard({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.sectionCard}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
      {children}
    </View>
  );
}

function RankedList({ items }: { items: AnalyticsListItem[] }) {
  if (items.length === 0) {
    return <Text style={styles.emptyListText}>No local activity yet.</Text>;
  }

  return (
    <View style={styles.rankList}>
      {items.map((item) => (
        <View key={`${item.itemId}-${item.itemName}`} style={styles.rankListItem}>
          <Text style={styles.rankItemName}>{item.itemName}</Text>
          <Text style={styles.rankItemDetail}>{item.detail}</Text>
        </View>
      ))}
    </View>
  );
}

function MiniBarChart({ points }: { points: AnalyticsChartPoint[] }) {
  const maxValue = Math.max(...points.map((point) => point.value), 0);

  if (points.length === 0) {
    return <Text style={styles.emptyListText}>No chart data yet.</Text>;
  }

  return (
    <View style={styles.chartWrap}>
      <View style={styles.chartRow}>
        {points.map((point) => {
          const height = maxValue === 0 ? 6 : Math.max(6, Math.round((point.value / maxValue) * 84));

          return (
            <View key={`${point.label}-${point.displayValue}`} style={styles.chartPoint}>
              <View style={[styles.chartBar, { height }]} />
              <Text style={styles.chartLabel}>{point.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

function EmptyStateCard({
  title,
  body,
  loadingLabel,
}: {
  title: string;
  body: string;
  loadingLabel: string | null;
}) {
  return (
    <View style={styles.emptyStateCard}>
      <Text style={styles.emptyStateTitle}>{title}</Text>
      <Text style={styles.emptyStateBody}>{body}</Text>
      {loadingLabel ? <Text style={styles.emptyStateHint}>{loadingLabel}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  screen: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 120,
  },
  heroCard: {
    borderRadius: 28,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 24,
    gap: 10,
  },
  eyebrow: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  title: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
  },
  subtitle: {
    color: colors.muted,
    fontSize: 15,
    lineHeight: 22,
  },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
  },
  tabButton: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: colors.primaryDeep,
    borderColor: colors.primaryDeep,
  },
  tabButtonText: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  tabButtonTextActive: {
    color: colors.surface,
  },
  errorCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    padding: 16,
    gap: 4,
  },
  errorTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  errorText: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  sectionStack: {
    gap: 16,
  },
  metricGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  metricCard: {
    flex: 1,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 6,
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  metricValue: {
    color: colors.primaryDeep,
    fontSize: 24,
    fontWeight: '800',
  },
  metricCaption: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  listGrid: {
    gap: 12,
  },
  sectionCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 18,
    gap: 10,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  sectionSubtitle: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  rankList: {
    gap: 12,
  },
  rankListItem: {
    gap: 2,
  },
  rankItemName: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  rankItemDetail: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  emptyListText: {
    color: colors.muted,
    fontSize: 13,
    lineHeight: 18,
  },
  chartWrap: {
    paddingTop: 6,
  },
  chartRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    gap: 8,
    minHeight: 110,
  },
  chartPoint: {
    flex: 1,
    alignItems: 'center',
    gap: 8,
  },
  chartBar: {
    width: '100%',
    borderRadius: 999,
    backgroundColor: colors.primary,
    minHeight: 6,
  },
  chartLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  recommendationStack: {
    gap: 10,
  },
  recommendationCard: {
    borderRadius: 16,
    backgroundColor: colors.card,
    padding: 14,
    gap: 4,
  },
  recommendationTitle: {
    color: colors.primaryDeep,
    fontSize: 13,
    fontWeight: '800',
    textTransform: 'uppercase',
  },
  recommendationBody: {
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
    padding: 16,
    gap: 6,
  },
  emptyStateTitle: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  emptyStateBody: {
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  emptyStateHint: {
    color: colors.primaryDeep,
    fontSize: 12,
    fontWeight: '700',
  },
});
