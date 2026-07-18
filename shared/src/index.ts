/** Weekday: 0 = Sunday … 6 = Saturday (matches Date.getDay()) */
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export interface Profile {
  id: string;
  email: string;
  createdAt: string;
}

export interface Metric {
  id: string;
  userId: string;
  name: string;
  unit: string | null;
  createdAt: string;
}

export interface MetricEntry {
  id: string;
  metricId: string;
  /** YYYY-MM-DD */
  date: string;
  value: number;
}

export interface MetricWithAverage extends Metric {
  monthAverage: number | null;
}

export interface Habit {
  id: string;
  userId: string;
  name: string;
  /** Days this habit is active; empty/full week = every day */
  activeDays: Weekday[];
  createdAt: string;
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  /** YYYY-MM-DD */
  date: string;
  completed: boolean;
}

export interface HabitsMonthSummary {
  expected: number;
  completed: number;
  /** Completions count per day of the month (YYYY-MM-DD → count) */
  perDay: Record<string, number>;
  habits: Habit[];
  completions: HabitCompletion[];
}

export interface CreateMetricInput {
  name: string;
  unit?: string | null;
}

export interface UpsertMetricEntryInput {
  date: string;
  value: number;
}

export interface CreateHabitInput {
  name: string;
  activeDays: Weekday[];
}

export interface UpsertHabitCompletionInput {
  date: string;
  completed: boolean;
}
