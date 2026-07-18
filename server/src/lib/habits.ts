import type { Habit, HabitCompletion } from '@prisma/client';
import { formatDateOnly, monthBounds } from './dates.js';

/** Empty activeDays means every day (0–6). */
export function isHabitActiveOn(activeDays: number[], weekday: number): boolean {
  if (activeDays.length === 0) return true;
  return activeDays.includes(weekday);
}

export function weekdayUtc(date: Date): number {
  return date.getUTCDay();
}

export function serializeHabit(habit: Habit) {
  return {
    id: habit.id,
    userId: habit.userId,
    name: habit.name,
    activeDays: habit.activeDays as Array<0 | 1 | 2 | 3 | 4 | 5 | 6>,
    createdAt: habit.createdAt.toISOString(),
  };
}

export function serializeHabitCompletion(completion: HabitCompletion) {
  return {
    id: completion.id,
    habitId: completion.habitId,
    date: formatDateOnly(completion.date),
    completed: completion.completed,
  };
}

export function computeHabitsMonthSummary(
  habits: Habit[],
  completions: HabitCompletion[],
  year: number,
  month: number,
) {
  const { start, end } = monthBounds(year, month);
  const completionKey = (habitId: string, dateStr: string) => `${habitId}:${dateStr}`;
  const completedSet = new Set(
    completions
      .filter((c) => c.completed)
      .map((c) => completionKey(c.habitId, formatDateOnly(c.date))),
  );

  let expected = 0;
  let completed = 0;
  const perDay: Record<string, number> = {};

  for (let day = start.getUTCDate(); day <= end.getUTCDate(); day++) {
    const date = new Date(Date.UTC(year, month - 1, day));
    const dateStr = formatDateOnly(date);
    const weekday = weekdayUtc(date);
    let dayCompleted = 0;

    for (const habit of habits) {
      if (!isHabitActiveOn(habit.activeDays, weekday)) continue;
      expected += 1;
      if (completedSet.has(completionKey(habit.id, dateStr))) {
        completed += 1;
        dayCompleted += 1;
      }
    }

    perDay[dateStr] = dayCompleted;
  }

  return {
    expected,
    completed,
    perDay,
    habits: habits.map(serializeHabit),
    completions: completions.map(serializeHabitCompletion),
  };
}
