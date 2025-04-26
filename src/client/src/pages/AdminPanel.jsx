import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Paper, 
  Typography, 
  Tabs, 
  Tab, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  IconButton,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';
import DeleteIcon from '@mui/icons-material/Delete';
import AdminPanelIcon from '@mui/icons-material/AdminPanelSettings';
import HistoryIcon from '@mui/icons-material/History';
import SettingsIcon from '@mui/icons-material/Settings';

const AdminPanel = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [activeTab, setActiveTab] = useState(0);
  const [users, setUsers] = useState([]);
  const [apiLogs, setApiLogs] = useState([]);
  const [settingsAudit, setSettingsAudit] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, userId: null });
  const [promoteDialog, setPromoteDialog] = useState({ open: false, userId: null });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      let response;

      switch (activeTab) {
        case 0:
          response = await fetch('http://localhost:3002/api/admin/users', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const usersData = await response.json();
          setUsers(usersData);
          break;
        case 1:
          response = await fetch('http://localhost:3002/api/admin/logs', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const logsData = await response.json();
          setApiLogs(logsData);
          break;
        case 2:
          response = await fetch('http://localhost:3002/api/admin/audit', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const auditData = await response.json();
          setSettingsAudit(auditData);
          break;
      }
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Admin Panel Load');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteUser = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/admin/users/${deleteDialog.userId}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete user');
      }

      showNotification('User deleted successfully', 'success');
      setDeleteDialog({ open: false, userId: null });
      loadData();
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Delete User');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePromoteUser = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/admin/users/${promoteDialog.userId}/promote`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to promote user');
      }

      showNotification('User promoted successfully', 'success');
      setPromoteDialog({ open: false, userId: null });
      loadData();
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Promote User');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const renderUsersTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('admin.users.email')}</TableCell>
            <TableCell>{t('admin.users.role')}</TableCell>
            <TableCell>{t('admin.users.createdAt')}</TableCell>
            <TableCell>{t('admin.users.actions')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {users.map((user) => (
            <TableRow key={user._id}>
              <TableCell>{user.email}</TableCell>
              <TableCell>
                <Chip 
                  label={user.role} 
                  color={user.role === 'admin' ? 'primary' : 'default'}
                />
              </TableCell>
              <TableCell>{new Date(user.createdAt).toLocaleString()}</TableCell>
              <TableCell>
                <IconButton 
                  onClick={() => setDeleteDialog({ open: true, userId: user._id })}
                  disabled={user.role === 'admin'}
                >
                  <DeleteIcon />
                </IconButton>
                <IconButton 
                  onClick={() => setPromoteDialog({ open: true, userId: user._id })}
                  disabled={user.role === 'admin'}
                >
                  <AdminPanelIcon />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderApiLogsTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('admin.logs.endpoint')}</TableCell>
            <TableCell>{t('admin.logs.method')}</TableCell>
            <TableCell>{t('admin.logs.status')}</TableCell>
            <TableCell>{t('admin.logs.user')}</TableCell>
            <TableCell>{t('admin.logs.timestamp')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {apiLogs.map((log) => (
            <TableRow key={log._id}>
              <TableCell>{log.endpoint}</TableCell>
              <TableCell>{log.method}</TableCell>
              <TableCell>
                <Chip 
                  label={log.status} 
                  color={log.status >= 400 ? 'error' : 'success'}
                />
              </TableCell>
              <TableCell>{log.userEmail}</TableCell>
              <TableCell>{new Date(log.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderSettingsAuditTable = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>{t('admin.audit.setting')}</TableCell>
            <TableCell>{t('admin.audit.oldValue')}</TableCell>
            <TableCell>{t('admin.audit.newValue')}</TableCell>
            <TableCell>{t('admin.audit.user')}</TableCell>
            <TableCell>{t('admin.audit.timestamp')}</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {settingsAudit.map((audit) => (
            <TableRow key={audit._id}>
              <TableCell>{audit.setting}</TableCell>
              <TableCell>{audit.oldValue}</TableCell>
              <TableCell>{audit.newValue}</TableCell>
              <TableCell>{audit.userEmail}</TableCell>
              <TableCell>{new Date(audit.timestamp).toLocaleString()}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          {t('admin.title')}
        </Typography>

        <Tabs 
          value={activeTab} 
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={styles.tabs}
        >
          <Tab icon={<AdminPanelIcon />} label={t('admin.tabs.users')} />
          <Tab icon={<HistoryIcon />} label={t('admin.tabs.logs')} />
          <Tab icon={<SettingsIcon />} label={t('admin.tabs.audit')} />
        </Tabs>

        <Box sx={styles.content}>
          {activeTab === 0 && renderUsersTable()}
          {activeTab === 1 && renderApiLogsTable()}
          {activeTab === 2 && renderSettingsAuditTable()}
        </Box>
      </Paper>

      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, userId: null })}>
        <DialogTitle>{t('admin.users.deleteConfirm')}</DialogTitle>
        <DialogContent>
          {t('admin.users.deleteWarning')}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteDialog({ open: false, userId: null })}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleDeleteUser} color="error" disabled={isLoading}>
            {t('common.delete')}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={promoteDialog.open} onClose={() => setPromoteDialog({ open: false, userId: null })}>
        <DialogTitle>{t('admin.users.promoteConfirm')}</DialogTitle>
        <DialogContent>
          {t('admin.users.promoteWarning')}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPromoteDialog({ open: false, userId: null })}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handlePromoteUser} color="primary" disabled={isLoading}>
            {t('common.promote')}
          </Button>
        </DialogActions>
      </Dialog>
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
  title: {
    marginBottom: '20px'
  },
  tabs: {
    marginBottom: '20px'
  },
  content: {
    marginTop: '20px'
  }
};

export default AdminPanel; 