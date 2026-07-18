import { FormEvent, useCallback, useEffect, useState } from 'react';
import { DayStrip } from '../components/DayStrip';
import { MetricCard, type MetricSummary } from '../components/MetricCard';
import { useMonth } from '../context/MonthContext';
import { apiFetch } from '../lib/api';

type MetricsListResponse = {
  year: number;
  month: number;
  metrics: MetricSummary[];
};

export function MetricsPage() {
  const { year, month } = useMonth();
  const [metrics, setMetrics] = useState<MetricSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [unit, setUnit] = useState('');
  const [creating, setCreating] = useState(false);

  const loadMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<MetricsListResponse>(`/metrics?year=${year}&month=${month}`);
      setMetrics(data.metrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load metrics');
    } finally {
      setLoading(false);
    }
  }, [year, month]);

  useEffect(() => {
    void loadMetrics();
  }, [loadMetrics]);

  async function createMetric(e: FormEvent) {
    e.preventDefault();
    setCreating(true);
    setError(null);
    try {
      await apiFetch('/metrics', {
        method: 'POST',
        body: JSON.stringify({
          name: name.trim(),
          unit: unit.trim() ? unit.trim() : null,
        }),
      });
      setName('');
      setUnit('');
      setShowAdd(false);
      await loadMetrics();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create metric');
    } finally {
      setCreating(false);
    }
  }

  return (
    <section className="screen">
      <div className="screen-heading">
        <h1 className="screen-title">Metrics</h1>
        <button
          type="button"
          className="btn-primary btn-sm"
          onClick={() => setShowAdd((v) => !v)}
        >
          {showAdd ? 'Cancel' : 'Add metric'}
        </button>
      </div>

      <DayStrip />

      {showAdd ? (
        <form className="add-form" onSubmit={createMetric}>
          <label className="field">
            <span>Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Weight"
              required
              maxLength={100}
            />
          </label>
          <label className="field">
            <span>Unit (optional)</span>
            <input
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              placeholder="e.g. lbs, hrs, kcal"
              maxLength={40}
            />
          </label>
          <button type="submit" className="btn-primary" disabled={creating}>
            {creating ? 'Adding…' : 'Add metric'}
          </button>
        </form>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {loading ? <p className="muted">Loading metrics…</p> : null}

      {!loading && metrics.length === 0 ? (
        <div className="empty-state">
          <p>No metrics yet</p>
          <p className="muted">Add weight, sleep, calories, or anything else you want to track.</p>
        </div>
      ) : null}

      <div className="metric-list">
        {metrics.map((metric) => (
          <MetricCard
            key={metric.id}
            metric={metric}
            onChanged={() => void loadMetrics()}
            onDeleted={(id) => setMetrics((prev) => prev.filter((m) => m.id !== id))}
          />
        ))}
      </div>
    </section>
  );
}
