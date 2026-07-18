export function daysInMonth(year: number, month: number): number {
  return new Date(year, month, 0).getDate();
}

export function formatLocalDate(year: number, month: number, day: number): string {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function formatAverage(value: number | null): string {
  if (value === null) return '—';
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
