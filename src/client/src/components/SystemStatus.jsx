import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  IconButton,
  CircularProgress,
  Tooltip
} from '@mui/material';
import {
  CheckCircle as CheckCircleIcon,
  Warning as WarningIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon
} from '@mui/icons-material';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';

const ServiceCard = ({ service, status, lastChecked, t }) => {
  const getStatusColor = () => {
    switch (status) {
      case 'ok':
        return 'success.main';
      case 'warning':
        return 'warning.main';
      case 'error':
        return 'error.main';
      default:
        return 'text.secondary';
    }
  };

  const getStatusIcon = () => {
    switch (status) {
      case 'ok':
        return <CheckCircleIcon color="success" />;
      case 'warning':
        return <WarningIcon color="warning" />;
      case 'error':
        return <ErrorIcon color="error" />;
      default:
        return <CircularProgress size={24} />;
    }
  };

  return (
    <Card>
      <CardContent>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="h6" component="div">
            {t(`systemStatus.services.${service}`)}
          </Typography>
          {getStatusIcon()}
        </Box>
        <Typography variant="body2" color={getStatusColor()} sx={{ mt: 1 }}>
          {t(`systemStatus.${status}`)}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('systemStatus.lastChecked')}: {lastChecked}
        </Typography>
      </CardContent>
    </Card>
  );
};

const SystemStatus = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [status, setStatus] = useState({
    auth: { status: 'checking', lastChecked: '-' },
    db: { status: 'checking', lastChecked: '-' },
    ai: { status: 'checking', lastChecked: '-' },
    monitoring: { status: 'checking', lastChecked: '-' }
  });

  const checkService = async (serviceName) => {
    try {
      const response = await fetch(`http://localhost:3002/api/health/${serviceName}`);
      const data = await response.json();
      
      setStatus(prev => ({
        ...prev,
        [serviceName]: {
          status: data.status,
          lastChecked: new Date().toLocaleTimeString()
        }
      }));
    } catch (error) {
      ErrorService.handle(error);
      setStatus(prev => ({
        ...prev,
        [serviceName]: {
          status: 'error',
          lastChecked: new Date().toLocaleTimeString()
        }
      }));
    }
  };

  const checkAllServices = () => {
    Object.keys(status).forEach(service => {
      checkService(service);
    });
  };

  useEffect(() => {
    checkAllServices();
    const interval = setInterval(checkAllServices, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" component="h2">
          {t('systemStatus.title')}
        </Typography>
        <Tooltip title={t('systemStatus.refresh')}>
          <IconButton onClick={checkAllServices}>
            <RefreshIcon />
          </IconButton>
        </Tooltip>
      </Box>
      <Grid container spacing={2}>
        {Object.entries(status).map(([service, { status, lastChecked }]) => (
          <Grid item xs={12} sm={6} md={3} key={service}>
            <ServiceCard
              service={service}
              status={status}
              lastChecked={lastChecked}
              t={t}
            />
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default SystemStatus; 