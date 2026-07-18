import { useEffect, useRef } from 'react';
import { useMonth } from '../context/MonthContext';
import { daysInMonth, formatLocalDate } from '../lib/dates';

export function DayStrip() {
  const { year, month, selectedDate, setSelectedDate } = useMonth();
  const total = daysInMonth(year, month);
  const scrollerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = scrollerRef.current?.querySelector<HTMLButtonElement>('[data-selected="true"]');
    el?.scrollIntoView({ inline: 'center', block: 'nearest', behavior: 'smooth' });
  }, [selectedDate, year, month]);

  return (
    <div className="day-strip" ref={scrollerRef} role="listbox" aria-label="Day of month">
      {Array.from({ length: total }, (_, i) => {
        const day = i + 1;
        const date = formatLocalDate(year, month, day);
        const selected = date === selectedDate;
        const weekday = new Date(year, month - 1, day).toLocaleDateString(undefined, {
          weekday: 'narrow',
        });
        return (
          <button
            key={date}
            type="button"
            role="option"
            aria-selected={selected}
            data-selected={selected}
            className={selected ? 'day-chip selected' : 'day-chip'}
            onClick={() => setSelectedDate(date)}
          >
            <span className="day-chip-wd">{weekday}</span>
            <span className="day-chip-num">{day}</span>
          </button>
        );
      })}
    </div>
  );
}
