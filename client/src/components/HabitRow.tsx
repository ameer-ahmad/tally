import { FormEvent, useState } from 'react';
import { apiFetch } from '../lib/api';
import { formatSchedule, type Weekday } from '../lib/habits';
import { WeekdayPicker } from './WeekdayPicker';

export type Habit = {
  id: string;
  userId: string;
  name: string;
  activeDays: Weekday[];
  createdAt: string;
};

type Props = {
  habit: Habit;
  checked: boolean;
  busy: boolean;
  onToggle: (habitId: string, completed: boolean) => void;
  onChanged: () => void;
  onDeleted: (id: string) => void;
};

export function HabitRow({ habit, checked, busy, onToggle, onChanged, onDeleted }: Props) {
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(habit.name);
  const [daysDraft, setDaysDraft] = useState<Weekday[]>(habit.activeDays);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/habits/${habit.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: nameDraft.trim(),
          activeDays: daysDraft,
        }),
      });
      setEditing(false);
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update');
    } finally {
      setSaving(false);
    }
  }

  async function removeHabit() {
    if (!window.confirm(`Delete “${habit.name}”?`)) return;
    setSaving(true);
    try {
      await apiFetch(`/habits/${habit.id}`, { method: 'DELETE' });
      onDeleted(habit.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
      setSaving(false);
    }
  }

  if (editing) {
    return (
      <article className="habit-row editing">
        <form className="habit-edit-form" onSubmit={saveMeta}>
          <input
            value={nameDraft}
            onChange={(e) => setNameDraft(e.target.value)}
            required
            aria-label="Habit name"
          />
          <WeekdayPicker value={daysDraft} onChange={setDaysDraft} disabled={saving} />
          <div className="habit-edit-actions">
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
              Save
            </button>
            <button type="button" className="text-btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </div>
        </form>
        {error ? <p className="form-error">{error}</p> : null}
      </article>
    );
  }

  return (
    <article className="habit-row">
      <label className="habit-check">
        <input
          type="checkbox"
          checked={checked}
          disabled={busy || saving}
          onChange={(e) => onToggle(habit.id, e.target.checked)}
        />
        <span className="habit-check-body">
          <span className="habit-name">{habit.name}</span>
          <span className="habit-schedule muted">{formatSchedule(habit.activeDays)}</span>
        </span>
      </label>
      <div className="habit-actions">
        <button type="button" className="text-btn" onClick={() => setEditing(true)}>
          Edit
        </button>
        <button type="button" className="text-btn danger" onClick={() => void removeHabit()}>
          Delete
        </button>
      </div>
      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}
