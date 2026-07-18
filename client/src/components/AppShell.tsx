import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { MonthPicker } from './MonthPicker';

export function AppShell() {
  const { user, signOut } = useAuth();

  return (
    <div className="app-shell">
      <header className="app-header">
        <div className="app-header-top">
          <p className="brand-mark">Tally</p>
          <button type="button" className="text-btn" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
        <MonthPicker />
        {user?.email ? <p className="user-email muted">{user.email}</p> : null}
      </header>

      <main className="app-main">
        <Outlet />
      </main>

      <nav className="app-nav" aria-label="Main">
        <NavLink to="/metrics" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Metrics
        </NavLink>
        <NavLink to="/habits" className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}>
          Habits
        </NavLink>
      </nav>
    </div>
  );
}
