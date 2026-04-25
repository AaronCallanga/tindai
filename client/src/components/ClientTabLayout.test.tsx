import { act, createElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import TestRenderer from 'react-test-renderer';

// React 19 test renderer expects this flag in test environments.
(globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

vi.mock('react-native', () => ({
  ScrollView: ({ children }: { children: React.ReactNode }) =>
    createElement('mock-scroll-view', null, children),
  StyleSheet: {
    create: <T,>(styles: T) => styles,
  },
  Text: ({ children }: { children: React.ReactNode }) => createElement('mock-text', null, children),
  View: ({ children }: { children: React.ReactNode }) => createElement('mock-view', null, children),
}));

vi.mock('react-native-safe-area-context', () => ({
  SafeAreaView: ({ children }: { children: React.ReactNode }) =>
    createElement('safe-area-view', null, children),
}));

vi.mock('@/navigation/colors', () => ({
  colors: {
    background: '#FFF8E7',
    border: 'rgba(31, 122, 99, 0.18)',
    card: '#F6E7C0',
    muted: '#6D675D',
    primaryDeep: '#145746',
    secondary: '#F2C94C',
    surface: '#FFFDF5',
    text: '#2F2F2F',
  },
}));

import { ClientTabLayout } from '@/components/ClientTabLayout';

describe('ClientTabLayout', () => {
  it('wraps tab content in a safe area view', () => {
    let tree!: TestRenderer.ReactTestRenderer;

    act(() => {
      tree = TestRenderer.create(
        createElement(
          ClientTabLayout,
          { label: 'Profile', title: 'Title', subtitle: 'Subtitle', highlights: ['One'] },
          createElement('mock-child'),
        ),
      );
    });

    expect(tree.toJSON()).toMatchObject({
      type: 'safe-area-view',
    });
  });
});
