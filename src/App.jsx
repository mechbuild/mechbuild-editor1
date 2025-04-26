import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/ProtectedRoute';
import MonitoringDashboard from './components/MonitoringDashboard';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

import AdminDashboard from './pages/AdminDashboard';
import AIConsolePage from './pages/AIConsolePage';
import DocumentUploadPage from './pages/DocumentUploadPage';
import OutputReportPage from './pages/OutputReportPage';
import ProjectDetail from "./pages/ProjectDetail";

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9',
    },
    secondary: {
      main: '#f48fb1',
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route path="/project/:id/admin" element={<ProtectedRoute><AdminDashboard /></ProtectedRoute>} />
          <Route path="/project/:id/ai" element={<ProtectedRoute><AIConsolePage /></ProtectedRoute>} />
          <Route path="/project/:id/documents" element={<ProtectedRoute><DocumentUploadPage /></ProtectedRoute>} />
          <Route path="/project/:id/outputs" element={<ProtectedRoute><OutputReportPage /></ProtectedRoute>} />
          <Route path="/projects/:id" element={<ProjectDetail />} />
          <Route path="/monitoring" element={<MonitoringDashboard />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
