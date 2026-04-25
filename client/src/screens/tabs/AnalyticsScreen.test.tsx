import { act, createElement } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import TestRenderer from 'react-test-renderer';

(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

let consoleErrorSpy: ReturnType<typeof vi.spyOn>;
const originalConsoleError = console.error;
const mockedStore = {
  id: 'store-1',
  ownerId: 'user-1',
  name: 'Nena Store',
  currencyCode: 'PHP',
  timezone: 'Asia/Manila',
  updatedAt: '2026-04-25T00:00:00.000Z',
};
const mockedInventoryItems = [
  {
    id: 'item-coke',
    storeId: 'store-1',
    name: 'Coke Mismo',
    aliases: ['coke'],
    unit: 'pcs',
    price: 20,
    currentStock: 4,
    lowStockThreshold: 5,
    updatedAt: '2026-04-25T00:00:00.000Z',
  },
];
const mockedRefresh = vi.fn();
const mockedSubmitLocalCommand = vi.fn();

vi.mock('react-native', () => ({
  Pressable: ({ children, ...props }: { children: React.ReactNode }) => createElement('mock-pressable', props, children),
  ScrollView: ({ children }: { children: React.ReactNode }) => createElement('mock-scroll-view', null, children),
  StyleSheet: {
    create: <T,>(styles: T) => styles,
  },
  Text: ({ children }: { children: React.ReactNode }) => createElement('mock-text', null, children),
  View: ({ children, ...props }: { children: React.ReactNode }) => createElement('mock-view', props, children),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) => createElement('safe-area-view', null, children),
}));

vi.mock('@/navigation/colors', () => ({
  colors: {
    background: '#FFF8E7',
    border: '#D9D1C4',
    card: '#F8EFD8',
    muted: '#6D675D',
    primary: '#1F7A63',
    primaryDeep: '#145746',
    secondary: '#F2C94C',
    surface: '#FFFDF5',
    text: '#2F2F2F',
  },
}));

vi.mock('@/features/local-data/LocalDataContext', () => ({
  useLocalData: () => ({
    store: mockedStore,
    inventoryItems: mockedInventoryItems,
    isLoading: false,
    error: null,
    refresh: mockedRefresh,
    submitLocalCommand: mockedSubmitLocalCommand,
  }),
}));

vi.mock('@/features/analytics/analyticsRepository', () => ({
  loadAnalyticsSalesRows: vi.fn(async () => []),
}));

import { AnalyticsScreen } from './AnalyticsScreen';

function findTextNodes(tree: TestRenderer.ReactTestRenderer, text: string) {
  return tree.root.findAll(
    (node) =>
      String(node.type) === 'mock-text' &&
      node.children.some((child) => typeof child === 'string' && child.includes(text)),
  );
}

function findPressable(tree: TestRenderer.ReactTestRenderer, text: string) {
  return tree.root.find(
    (node) =>
      String(node.type) === 'mock-pressable' &&
      node.findAll(
        (child) =>
          String(child.type) === 'mock-text' &&
          child.children.some((grandChild) => typeof grandChild === 'string' && grandChild.includes(text)),
      ).length > 0,
  );
}

describe('AnalyticsScreen', () => {
  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation((message: unknown, ...args: unknown[]) => {
      if (typeof message === 'string' && message.includes('react-test-renderer is deprecated')) {
        return;
      }

      originalConsoleError(message, ...args);
    });
  });

  afterEach(() => {
    consoleErrorSpy?.mockRestore();
  });

  it('defaults to overview and switches to predictions when the sub-tab is pressed', async () => {
    let tree!: TestRenderer.ReactTestRenderer;

    await act(async () => {
      tree = TestRenderer.create(createElement(AnalyticsScreen));
      await Promise.resolve();
    });

    expect(findTextNodes(tree, 'Overview')).not.toHaveLength(0);
    expect(findTextNodes(tree, 'Predictions & AI')).not.toHaveLength(0);
    expect(findTextNodes(tree, 'Restock Soon')).toHaveLength(0);

    await act(async () => {
      findPressable(tree, 'Predictions & AI').props.onPress();
    });

    expect(findTextNodes(tree, 'Restock Soon')).not.toHaveLength(0);
  });
});
