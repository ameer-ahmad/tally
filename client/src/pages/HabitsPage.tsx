import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { DayStrip } from '../components/DayStrip';
import { HabitRow, type Habit } from '../components/HabitRow';
import { WeekdayPicker } from '../components/WeekdayPicker';
import { useMonth } from '../context/MonthContext';
import { apiFetch } from '../lib/api';
import { daysInMonth, formatLocalDate } from '../lib/dates';
import { isHabitActiveOn, weekdayFromDateString, type Weekday } from '../lib/habits';

type HabitCompletion = {
  id: string;
  habitId: string;
  date: string;
  completed: boolean;
};

type MonthResponse = {
  year: number;
  month: number;
  expected: number;
  completed: number;
  perDay: Record<string, number>;
  habits: Habit[];
  completions: HabitCompletion[];
};

export function HabitsPage() {
  const { year, month, selectedDate } = useMonth();
  const [data, setData] = useState<MonthResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyIds, setBusyIds] = useState<Set<string>>(new Set());
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [activeDays, setActiveDays] = useState<Weekday[]>([]);
  const [creating, setCreating] = useState(false);
  const [showChart, setShowChart] = useState(false);

  const loadMonth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiFetch<MonthResponse>(`/habits/month?year=${year}&month=${month}`);
      setData(res);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load habits');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void loadMonth();
  }, [loadMonth]);

  const selectedWeekday = weekdayFromDateString(selectedDate);

  const todaysHabits = useMemo(() => {
    if (!data) return [];
    return data.habits.filter((h) => isHabitActiveOn(h.activeDays, selectedWeekday));
  }, [data, selectedWeekday]);

  const completedOnSelected = useMemo(() => {
    const map = new Map<string, boolean>();
    if (!data) return map;
    for (const c of data.completions) {
      if (c.date === selectedDate) {
        map.set(c.habitId, c.completed);
      }
    }
    return map;
  }, [data, selectedDate]);

  const chartData = useMemo(() => {
    if (!data) return [];
    const total = daysInMonth(year, month);
    return Array.from({ length: total }, (_, i) => {
      const day = i + 1;
      const date = formatLocalDate(year, month, day);
      return {
        day,
        completed: data.perDay[date] ?? 0,
      };
    });
  }, [data, year, month]);

  async function createHabit(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/habits', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          activeDays,
        }),
      });
      setName('');
      setActiveDays([]);
      setShowAdd(false);
      await loadMonth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create habit');
    } finally {
      setCreating(false);
    }
  }

  async function toggleHabit(habitId: string, completed: boolean) {
    setBusyIds((prev) => new Set(prev).add(habitId));
    setError(null);

    // Optimistic update
    setData((prev) => {
      if (!prev) return prev;
      const others = prev.completions.filter(
        (c) => !(c.habitId === habitId && c.date === selectedDate),
      );
      const nextCompletions = [
        ...others,
        {
          id: `temp-${habitId}-${selectedDate}`,
          habitId,
          date: selectedDate,
          completed,
        },
      ];
      return { ...prev, completions: nextCompletions };
    });

    try {
      await apiFetch(`/habits/${habitId}/completions`, {
        method: 'PUT',
        body: JSON.stringify({ date: selectedDate, completed }),
      });
      await loadMonth();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update habit');
      await loadMonth();
    } finally {
      setBusyIds((prev) => {
        const next = new Set(prev);
        next.delete(habitId);
        return next;
      });
    }
  }

  const expected = data?.expected ?? 0;
  const completed = data?.completed ?? 0;
  const pct = expected > 0 ? Math.round((completed / expected) * 100) : 0;

  return (
    <section className="screen">
      <div className="screen-heading">
        <h1 className="screen-title">Habits</h1>
        <button type="button" className="btn-primary btn-sm" onClick={() => setShowAdd((v) => !v)}>
          {showAdd ? 'Cancel' : 'Add habit'}
        </button>
      </div>

      <div className="habits-totals" aria-live="polite">
        <p className="habits-totals-main">
          <strong>
            {completed} / {expected}
          </strong>{' '}
          <span className="muted">completed this month</span>
        </p>
        <p className="habits-totals-pct muted">{expected > 0 ? `${pct}%` : '—'}</p>
      </div>

      <DayStrip />

      {showAdd ? (
        <form className="add-form" onSubmit={createHabit}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Worked out"
              required
              maxLength={100}
            />
          </label>
          <WeekdayPicker value={activeDays} onChange={setActiveDays} disabled={creating} />
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Adding…' : 'Add habit'}
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
      {loading ? <p className="muted">Loading habits…</p> : null}

      {!loading && data && data.habits.length === 0 ? (
        <div className="empty-state">
          <p>No habits yet</p>
          <p className="muted">Add workouts, prayer, study, or anything you want to check off.</p>
        </div>
      ) : null}

      {!loading && data && data.habits.length > 0 && todaysHabits.length === 0 ? (
        <div className="empty-state compact">
          <p>Nothing scheduled for this day</p>
          <p className="muted">Pick another day, or edit a habit’s schedule.</p>
        </div>
      ) : null}

      <div className="habit-list">
        {todaysHabits.map((habit) => (
          <HabitRow
            key={habit.id}
            habit={habit}
            checked={completedOnSelected.get(habit.id) === true}
            busy={busyIds.has(habit.id)}
            onToggle={(id, completed) => void toggleHabit(id, completed)}
            onChanged={() => void loadMonth()}
            onDeleted={() => void loadMonth()}
          />
        ))}
      </div>

      {data && data.habits.length > 0 ? (
        <>
          <button
            type="button"
            className="chart-toggle"
            onClick={() => setShowChart((v) => !v)}
            aria-expanded={showChart}
          >
            {showChart ? 'Hide month chart' : 'Show month chart'}
          </button>
          {showChart ? (
            <div className="habits-chart">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} margin={{ top: 8, right: 4, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                  <XAxis dataKey="day" tick={{ fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} width={32} />
                  <Tooltip
                    formatter={(value) => [value ?? 0, 'Completed']}
                    labelFormatter={(day) => `Day ${day}`}
                  />
                  <Bar dataKey="completed" fill="#2563eb" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : null}
        </>
      ) : null}
    </section>
  );
}
