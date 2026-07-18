import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { MonthProvider } from './context/MonthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AppShell } from './components/AppShell';
import { LoginPage } from './pages/LoginPage';
import { RegisterPage } from './pages/RegisterPage';
import { MetricsPage } from './pages/MetricsPage';
import { HabitsPage } from './pages/HabitsPage';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <MonthProvider>
                  <AppShell />
                </MonthProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/metrics" replace />} />
            <Route path="metrics" element={<MetricsPage />} />
            <Route path="habits" element={<HabitsPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/metrics" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
