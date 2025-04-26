import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import ErrorService from '../services/errorService';
import ValidationService from '../services/validationService';
import ThemeService from '../services/themeService';
import LoadingSpinner from '../components/LoadingSpinner';
import AIPanel from '../components/AIPanel';
import FilePanel from '../components/FilePanel';
import { Grid, Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AIConsole from '../components/AIConsole';

const ProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProject, setEditedProject] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadProject();
  }, [id]);

  const loadProject = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/projects/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(ErrorService.getErrorMessage('API', 'PROJECT_NOT_FOUND'));
      }

      const data = await response.json();
      // Tarihi ISO formatına dönüştür
      const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''
      };
      setProject(formattedData);
      setEditedProject(formattedData);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'ProjectDetail');
      ErrorService.showError(processedError, setError);
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

  const handleSave = async () => {
    const validationErrors = validateProject(editedProject);
    if (Object.keys(validationErrors).length > 0) {
      setError(Object.values(validationErrors)[0]);
      return;
    }

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/projects/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(editedProject)
      });

      if (!response.ok) {
        throw new Error('Proje güncellenirken bir hata oluştu');
      }

      const data = await response.json();
      // Tarihi ISO formatına dönüştür
      const formattedData = {
        ...data,
        startDate: data.startDate ? new Date(data.startDate).toISOString().split('T')[0] : ''
      };
      setProject(formattedData);
      setIsEditing(false);
      ErrorService.showSuccess('Proje başarıyla güncellendi', setSuccess);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'UpdateProject');
      ErrorService.showError(processedError, setError);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!project) {
    return null;
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/')} style={ThemeService.getButtonStyle('secondary')}>
            <span className="material-icons" style={{ marginRight: '5px' }}>home</span>
            Ana Sayfa
          </button>
          <button onClick={() => navigate('/projects')} style={ThemeService.getButtonStyle('secondary')}>
            <span className="material-icons" style={{ marginRight: '5px' }}>arrow_back</span>
            Projeler
          </button>
          <h1 style={styles.title}>{project.name}</h1>
        </div>
        <div style={styles.headerButtons}>
          {!isEditing ? (
            <button 
              onClick={() => setIsEditing(true)} 
              style={ThemeService.getButtonStyle('primary')}
            >
              <span className="material-icons" style={{ marginRight: '5px' }}>edit</span>
              Düzenle
            </button>
          ) : (
            <>
              <button onClick={handleSave} style={ThemeService.getButtonStyle('primary')}>
                <span className="material-icons" style={{ marginRight: '5px' }}>save</span>
                Kaydet
              </button>
              <button 
                onClick={() => {
                  setIsEditing(false);
                  setEditedProject(project);
                }} 
                style={ThemeService.getButtonStyle('secondary')}
              >
                <span className="material-icons" style={{ marginRight: '5px' }}>close</span>
                İptal
              </button>
            </>
          )}
        </div>
      </div>

      {error && (
        <div style={styles.error}>
          {error?.message || 'Proje detayları yüklenirken bir hata oluştu'}
        </div>
      )}
      {success && <div style={styles.success}>{success}</div>}

      <div style={styles.content}>
        {isEditing ? (
          <div style={styles.form}>
            <div style={styles.formGroup}>
              <label>Proje Adı:</label>
              <input
                type="text"
                value={editedProject.name}
                onChange={(e) => setEditedProject({...editedProject, name: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Lokasyon:</label>
              <input
                type="text"
                value={editedProject.location}
                onChange={(e) => setEditedProject({...editedProject, location: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Başlangıç Tarihi:</label>
              <input
                type="date"
                value={editedProject.startDate || ''}
                onChange={(e) => setEditedProject({...editedProject, startDate: e.target.value})}
                style={styles.input}
              />
            </div>
            <div style={styles.formGroup}>
              <label>Durum:</label>
              <select
                value={editedProject.status}
                onChange={(e) => setEditedProject({...editedProject, status: e.target.value})}
                style={styles.input}
              >
                <option value="Aktif">Aktif</option>
                <option value="Tamamlandı">Tamamlandı</option>
                <option value="Beklemede">Beklemede</option>
              </select>
            </div>
          </div>
        ) : (
          <>
            <div style={styles.details}>
              <div style={styles.detailGroup}>
                <label>Proje Adı:</label>
                <span>{project.name}</span>
              </div>
              <div style={styles.detailGroup}>
                <label>Lokasyon:</label>
                <span>{project.location}</span>
              </div>
              <div style={styles.detailGroup}>
                <label>Başlangıç Tarihi:</label>
                <span>{project.startDate ? new Date(project.startDate).toLocaleDateString('tr-TR') : '-'}</span>
              </div>
              <div style={styles.detailGroup}>
                <label>Durum:</label>
                <span>{project.status}</span>
              </div>
            </div>
            <AIPanel project={project} />
            
            <Box sx={{ mt: 3, mb: 3 }}>
              <FilePanel projectId={project._id} />
            </Box>

            <Grid container spacing={2}>
                <Grid item xs={12}>
                    <Box sx={{ mt: 3, p: 2, bgcolor: '#f8f9fa', borderRadius: 2 }}>
                        <Typography variant="h6" gutterBottom>
                            Aktif Modüller
                        </Typography>
                        <List>
                            {project.activeModules.map((module, index) => (
                                <ListItem key={index}>
                                    <ListItemIcon>
                                        {module === 'fire' && '🚨'}
                                        {module === 'energy' && '⚡'}
                                        {module === 'hvac' && '🌡️'}
                                        {!['fire', 'energy', 'hvac'].includes(module) && '🔧'}
                                    </ListItemIcon>
                                    <ListItemText 
                                        primary={`${module === 'fire' ? 'YANGIN' : 
                                                 module === 'energy' ? 'ENERJİ' : 
                                                 module === 'hvac' ? 'HVAC' : 
                                                 module.toUpperCase()} MODÜLÜ`}
                                        secondary={module === 'fire' ? 'Sprinkler ve algılama sistemleri' :
                                                 module === 'energy' ? 'Enerji verimliliği sistemleri' :
                                                 module === 'hvac' ? 'İklimlendirme sistemleri' :
                                                 'Özel modül'}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                </Grid>
            </Grid>

            <AIConsole project={project} />
          </>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: ThemeService.spacing.xl,
    maxWidth: '1200px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ThemeService.spacing.xl,
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: ThemeService.spacing.md
  },
  title: {
    margin: 0,
    fontSize: ThemeService.typography.fontSize.h1,
    fontWeight: ThemeService.typography.fontWeight.bold
  },
  headerButtons: {
    display: 'flex',
    gap: ThemeService.spacing.md
  },
  content: {
    backgroundColor: ThemeService.colors.white,
    padding: ThemeService.spacing.xl,
    borderRadius: ThemeService.borderRadius.lg,
    boxShadow: ThemeService.shadows.md
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.md
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.xs
  },
  input: {
    padding: ThemeService.spacing.sm,
    fontSize: ThemeService.typography.fontSize.base,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`,
    width: '100%'
  },
  details: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.md
  },
  detailGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: ThemeService.spacing.xs,
    '& label': {
      fontWeight: ThemeService.typography.fontWeight.bold,
      color: ThemeService.colors.secondary
    },
    '& span': {
      fontSize: ThemeService.typography.fontSize.lg
    }
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    marginBottom: ThemeService.spacing.md
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    marginBottom: ThemeService.spacing.md
  }
};

export default ProjectDetail; 