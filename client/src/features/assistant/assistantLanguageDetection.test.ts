import { describe, expect, it } from 'vitest';

import { detectLanguageStyle } from './assistantLanguageDetection';

describe('detectLanguageStyle', () => {
  it('detects filipino questions', () => {
    expect(detectLanguageStyle('Ano ang low stock ngayon?')).toBe('filipino');
  });

  it('detects english questions', () => {
    expect(detectLanguageStyle('What are the top selling items today?')).toBe('english');
  });

  it('detects taglish questions', () => {
    expect(detectLanguageStyle('Magkano benta ko today?')).toBe('taglish');
  });
});
