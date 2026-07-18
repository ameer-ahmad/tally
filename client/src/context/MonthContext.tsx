import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

type MonthContextValue = {
  year: number;
  month: number;
  selectedDate: string;
  setYearMonth: (year: number, month: number) => void;
  setSelectedDate: (date: string) => void;
  goPrevMonth: () => void;
  goNextMonth: () => void;
};

function formatLocalDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function todayLocal() {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), now.getDate());
}

function clampSelectedToMonth(year: number, month: number, selectedDate: string) {
  const [y, m] = selectedDate.split('-').map(Number);
  if (y === year && m === month) return selectedDate;
  const today = todayLocal();
  if (today.getFullYear() === year && today.getMonth() + 1 === month) {
    return formatLocalDate(today);
  }
  return `${year}-${String(month).padStart(2, '0')}-01`;
}

const MonthContext = createContext<MonthContextValue | null>(null);

export function MonthProvider({ children }: { children: ReactNode }) {
  const today = todayLocal();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [selectedDate, setSelectedDateState] = useState(() => formatLocalDate(today));

  const setYearMonth = useCallback((nextYear: number, nextMonth: number) => {
    setYear(nextYear);
    setMonth(nextMonth);
    setSelectedDateState((prev) => clampSelectedToMonth(nextYear, nextMonth, prev));
  }, []);

  const setSelectedDate = useCallback((date: string) => {
    setSelectedDateState(date);
    const [y, m] = date.split('-').map(Number);
    setYear(y);
    setMonth(m);
  }, []);

  const goPrevMonth = useCallback(() => {
    const d = new Date(year, month - 2, 1);
    setYearMonth(d.getFullYear(), d.getMonth() + 1);
  }, [year, month, setYearMonth]);

  const goNextMonth = useCallback(() => {
    const d = new Date(year, month, 1);
    setYearMonth(d.getFullYear(), d.getMonth() + 1);
  }, [year, month, setYearMonth]);

  const value = useMemo(
    () => ({
      year,
      month,
      selectedDate,
      setYearMonth,
      setSelectedDate,
      goPrevMonth,
      goNextMonth,
    }),
    [year, month, selectedDate, setYearMonth, setSelectedDate, goPrevMonth, goNextMonth],
  );

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
}

export function useMonth() {
  const ctx = useContext(MonthContext);
  if (!ctx) throw new Error('useMonth must be used within MonthProvider');
  return ctx;
}
