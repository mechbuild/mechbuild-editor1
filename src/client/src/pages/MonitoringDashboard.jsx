import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Paper,
  Typography,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Snackbar,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction
} from '@mui/material';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import ErrorService from '../services/errorService';
import { formatDistanceToNow } from 'date-fns';
import { useNotification } from '../contexts/NotificationContext';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const MonitoringDashboard = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const [stats, setStats] = useState(null);
  const [activeRequests, setActiveRequests] = useState([]);
  const [recentRequests, setRecentRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'error' });
  const [metrics, setMetrics] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const showError = (message) => {
    setSnackbar({ open: true, message, severity: 'error' });
  };

  const showSuccess = (message) => {
    setSnackbar({ open: true, message, severity: 'success' });
  };

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const [statsRes, activeRes, recentRes] = await Promise.all([
        fetch('/api/monitoring/stats', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/monitoring/active', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }),
        fetch('/api/monitoring/recent', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        })
      ]);

      if (!statsRes.ok || !activeRes.ok || !recentRes.ok) {
        throw new Error('Failed to fetch monitoring data');
      }

      const [statsData, activeData, recentData] = await Promise.all([
        statsRes.json(),
        activeRes.json(),
        recentRes.json()
      ]);

      setStats(statsData);
      setActiveRequests(activeData);
      setRecentRequests(recentData);
      setError(null);
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Monitoring Dashboard');
      setError(errorResponse.message);
      showError(errorResponse.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadMetrics = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/monitoring/metrics', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Metrikler yüklenirken hata oluştu');
      }

      const data = await response.json();
      setMetrics(data);
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Metrics Load');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/monitoring/refresh', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Metrikler yenilenirken hata oluştu');
      }

      showNotification('Metrikler başarıyla yenilendi', 'success');
      loadMetrics();
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'Metrics Refresh');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (loading && !stats) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  const successRate = stats ? (stats.successfulRequests / stats.totalRequests) * 100 : 0;
  const errorRate = stats ? (stats.failedRequests / stats.totalRequests) * 100 : 0;

  const pieData = [
    { name: 'Success', value: stats?.successfulRequests || 0 },
    { name: 'Errors', value: stats?.failedRequests || 0 }
  ];

  const responseTimeData = recentRequests
    .slice(0, 10)
    .map(request => ({
      name: new Date(request.startTime).toLocaleTimeString(),
      time: request.responseTime
    }));

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Monitoring Dashboard
      </Typography>

      {error && (
        <Box mb={3}>
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* Overview Cards */}
        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Total Requests
            </Typography>
            <Typography variant="h4">
              {stats?.totalRequests || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Requests
            </Typography>
            <Typography variant="h4">
              {stats?.activeRequests || 0}
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Success Rate
            </Typography>
            <Typography variant="h4">
              {successRate.toFixed(1)}%
            </Typography>
          </Paper>
        </Grid>

        <Grid item xs={12} md={3}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Avg Response Time
            </Typography>
            <Typography variant="h4">
              {stats?.averageResponseTime?.toFixed(0) || 0}ms
            </Typography>
          </Paper>
        </Grid>

        {/* Charts */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Success vs Error Rate
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2, height: 300 }}>
            <Typography variant="h6" gutterBottom>
              Response Time Trend
            </Typography>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="time" stroke="#8884d8" />
              </LineChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Active Requests Table */}
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Active Requests
            </Typography>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Method</TableCell>
                    <TableCell>URL</TableCell>
                    <TableCell>Duration</TableCell>
                    <TableCell>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {activeRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell>
                        <Chip
                          label={request.method}
                          color={request.method === 'GET' ? 'success' : 'primary'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>{request.url}</TableCell>
                      <TableCell>
                        {formatDistanceToNow(request.startTime, { addSuffix: true })}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={request.status}
                          color={request.status === 'pending' ? 'warning' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Paper>
        </Grid>
      </Grid>

      <Button
        variant="contained"
        color="primary"
        onClick={handleRefresh}
        disabled={isLoading}
        sx={{ mt: 2 }}
      >
        {isLoading ? 'Yenileniyor...' : 'Yenile'}
      </Button>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default MonitoringDashboard; 