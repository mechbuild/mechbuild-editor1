import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  Memory as MemoryIcon,
  Storage as StorageIcon,
  Speed as SpeedIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const PerformanceDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('1h');

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const [realtime, historical] = await Promise.all([
        axios.get('/api/metrics/realtime'),
        axios.get('/api/metrics/historical')
      ]);

      setMetrics({
        realtime: realtime.data,
        historical: historical.data
      });
      setError(null);
    } catch (err) {
      setError('Metrikler alınırken hata oluştu');
      console.error('Metrik hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    const interval = setInterval(fetchMetrics, 30000); // Her 30 saniyede bir güncelle
    return () => clearInterval(interval);
  }, []);

  const renderMetricCard = (title, value, icon, color) => (
    <Paper sx={{ p: 2, height: '100%' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        {icon}
        <Typography variant="h6" sx={{ ml: 1 }}>{title}</Typography>
      </Box>
      <Typography variant="h4" color={color}>{value}</Typography>
    </Paper>
  );

  const renderChart = (data, dataKey, color) => (
    <ResponsiveContainer width="100%" height={200}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" />
        <YAxis />
        <RechartsTooltip />
        <Line type="monotone" dataKey={dataKey} stroke={color} />
      </LineChart>
    </ResponsiveContainer>
  );

  const renderAlerts = () => {
    if (!metrics?.realtime?.alerts?.length) return null;

    return (
      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Uyarılar</Typography>
        <List>
          {metrics.realtime.alerts.map((alert, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                {alert.severity === 'error' ? <ErrorIcon color="error" /> : <WarningIcon color="warning" />}
              </ListItemIcon>
              <ListItemText
                primary={alert.message}
                secondary={`Tarih: ${new Date(alert.timestamp).toLocaleString()}`}
              />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  const renderRecommendations = () => {
    if (!metrics?.realtime?.recommendations?.length) return null;

    return (
      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" sx={{ mb: 1 }}>Öneriler</Typography>
        <List>
          {metrics.realtime.recommendations.map((rec, index) => (
            <ListItem key={index}>
              <ListItemIcon>
                <AssessmentIcon color="primary" />
              </ListItemIcon>
              <ListItemText primary={rec.message} />
            </ListItem>
          ))}
        </List>
      </Paper>
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="error">{error?.message || 'Performans metrikleri alınırken bir hata oluştu'}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Performans Paneli</Typography>
        <Box>
          <Tooltip title="Yenile">
            <IconButton onClick={fetchMetrics}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          {renderMetricCard(
            'CPU Kullanımı',
            `${metrics?.realtime?.system?.cpu?.usage || 0}%`,
            <MemoryIcon color={metrics?.realtime?.system?.cpu?.status === 'warning' ? 'error' : 'primary'} />,
            metrics?.realtime?.system?.cpu?.status === 'warning' ? 'error' : 'primary'
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderMetricCard(
            'Bellek Kullanımı',
            `${metrics?.realtime?.system?.memory?.usage || 0}%`,
            <StorageIcon color={metrics?.realtime?.system?.memory?.status === 'warning' ? 'error' : 'primary'} />,
            metrics?.realtime?.system?.memory?.status === 'warning' ? 'error' : 'primary'
          )}
        </Grid>
        <Grid item xs={12} md={4}>
          {renderMetricCard(
            'Yanıt Süresi',
            `${metrics?.realtime?.application?.responseTimes?.p95 || 0}ms`,
            <SpeedIcon color={metrics?.realtime?.application?.responseTimes?.status === 'warning' ? 'error' : 'primary'} />,
            metrics?.realtime?.application?.responseTimes?.status === 'warning' ? 'error' : 'primary'
          )}
        </Grid>
      </Grid>

      <Grid container spacing={2}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>Performans Trendi</Typography>
            {renderChart(metrics?.historical?.metrics?.system?.cpu || [], 'usage', '#8884d8')}
            <Divider sx={{ my: 2 }} />
            {renderChart(metrics?.historical?.metrics?.system?.memory || [], 'usage', '#82ca9d')}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          {renderAlerts()}
          {renderRecommendations()}
        </Grid>
      </Grid>

      <Box sx={{ mt: 2 }}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Veritabanı Metrikleri</Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={4}>
              {renderMetricCard(
                'Sorgu Süresi',
                `${metrics?.realtime?.database?.queryTime || 0}ms`,
                <TimelineIcon color={metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'} />,
                metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderMetricCard(
                'Aktif Bağlantılar',
                metrics?.realtime?.database?.connections || 0,
                <AssessmentIcon color={metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'} />,
                metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'
              )}
            </Grid>
            <Grid item xs={12} md={4}>
              {renderMetricCard(
                'Önbellek İsabet Oranı',
                `${((metrics?.realtime?.database?.cacheHitRate || 0) * 100).toFixed(2)}%`,
                <MemoryIcon color={metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'} />,
                metrics?.realtime?.database?.status === 'warning' ? 'error' : 'primary'
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
};

export default PerformanceDashboard; 