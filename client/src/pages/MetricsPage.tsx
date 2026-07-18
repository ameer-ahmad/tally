import { useMonth } from '../context/MonthContext';

/** Placeholder until Phase 5 */
export function MetricsPage() {
  const { year, month, selectedDate } = useMonth();

  return (
    <section className="screen">
      <h1 className="screen-title">Metrics</h1>
      <p className="muted">
        Quantitative logs for {selectedDate} ({month}/{year}). Add and chart metrics in the next
        phase.
      </p>
      <div className="empty-state">
        <p>No metrics yet</p>
        <p className="muted">You’ll be able to add weight, sleep, calories, and more here.</p>
      </div>
    </section>
  );
}
