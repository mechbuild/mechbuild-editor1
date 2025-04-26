import React, { useState, useEffect } from 'react';
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
  ResponsiveContainer
} from 'recharts';
import {
  Card,
  CardContent,
  Grid,
  Typography,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';

const MonitoringDashboard = () => {
  const [metrics, setMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch('/api/monitoring/metrics');
        const data = await response.json();
        setMetrics(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch monitoring data');
        setLoading(false);
      }
    };

    fetchMetrics();
    const interval = setInterval(fetchMetrics, 5000); // Refresh every 5 seconds

    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error">{error?.message || 'Sistem metrikleri alınırken bir hata oluştu'}</Alert>
      </Box>
    );
  }

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom>
        System Monitoring Dashboard
      </Typography>

      <Grid container spacing={3}>
        {/* System Overview */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                System Overview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">CPU Usage</Typography>
                  <Typography variant="h4">
                    {metrics?.system?.currentMetrics?.cpu?.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Memory Usage</Typography>
                  <Typography variant="h4">
                    {metrics?.system?.currentMetrics?.memory?.toFixed(1)}%
                  </Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Active Requests</Typography>
                  <Typography variant="h4">{metrics?.requests?.active}</Typography>
                </Grid>
                <Grid item xs={3}>
                  <Typography variant="subtitle2">Database Queries</Typography>
                  <Typography variant="h4">{metrics?.database?.active}</Typography>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Charts */}
        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                CPU & Memory Usage
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={metrics?.performance?.cpu}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="value" name="CPU" stroke="#8884d8" />
                  <Line type="monotone" dataKey="value" name="Memory" stroke="#82ca9d" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Response Time & Error Rate
              </Typography>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={metrics?.performance?.responseTime}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="timestamp" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="value" name="Response Time (ms)" fill="#8884d8" />
                  <Bar dataKey="value" name="Error Rate" fill="#ff7300" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Active Requests */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Active Requests
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>Method</TableCell>
                      <TableCell>Path</TableCell>
                      <TableCell>Duration</TableCell>
                      <TableCell>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {metrics?.requests?.activeRequests?.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>{request.method}</TableCell>
                        <TableCell>{request.path}</TableCell>
                        <TableCell>{request.duration}ms</TableCell>
                        <TableCell>
                          <Chip
                            label={request.status}
                            color={request.status === 'error' ? 'error' : 'primary'}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </CardContent>
          </Card>
        </Grid>

        {/* Alerts */}
        <Grid item xs={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Recent Alerts
              </Typography>
              {metrics?.alerts?.map((alert) => (
                <Alert
                  key={alert.timestamp}
                  severity={alert.severity === 'CRITICAL' ? 'error' : 'warning'}
                  sx={{ mb: 1 }}
                >
                  {alert.message}
                </Alert>
              ))}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default MonitoringDashboard; 