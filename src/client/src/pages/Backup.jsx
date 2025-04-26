import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Box, Typography, Paper, List, ListItem, ListItemText, ListItemSecondaryAction } from '@mui/material';
import ErrorService from '../services/errorService';
import { useNotification } from '../contexts/NotificationContext';

const Backup = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [backups, setBackups] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadBackups();
  }, []);

  const loadBackups = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/backup/list', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Yedekler yüklenirken hata oluştu');
      }

      const data = await response.json();
      setBackups(data);
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Backup Load');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateBackup = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Yedek oluşturulurken hata oluştu');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showNotification('Yedek başarıyla oluşturuldu', 'success');
      loadBackups();
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Backup Create');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteBackup = async (filename) => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/backup/delete/${filename}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Yedek silinirken hata oluştu');
      }

      showNotification('Yedek başarıyla silindi', 'success');
      loadBackups();
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Backup Delete');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.formContainer}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          Yedekleme
        </Typography>

        <Button
          variant="contained"
          color="primary"
          onClick={handleCreateBackup}
          disabled={isLoading}
          sx={{ mb: 2 }}
        >
          {isLoading ? 'Yedekleniyor...' : 'Yeni Yedek Oluştur'}
        </Button>

        <List>
          {backups.map((backup) => (
            <ListItem key={backup.filename}>
              <ListItemText
                primary={backup.filename}
                secondary={`Oluşturulma: ${new Date(backup.createdAt).toLocaleString()}`}
              />
              <ListItemSecondaryAction>
                <Button
                  variant="outlined"
                  color="error"
                  onClick={() => handleDeleteBackup(backup.filename)}
                  disabled={isLoading}
                >
                  Sil
                </Button>
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  formContainer: {
    padding: '20px',
    width: '100%',
    maxWidth: '800px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px'
  }
};

export default Backup; 