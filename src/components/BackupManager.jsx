import React, { useState, useEffect } from 'react';
import { useUser } from '../context/UserContext';
import { backupProject, restoreProject, autoBackup, cleanupBackups } from '../services/backup';
import { AppError } from '../services/errorHandler';
import { toast } from 'react-toastify';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  TextField,
  Grid,
  Alert
} from '@mui/material';
import {
  Backup as BackupIcon,
  Restore as RestoreIcon,
  Delete as DeleteIcon,
  Refresh as RefreshIcon,
  AutoFixHigh as AutoFixHighIcon,
  Security as SecurityIcon
} from '@mui/icons-material';
import ErrorService from '../services/errorService';

const BackupManager = () => {
  const { user } = useUser();
  const [backups, setBackups] = useState([]);
  const [loading, setLoading] = useState(false);
  const [restoreDialog, setRestoreDialog] = useState(false);
  const [selectedBackup, setSelectedBackup] = useState(null);
  const [restorePath, setRestorePath] = useState('');
  const [permissions, setPermissions] = useState({
    canBackup: false,
    canRestore: false,
    canCleanup: false
  });
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user) {
      checkPermissions();
      loadBackups();
    }
  }, [user]);

  const checkPermissions = async () => {
    try {
      const canBackup = await checkPermission(user.id, 'backup:create');
      const canRestore = await checkPermission(user.id, 'backup:restore');
      const canCleanup = await checkPermission(user.id, 'backup:cleanup');
      
      setPermissions({
        canBackup,
        canRestore,
        canCleanup
      });
    } catch (error) {
      toast.error('Yetki kontrolü sırasında bir hata oluştu');
    }
  };

  const loadBackups = async () => {
    try {
      setLoading(true);
      const result = await autoBackup(user.id);
      if (result.status === 'success') {
        setBackups(result.backups);
      }
    } catch (error) {
      toast.error('Yedekler yüklenirken bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const handleBackup = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await backupProject('/mnt/data/projects', user.id);
      if (result.status === 'success') {
        toast.success('Yedekleme başarıyla tamamlandı');
        loadBackups();
      }
    } catch (err) {
      const processedError = await ErrorService.handleSystemError(err, 'Backup');
      setError(processedError);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await restoreProject(selectedBackup.backupPath, restorePath, user.id);
      if (result.status === 'success') {
        toast.success('Geri yükleme başarıyla tamamlandı');
        setRestoreDialog(false);
      }
    } catch (err) {
      const processedError = await ErrorService.handleSystemError(err, 'Restore');
      setError(processedError);
    } finally {
      setLoading(false);
    }
  };

  const handleCleanup = async () => {
    try {
      setLoading(true);
      const result = await cleanupBackups(7 * 24 * 60 * 60 * 1000, user.id); // 7 gün
      if (result.status === 'success') {
        toast.success(`${result.deleted.length} eski yedek silindi`);
        loadBackups();
      }
    } catch (error) {
      toast.error('Yedek temizleme sırasında bir hata oluştu');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleString('tr-TR');
  };

  const formatSize = (bytes) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Byte';
    const i = parseInt(Math.floor(Math.log(bytes) / Math.log(1024)));
    return Math.round(bytes / Math.pow(1024, i), 2) + ' ' + sizes[i];
  };

  if (!user) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="warning">
          Yedekleme işlemleri için giriş yapmanız gerekmektedir.
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Card>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            Yedekleme Yönetimi
          </Typography>

          {!permissions.canBackup && !permissions.canRestore && !permissions.canCleanup && (
            <Alert severity="error" sx={{ mb: 2 }}>
              Bu sayfaya erişim yetkiniz bulunmamaktadır.
            </Alert>
          )}

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error.message}
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mb: 3 }}>
            {permissions.canBackup && (
              <Grid item>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<BackupIcon />}
                  onClick={handleBackup}
                  disabled={loading}
                  startIcon={loading && <CircularProgress size={20} />}
                >
                  Yedekle
                </Button>
              </Grid>
            )}
            {permissions.canCleanup && (
              <Grid item>
                <Button
                  variant="contained"
                  color="secondary"
                  startIcon={<AutoFixHighIcon />}
                  onClick={handleCleanup}
                  disabled={loading}
                >
                  Eski Yedekleri Temizle
                </Button>
              </Grid>
            )}
            <Grid item>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={loadBackups}
                disabled={loading}
              >
                Yenile
              </Button>
            </Grid>
          </Grid>

          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <List>
              {backups.map((backup) => (
                <ListItem key={backup.backupPath}>
                  <ListItemText
                    primary={`Yedek: ${formatDate(backup.timestamp)}`}
                    secondary={`Boyut: ${formatSize(backup.size)}`}
                  />
                  {permissions.canRestore && (
                    <ListItemSecondaryAction>
                      <IconButton
                        edge="end"
                        aria-label="restore"
                        onClick={() => {
                          setSelectedBackup(backup);
                          setRestoreDialog(true);
                        }}
                      >
                        <RestoreIcon />
                      </IconButton>
                    </ListItemSecondaryAction>
                  )}
                </ListItem>
              ))}
            </List>
          )}
        </CardContent>
      </Card>

      <Dialog open={restoreDialog} onClose={() => setRestoreDialog(false)}>
        <DialogTitle>Geri Yükleme</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Geri Yükleme Yolu"
            fullWidth
            value={restorePath}
            onChange={(e) => setRestorePath(e.target.value)}
            placeholder="/mnt/data/projects/restored-project"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRestoreDialog(false)}>İptal</Button>
          <Button onClick={handleRestore} color="primary" disabled={!restorePath}>
            Geri Yükle
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BackupManager; 