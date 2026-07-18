import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { apiFetch } from '../lib/api';
import { formatAverage } from '../lib/dates';
import { useMonth } from '../context/MonthContext';

export type MetricSummary = {
  id: string;
  userId: string;
  name: string;
  unit: string | null;
  createdAt: string;
  monthAverage: number | null;
};

type MetricEntry = {
  id: string;
  metricId: string;
  date: string;
  value: number;
};

type Props = {
  metric: MetricSummary;
  onChanged: () => void;
  onDeleted: (id: string) => void;
};

export function MetricCard({ metric, onChanged, onDeleted }: Props) {
  const { year, month, selectedDate } = useMonth();
  const [entries, setEntries] = useState<MetricEntry[]>([]);
  const [monthAverage, setMonthAverage] = useState<number | null>(metric.monthAverage);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [valueInput, setValueInput] = useState('');
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [nameDraft, setNameDraft] = useState(metric.name);
  const [unitDraft, setUnitDraft] = useState(metric.unit ?? '');
  const [error, setError] = useState<string | null>(null);

  const loadEntries = useCallback(async () => {
    setLoadingEntries(true);
    setError(null);
    try {
      const data = await apiFetch<{
        entries: MetricEntry[];
        monthAverage: number | null;
      }>(`/metrics/${metric.id}/entries?year=${year}&month=${month}`);
      setEntries(data.entries);
      setMonthAverage(data.monthAverage);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load entries');
    } finally {
      setLoadingEntries(false);
    }
  }, [metric.id, year, month]);

  useEffect(() => {
    void loadEntries();
  }, [loadEntries]);

  useEffect(() => {
    const existing = entries.find((e) => e.date === selectedDate);
    setValueInput(existing !== undefined ? String(existing.value) : '');
  }, [entries, selectedDate]);

  const chartData = useMemo(
    () =>
      entries.map((e) => ({
        day: Number(e.date.slice(8, 10)),
        value: e.value,
        date: e.date,
      })),
    [entries],
  );

  async function saveEntry(e: FormEvent) {
    e.preventDefault();
    const value = Number(valueInput);
    if (!Number.isFinite(value)) {
      setError('Enter a valid number');
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/metrics/${metric.id}/entries`, {
        method: 'PUT',
        body: JSON.stringify({ date: selectedDate, value }),
      });
      await loadEntries();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save');
    } finally {
      setSaving(false);
    }
  }

  async function clearEntry() {
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/metrics/${metric.id}/entries/${selectedDate}`, { method: 'DELETE' });
      await loadEntries();
      onChanged();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not clear');
    } finally {
      setSaving(false);
    }
  }

  async function saveMeta(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await apiFetch(`/metrics/${metric.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: nameDraft.trim(),
          unit: unitDraft.trim() ? unitDraft.trim() : null,
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

  async function removeMetric() {
    if (!window.confirm(`Delete “${metric.name}”?`)) return;
    setSaving(true);
    try {
      await apiFetch(`/metrics/${metric.id}`, { method: 'DELETE' });
      onDeleted(metric.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete');
      setSaving(false);
    }
  }

  return (
    <article className="metric-card">
      <header className="metric-card-header">
        {editing ? (
          <form className="metric-edit-form" onSubmit={saveMeta}>
            <input
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              required
              aria-label="Metric name"
            />
            <input
              value={unitDraft}
              onChange={(e) => setUnitDraft(e.target.value)}
              placeholder="Unit (optional)"
              aria-label="Unit"
            />
            <button type="submit" className="btn-primary btn-sm" disabled={saving}>
              Save
            </button>
            <button type="button" className="text-btn" onClick={() => setEditing(false)}>
              Cancel
            </button>
          </form>
        ) : (
          <>
            <div>
              <h2 className="metric-name">
                {metric.name}
                {metric.unit ? <span className="metric-unit"> ({metric.unit})</span> : null}
              </h2>
              <p className="metric-avg muted">
                Month avg: <strong>{formatAverage(monthAverage)}</strong>
                {metric.unit ? ` ${metric.unit}` : ''}
              </p>
            </div>
            <div className="metric-actions">
              <button type="button" className="text-btn" onClick={() => setEditing(true)}>
                Edit
              </button>
              <button type="button" className="text-btn danger" onClick={() => void removeMetric()}>
                Delete
              </button>
            </div>
          </>
        )}
      </header>

      <form className="metric-log" onSubmit={saveEntry}>
        <label className="field metric-log-field">
          <span>Log for {selectedDate}</span>
          <div className="metric-log-row">
            <input
              type="number"
              step="any"
              inputMode="decimal"
              value={valueInput}
              onChange={(e) => setValueInput(e.target.value)}
              placeholder={loadingEntries ? '…' : 'Value'}
              disabled={loadingEntries || saving}
            />
            <button type="submit" className="btn-primary btn-sm" disabled={saving || loadingEntries}>
              {saving ? 'Saving…' : 'Save'}
            </button>
            {entries.some((e) => e.date === selectedDate) ? (
              <button
                type="button"
                className="text-btn"
                disabled={saving}
                onClick={() => void clearEntry()}
              >
                Clear
              </button>
            ) : null}
          </div>
        </label>
      </form>

      <button
        type="button"
        className="chart-toggle"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide chart' : 'Show month chart'}
      </button>

      {expanded ? (
        <div className="metric-chart">
          {chartData.length === 0 ? (
            <p className="muted chart-empty">No values logged this month yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e4e4e7" />
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} width={40} />
                <Tooltip
                  formatter={(value) => {
                    const n = typeof value === 'number' ? value : Number(value);
                    const label = Number.isFinite(n)
                      ? metric.unit
                        ? `${n} ${metric.unit}`
                        : n
                      : String(value ?? '');
                    return [label, metric.name];
                  }}
                  labelFormatter={(day) => `Day ${day}`}
                />
                <Line
                  type="monotone"
                  dataKey="value"
                  stroke="#2563eb"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}
    </article>
  );
}
