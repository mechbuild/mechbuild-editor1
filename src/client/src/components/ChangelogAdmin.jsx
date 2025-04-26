import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';
import DeleteIcon from '@mui/icons-material/Delete';

const ChangelogAdmin = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [changelog, setChangelog] = useState([]);
  const [newEntry, setNewEntry] = useState({
    version: '',
    title: '',
    content: '',
    type: 'feature',
    impact: 'minor'
  });

  useEffect(() => {
    loadChangelog();
  }, []);

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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEntry(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/changelog', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newEntry)
      });

      if (!response.ok) {
        throw new Error('Failed to create changelog entry');
      }

      await loadChangelog();
      setNewEntry({
        version: '',
        title: '',
        content: '',
        type: 'feature',
        impact: 'minor'
      });
      showNotification('Changelog entry created successfully', 'success');
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Create Changelog');
      showNotification(errorResponse.message, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:3002/api/changelog/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to delete changelog entry');
      }

      await loadChangelog();
      showNotification('Changelog entry deleted successfully', 'success');
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Delete Changelog');
      showNotification(errorResponse.message, 'error');
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('changelog.createNew')}
        </Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label={t('changelog.version')}
            name="version"
            value={newEntry.version}
            onChange={handleInputChange}
            margin="normal"
            required
            helperText={t('changelog.versionHelper')}
          />
          <TextField
            fullWidth
            label={t('changelog.title')}
            name="title"
            value={newEntry.title}
            onChange={handleInputChange}
            margin="normal"
            required
          />
          <TextField
            fullWidth
            label={t('changelog.content')}
            name="content"
            value={newEntry.content}
            onChange={handleInputChange}
            margin="normal"
            required
            multiline
            rows={4}
          />
          <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
            <FormControl fullWidth>
              <InputLabel>{t('changelog.type')}</InputLabel>
              <Select
                name="type"
                value={newEntry.type}
                onChange={handleInputChange}
                label={t('changelog.type')}
              >
                <MenuItem value="feature">{t('changelog.types.feature')}</MenuItem>
                <MenuItem value="bugfix">{t('changelog.types.bugfix')}</MenuItem>
                <MenuItem value="improvement">{t('changelog.types.improvement')}</MenuItem>
                <MenuItem value="security">{t('changelog.types.security')}</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>{t('changelog.impact')}</InputLabel>
              <Select
                name="impact"
                value={newEntry.impact}
                onChange={handleInputChange}
                label={t('changelog.impact')}
              >
                <MenuItem value="major">{t('changelog.impacts.major')}</MenuItem>
                <MenuItem value="minor">{t('changelog.impacts.minor')}</MenuItem>
                <MenuItem value="patch">{t('changelog.impacts.patch')}</MenuItem>
              </Select>
            </FormControl>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mt: 2 }}
          >
            {t('changelog.create')}
          </Button>
        </form>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          {t('changelog.history')}
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
                      <Typography variant="caption" color="text.secondary">
                        ({t(`changelog.types.${entry.type}`)} • {t(`changelog.impacts.${entry.impact}`)})
                      </Typography>
                    </Box>
                  }
                  secondary={
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {entry.content}
                    </Typography>
                  }
                />
                <ListItemSecondaryAction>
                  <IconButton
                    edge="end"
                    aria-label="delete"
                    onClick={() => handleDelete(entry._id)}
                  >
                    <DeleteIcon />
                  </IconButton>
                </ListItemSecondaryAction>
              </ListItem>
              <Divider />
            </React.Fragment>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default ChangelogAdmin; 