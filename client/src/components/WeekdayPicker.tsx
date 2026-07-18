import type { Weekday } from '../lib/habits';
import { WEEKDAY_OPTIONS } from '../lib/habits';

type Props = {
  value: Weekday[];
  onChange: (days: Weekday[]) => void;
  disabled?: boolean;
};

export function WeekdayPicker({ value, onChange, disabled }: Props) {
  function toggle(day: Weekday) {
    if (value.includes(day)) {
      onChange(value.filter((d) => d !== day));
    } else {
      onChange([...value, day].sort((a, b) => a - b) as Weekday[]);
    }
  }

  return (
    <div className="weekday-picker" role="group" aria-label="Active days">
      <p className="weekday-hint muted">Leave all off for every day, or pick specific weekdays.</p>
      <div className="weekday-row">
        {WEEKDAY_OPTIONS.map((opt) => {
          const selected = value.includes(opt.value);
          return (
            <button
              key={opt.value}
              type="button"
              className={selected ? 'weekday-chip selected' : 'weekday-chip'}
              aria-pressed={selected}
              disabled={disabled}
              onClick={() => toggle(opt.value)}
              title={opt.label}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
