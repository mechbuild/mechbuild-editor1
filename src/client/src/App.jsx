import React, { useState, useMemo } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n';
import { NotificationProvider } from './contexts/NotificationContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Projects from './pages/Projects';
import Dashboard from './pages/Dashboard';
import Map from './pages/Map';
import MonitoringDashboard from './pages/MonitoringDashboard';
import Backup from './pages/Backup';
import Reports from './pages/Reports';
import Settings from './pages/Settings';
import AIConsole from './pages/AIConsole';
import AIReportGenerator from './pages/AIReportGenerator';
import AdminPanel from './pages/AdminPanel';
import ProtectedRoute from './components/ProtectedRoute';
import SystemStatus from './components/SystemStatus';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [mode, setMode] = useState(localStorage.getItem('themeMode') || 'light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          ...(mode === 'light'
            ? {
                background: {
                  default: '#f5f5f5',
                  paper: '#ffffff',
                },
              }
            : {
                background: {
                  default: '#121212',
                  paper: '#1e1e1e',
                },
              }),
        },
      }),
    [mode]
  );

  const handleThemeChange = (newMode) => {
    setMode(newMode);
    localStorage.setItem('themeMode', newMode);
  };

  return (
    <I18nextProvider i18n={i18n}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <NotificationProvider>
          <Router>
            {!token ? (
              <Login setToken={setToken} />
            ) : (
              <div style={{ backgroundColor: theme.palette.background.default }}>
                <Navbar setToken={setToken} />
                <Routes>
                  <Route path="/" element={<Navigate to="/projects" />} />
                  <Route path="/login" element={<Navigate to="/projects" />} />
                  <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
                  <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
                  <Route path="/map" element={<ProtectedRoute><Map /></ProtectedRoute>} />
                  <Route path="/monitoring" element={<ProtectedRoute><MonitoringDashboard /></ProtectedRoute>} />
                  <Route path="/backup" element={<ProtectedRoute><Backup /></ProtectedRoute>} />
                  <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
                  <Route path="/settings" element={<ProtectedRoute><Settings handleThemeChange={handleThemeChange} /></ProtectedRoute>} />
                  <Route path="/ai-console" element={<ProtectedRoute><AIConsole /></ProtectedRoute>} />
                  <Route path="/ai-report" element={<ProtectedRoute><AIReportGenerator /></ProtectedRoute>} />
                  <Route path="/admin" element={<ProtectedRoute><AdminPanel /></ProtectedRoute>} />
                </Routes>
                <SystemStatus />
              </div>
            )}
          </Router>
        </NotificationProvider>
      </ThemeProvider>
    </I18nextProvider>
  );
};

export default App; 