import { describe, expect, it, vi } from 'vitest';

const { mockCreateBottomTabNavigator } = vi.hoisted(() => ({
  mockCreateBottomTabNavigator: vi.fn(() => ({
    Navigator: 'mock-navigator',
    Screen: 'mock-screen',
  })),
}));

vi.mock('@react-navigation/bottom-tabs', () => ({
  createBottomTabNavigator: mockCreateBottomTabNavigator,
}));

vi.mock('@expo/vector-icons', () => ({
  Ionicons: () => null,
}));

vi.mock('react-native', () => ({
  StyleSheet: {
    create: <T,>(styles: T) => styles,
  },
  View: 'mock-view',
}));

vi.mock('@/screens/tabs/AnalyticsScreen', () => ({
  AnalyticsScreen: () => null,
}));

vi.mock('@/screens/tabs/DashboardScreen', () => ({
  DashboardScreen: () => null,
}));

vi.mock('@/screens/tabs/InventoryScreen', () => ({
  InventoryScreen: () => null,
}));

vi.mock('@/screens/tabs/ProfileScreen', () => ({
  ProfileScreen: () => null,
}));

import { HomeTabs } from '@/screens/HomeTabs';

describe('HomeTabs', () => {
  it('disables the top app bar for tab screens', () => {
    const element = HomeTabs();
    const options = element.props.screenOptions({
      route: { name: 'Inventory' },
    });

    expect(options.headerShown).toBe(false);
  });
});
