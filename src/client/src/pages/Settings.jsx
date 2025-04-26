import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, TextField, Button, Switch, FormControlLabel, IconButton, Tabs, Tab, List, ListItem, ListItemText, Divider, Chip } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ErrorService from '../services/errorService';
import ExportService from '../services/ExportService';
import { useNotification } from '../contexts/NotificationContext';
import DownloadIcon from '@mui/icons-material/Download';
import ChangelogAdmin from '../components/ChangelogAdmin';

const Settings = ({ handleThemeChange }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [settings, setSettings] = useState({
    email: '',
    notifications: true,
    darkMode: false,
    language: 'en'
  });
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState(0);
  const [changelog, setChangelog] = useState([]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 2) { // About tab
      loadChangelog();
    }
  }, [activeTab]);

  const loadSettings = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/settings', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load settings');
      }

      const data = await response.json();
      setSettings(data);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Settings Load');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadChangelog = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/changelog', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load changelog');
      }

      const data = await response.json();
      setChangelog(data);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Load Changelog');
      showNotification(errorResponse.message, 'error');
    }
  };

  const handleChange = (event) => {
    const { name, value, checked } = event.target;
    setSettings(prev => ({
      ...prev,
      [name]: name === 'notifications' || name === 'darkMode' ? checked : value
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/settings', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(settings)
      });

      if (!response.ok) {
        throw new Error('Failed to save settings');
      }

      showNotification(t('settings.saved'), 'success');
      if (handleThemeChange) {
        handleThemeChange(settings.darkMode ? 'dark' : 'light');
      }
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Settings Save');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      await ExportService.exportSettings(settings);
      showNotification('Settings exported successfully', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const getTypeColor = (type) => {
    switch (type) {
      case 'feature':
        return 'success';
      case 'bugfix':
        return 'error';
      case 'improvement':
        return 'info';
      case 'security':
        return 'warning';
      default:
        return 'default';
    }
  };

  const getImpactColor = (impact) => {
    switch (impact) {
      case 'major':
        return 'error';
      case 'minor':
        return 'warning';
      case 'patch':
        return 'info';
      default:
        return 'default';
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          sx={{ mb: 3 }}
        >
          <Tab label={t('settings.tabs.general')} />
          <Tab label={t('settings.tabs.account')} />
          <Tab label={t('settings.tabs.about')} />
          {user?.role === 'admin' && (
            <Tab label={t('settings.tabs.changelog')} />
          )}
        </Tabs>

        {activeTab === 0 && (
          <Box>
            <Typography variant="h4" component="h1">
              {t('settings.title')}
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DownloadIcon />}
              onClick={handleExport}
              disabled={isLoading}
            >
              {t('export')}
            </Button>
          </Box>
        )}

        {activeTab === 1 && (
          <form onSubmit={handleSubmit}>
            <TextField
              fullWidth
              label={t('settings.email')}
              name="email"
              value={settings.email}
              onChange={handleChange}
              margin="normal"
              disabled={isLoading}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.notifications}
                  onChange={handleChange}
                  name="notifications"
                  disabled={isLoading}
                />
              }
              label={t('settings.notifications')}
            />

            <FormControlLabel
              control={
                <Switch
                  checked={settings.darkMode}
                  onChange={handleChange}
                  name="darkMode"
                  disabled={isLoading}
                />
              }
              label={t('settings.darkMode')}
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              sx={styles.submitButton}
              disabled={isLoading}
            >
              {isLoading ? t('settings.saving') : t('settings.save')}
            </Button>
          </form>
        )}

        {activeTab === 2 && (
          <Box>
            <Typography variant="h5" gutterBottom>
              {t('settings.about.title')}
            </Typography>
            <Typography variant="body1" paragraph>
              {t('settings.about.description')}
            </Typography>
            <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>
              {t('settings.about.changelog')}
            </Typography>
            <List>
              {changelog.map((entry) => (
                <React.Fragment key={entry._id}>
                  <ListItem>
                    <ListItemText
                      primary={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1">
                            v{entry.version} - {entry.title}
                          </Typography>
                          <Chip
                            label={t(`changelog.types.${entry.type}`)}
                            color={getTypeColor(entry.type)}
                            size="small"
                          />
                          <Chip
                            label={t(`changelog.impacts.${entry.impact}`)}
                            color={getImpactColor(entry.impact)}
                            size="small"
                          />
                        </Box>
                      }
                      secondary={
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                          {entry.content}
                        </Typography>
                      }
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))}
            </List>
          </Box>
        )}

        {activeTab === 3 && user?.role === 'admin' && (
          <ChangelogAdmin />
        )}
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
  },
  submitButton: {
    marginTop: '20px'
  }
};

export default Settings; 