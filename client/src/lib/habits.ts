/** Weekday: 0 = Sunday … 6 = Saturday */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const WEEKDAY_OPTIONS: { value: Weekday; label: string; short: string }[] = [
  { value: 0, label: 'Sun', short: 'S' },
  { value: 1, label: 'Mon', short: 'M' },
  { value: 2, label: 'Tue', short: 'T' },
  { value: 3, label: 'Wed', short: 'W' },
  { value: 4, label: 'Thu', short: 'T' },
  { value: 5, label: 'Fri', short: 'F' },
  { value: 6, label: 'Sat', short: 'S' },
];

/** Empty activeDays means every day. */
export function isHabitActiveOn(activeDays: number[], weekday: number): boolean {
  if (activeDays.length === 0) return true;
  return activeDays.includes(weekday);
}

export function weekdayFromDateString(dateStr: string): number {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(y, m - 1, d).getDay();
}

export function formatSchedule(activeDays: number[]): string {
  if (activeDays.length === 0 || activeDays.length === 7) return 'Every day';
  const set = new Set(activeDays);
  return WEEKDAY_OPTIONS.filter((d) => set.has(d.value))
    .map((d) => d.label)
    .join(', ');
}
