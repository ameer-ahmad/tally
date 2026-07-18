import { useMonth } from '../context/MonthContext';

/** Placeholder until Phase 6 */
export function HabitsPage() {
  const { year, month, selectedDate } = useMonth();

  return (
    <section className="screen">
      <h1 className="screen-title">Habits</h1>
      <p className="muted">
        Checkoffs for {selectedDate} ({month}/{year}). Schedules and graphs come next.
      </p>
      <div className="empty-state">
        <p>No habits yet</p>
        <p className="muted">You’ll be able to add workouts, prayer, study, and more here.</p>
      </div>
    </section>
  );
}
