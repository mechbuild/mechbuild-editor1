import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorService from '../services/errorService';
import ValidationService from '../services/validationService';
import ThemeService from '../services/themeService';
import LoadingSpinner from '../components/LoadingSpinner';
import { Box, Button, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ExportService from '../services/ExportService';
import DownloadIcon from '@mui/icons-material/Download';

const Projects = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [projects, setProjects] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    location: '',
    startDate: '',
    status: 'Aktif'
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [systems, setSystems] = useState([]);
  const [showSystems, setShowSystems] = useState(false);
  const [lang, setLang] = useState("tr");

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3002/api/projects', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error(ErrorService.getErrorMessage('API', 'SERVER_ERROR'));
      }
      
      const data = await response.json();
      setProjects(data);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Projects');
      showNotification(processedError.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const validateProject = (project) => {
    const rules = {
      name: [(value) => ValidationService.validateRequired(value, 'Proje adı')],
      location: [(value) => ValidationService.validateRequired(value, 'Lokasyon')],
      startDate: [(value) => ValidationService.validateDate(value)],
      status: [(value) => ValidationService.validateRequired(value, 'Durum')]
    };

    return ValidationService.validateForm(project, rules);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationErrors = validateProject(newProject);
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch('http://localhost:3002/api/projects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(newProject)
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Proje eklenirken bir hata oluştu');
      }

      const data = await response.json();
      setProjects([...projects, data]);
      setNewProject({
        name: '',
        location: '',
        startDate: '',
        status: 'Aktif'
      });
      setShowForm(false);
      showNotification('Proje başarıyla eklendi', 'success');
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'AddProject');
      showNotification(processedError.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bu projeyi silmek istediğinizden emin misiniz?')) {
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        navigate('/login');
        return;
      }

      const response = await fetch(`http://localhost:3002/api/projects/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          navigate('/login');
          return;
        }
        throw new Error('Proje silinirken bir hata oluştu');
      }

      setProjects(projects.filter(project => project._id !== id));
      showNotification('Proje başarıyla silindi', 'success');
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'DeleteProject');
      showNotification(processedError.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      await ExportService.exportProjects(projects);
      showNotification('Projects exported successfully', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAI = async (project) => {
    try {
      setSelectedProject(project);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error('AI önerileri alınamadı');
      }

      const data = await response.json();
      setSuggestions(data.suggestions);
      setShowSuggestions(true);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'AI');
      showNotification(processedError.message, 'error');
    }
  };

  const handleSystemSuggest = async (project) => {
    try {
      setSelectedProject(project);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/zon-systems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(project)
      });

      if (!response.ok) {
        throw new Error('Sistem önerileri alınamadı');
      }

      const data = await response.json();
      setSystems(data.systems);
      setShowSystems(true);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Systems');
      showNotification(processedError.message, 'error');
    }
  };

  const handleDownloadReport = async (project) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/export/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...project, lang })
      });

      if (!response.ok) {
        throw new Error('Rapor oluşturulurken hata oluştu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `teknik-rapor-${project.name.toLowerCase().replace(/\s+/g, '-')}.docx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadPackage = async (project) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/export/full', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ project, lang })
      });

      if (!response.ok) {
        throw new Error('Proje paketi oluşturulurken hata oluştu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `proje-paketi-${project.name.toLowerCase().replace(/\s+/g, '-')}.zip`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      showNotification(err.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Box sx={styles.header}>
          <Typography variant="h4" component="h1">
            {t('projects.title')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || projects.length === 0}
          >
            {t('export')}
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('projects.columns.name')}</TableCell>
                <TableCell>{t('projects.columns.description')}</TableCell>
                <TableCell>{t('projects.columns.status')}</TableCell>
                <TableCell>{t('projects.columns.createdAt')}</TableCell>
                <TableCell>{t('projects.columns.updatedAt')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {projects.map((project) => (
                <TableRow key={project._id}>
                  <TableCell>{project.name}</TableCell>
                  <TableCell>{project.location}</TableCell>
                  <TableCell>{project.status}</TableCell>
                  <TableCell>{new Date(project.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(project.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
};

const styles = {
  container: {
    padding: '20px'
  },
  paper: {
    padding: '20px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px'
  }
};

export default Projects; 