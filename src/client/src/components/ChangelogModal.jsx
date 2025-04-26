import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  Chip,
  Divider
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';

const ChangelogModal = ({ open, onClose, changelog }) => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();

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
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">
            {t('changelog.title')} v{changelog?.version}
          </Typography>
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Chip
              label={t(`changelog.types.${changelog?.type}`)}
              color={getTypeColor(changelog?.type)}
              size="small"
            />
            <Chip
              label={t(`changelog.impacts.${changelog?.impact}`)}
              color={getImpactColor(changelog?.impact)}
              size="small"
            />
          </Box>
        </Box>
      </DialogTitle>
      <DialogContent>
        <Typography variant="h6" gutterBottom>
          {changelog?.title}
        </Typography>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body1" sx={{ whiteSpace: 'pre-line' }}>
          {changelog?.content}
        </Typography>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          {t('common.close')}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default ChangelogModal; 