export type LanguageStyle = 'english' | 'filipino' | 'taglish' | 'bisaya';

export function detectLanguageStyle(question: string): LanguageStyle {
  const normalized = question.toLowerCase();
  const bisayaSignals = ['unsa', 'kinsa', 'pila', 'karon', 'baligya', 'ug ', 'kana'];
  const filipinoSignals = ['ano', 'sino', 'ilan', 'magkano', 'ngayon', 'pinakamabenta', 'dapat', 'restock'];
  const englishSignals = ['what', 'who', 'how much', 'today', 'fast moving', 'top selling', 'restock'];

  const hasBisaya = bisayaSignals.some((term) => normalized.includes(term));
  const hasFilipino = filipinoSignals.some((term) => normalized.includes(term));
  const hasEnglish = englishSignals.some((term) => normalized.includes(term));

  if (hasBisaya) {
    return hasEnglish ? 'taglish' : 'bisaya';
  }

  if (hasFilipino && hasEnglish) {
    return 'taglish';
  }

  if (hasFilipino) {
    return 'filipino';
  }

  return 'english';
}
