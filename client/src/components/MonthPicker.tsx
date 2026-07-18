import { useMonth } from '../context/MonthContext';

const MONTH_LABELS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
];

export function MonthPicker() {
  const { year, month, goPrevMonth, goNextMonth } = useMonth();

  return (
    <div className="month-picker" role="group" aria-label="Month">
      <button type="button" className="icon-btn" onClick={goPrevMonth} aria-label="Previous month">
        ‹
      </button>
      <p className="month-label">
        {MONTH_LABELS[month - 1]} {year}
      </p>
      <button type="button" className="icon-btn" onClick={goNextMonth} aria-label="Next month">
        ›
      </button>
    </div>
  );
}
