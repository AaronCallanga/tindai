import { describe, expect, it } from 'vitest';

import { colors } from '@/navigation/colors';

describe('colors', () => {
  it('exports the Trusted Growth palette tokens', () => {
    expect(colors.primary).toBe('#1F7A63');
    expect(colors.secondary).toBe('#F2C94C');
    expect(colors.accent).toBe('#F2994A');
    expect(colors.background).toBe('#FFF8E7');
    expect(colors.text).toBe('#2F2F2F');
  });

  it('does not expose a red danger token in the brand system', () => {
    expect('danger' in colors).toBe(false);
  });
});
