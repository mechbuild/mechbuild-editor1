import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Home from './pages/Home';
import Backup from './pages/Backup';
import Restore from './pages/Restore';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import ProjectLogs from './pages/ProjectLogs';
import AdminPanel from './pages/AdminPanel';
import { Box, Container, Tab, Tabs, Paper, Typography, Alert, Snackbar } from '@mui/material';
import FileUploader from './components/FileUploader';
import ProgressIndicator from './components/ProgressIndicator';
import BatchProcessor from './components/BatchProcessor';
import ReportGenerator from './components/ReportGenerator';
import PerformanceDashboard from './components/PerformanceDashboard';
import './index.css';

function App() {
  const isAdmin = localStorage.getItem('role') === 'admin';
  const [activeTab, setActiveTab] = useState(0);
  const [operationId, setOperationId] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [notification, setNotification] = useState({ open: false, message: '', severity: 'info' });

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleUploadComplete = (id, analysisData) => {
    setOperationId(id);
    setAnalysis(analysisData);
    showNotification('Dosya başarıyla yüklendi ve analiz edildi', 'success');
  };

  const showNotification = (message, severity = 'info') => {
    setNotification({ open: true, message, severity });
  };

  const handleCloseNotification = () => {
    setNotification({ ...notification, open: false });
  };

  return (
    <Router>
      <div className="App">
        <header className="navbar">
          <div className="navbar-brand">
            <Link to="/">MechBuild Editor 2</Link>
          </div>
          <nav className="navbar-menu">
            <Link to="/">Ana Sayfa</Link>
            <Link to="/projects">Projeler</Link>
            <Link to="/backup">Yedekleme</Link>
            <Link to="/restore">Geri Yükleme</Link>
            <Link to="/performance">Performance</Link>
            {isAdmin && (
              <Link 
                to="/admin" 
                style={{ 
                  marginLeft: "1rem", 
                  color: "#dc3545",
                  fontWeight: "bold"
                }}
              >
                🔧 Admin Panel
              </Link>
            )}
          </nav>
        </header>
        <main>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/projects" element={<Projects />} />
            <Route path="/projects/:id" element={<ProjectDetail />} />
            <Route path="/backup" element={<Backup />} />
            <Route path="/restore" element={<Restore />} />
            <Route path="/project/:id/logs" element={<ProjectLogs />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/performance" element={<PerformanceDashboard />} />
          </Routes>
        </main>
        <Container maxWidth="lg">
          <Box sx={{ my: 4 }}>
            <Paper elevation={3} sx={{ p: 4, mb: 4 }}>
              <Typography variant="h4" component="h1" gutterBottom align="center" color="primary">
                Excel Analiz Aracı
              </Typography>
              <Typography variant="subtitle1" align="center" color="text.secondary" paragraph>
                Excel dosyalarınızı yükleyin, detaylı analiz edin ve raporlar oluşturun
              </Typography>
            </Paper>

            <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
              <FileUploader onUploadComplete={handleUploadComplete} />
            </Paper>

            {operationId && (
              <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
                <ProgressIndicator operationId={operationId} />
              </Paper>
            )}

            {analysis && (
              <Paper elevation={2} sx={{ p: 3 }}>
                <ReportGenerator operationId={operationId} analysis={analysis} />
              </Paper>
            )}
          </Box>
        </Container>
        <Snackbar
          open={notification.open}
          autoHideDuration={6000}
          onClose={handleCloseNotification}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={handleCloseNotification} severity={notification.severity} sx={{ width: '100%' }}>
            {notification.message}
          </Alert>
        </Snackbar>
        <ToastContainer position="bottom-right" />
      </div>
    </Router>
  );
}

export default App; 