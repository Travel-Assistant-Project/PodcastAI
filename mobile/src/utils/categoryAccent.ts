/** İlk seçilen kategoriye göre kart / kapak düşüm rengi (kapak URL yokken). */
const CATEGORY_COLORS: Record<string, string> = {
  technology: '#1E3A8A',
  ai: '#3730A3',
  science: '#065F46',
  health: '#7C2D12',
  finance: '#78350F',
  economy: '#374151',
  sports: '#1E40AF',
  music: '#581C87',
  entertainment: '#831843',
  world: '#134E4A',
};

export function categoryAccentColor(categories: string[]): string {
  const first = (categories[0] ?? '').toLowerCase();
  return CATEGORY_COLORS[first] ?? '#1E3A8A';
}
