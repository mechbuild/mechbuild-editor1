import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Grid,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Button,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import {
  Download as DownloadIcon,
  Refresh as RefreshIcon,
  Timeline as TimelineIcon,
  Assessment as AssessmentIcon
} from '@mui/icons-material';
import axios from 'axios';
import { saveAs } from 'file-saver';

const PerformanceReport = () => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [timeRange, setTimeRange] = useState('24h');
  const [reportType, setReportType] = useState('summary');

  const timeRanges = [
    { value: '1h', label: 'Son 1 Saat' },
    { value: '6h', label: 'Son 6 Saat' },
    { value: '24h', label: 'Son 24 Saat' },
    { value: '7d', label: 'Son 7 Gün' },
    { value: '30d', label: 'Son 30 Gün' }
  ];

  const reportTypes = [
    { value: 'summary', label: 'Özet Rapor' },
    { value: 'detailed', label: 'Detaylı Rapor' },
    { value: 'trends', label: 'Trend Analizi' },
    { value: 'alerts', label: 'Uyarı Raporu' }
  ];

  const fetchReportData = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/metrics/report?range=${timeRange}&type=${reportType}`);
      setReportData(response.data);
      setError(null);
    } catch (err) {
      setError('Rapor verileri alınırken hata oluştu');
      console.error('Rapor hatası:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [timeRange, reportType]);

  const handleDownload = async () => {
    try {
      const response = await axios.get(`/api/metrics/report/export?range=${timeRange}&type=${reportType}`, {
        responseType: 'blob'
      });
      saveAs(response.data, `performans-raporu-${new Date().toISOString()}.pdf`);
    } catch (err) {
      console.error('Rapor indirme hatası:', err);
    }
  };

  const renderSummaryReport = () => (
    <Grid container spacing={2}>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Performans Özeti</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Metrik</TableCell>
                  <TableCell align="right">Ortalama</TableCell>
                  <TableCell align="right">Maksimum</TableCell>
                  <TableCell align="right">Minimum</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>CPU Kullanımı</TableCell>
                  <TableCell align="right">{reportData?.summary?.cpu?.average}%</TableCell>
                  <TableCell align="right">{reportData?.summary?.cpu?.max}%</TableCell>
                  <TableCell align="right">{reportData?.summary?.cpu?.min}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Bellek Kullanımı</TableCell>
                  <TableCell align="right">{reportData?.summary?.memory?.average}%</TableCell>
                  <TableCell align="right">{reportData?.summary?.memory?.max}%</TableCell>
                  <TableCell align="right">{reportData?.summary?.memory?.min}%</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>Yanıt Süresi</TableCell>
                  <TableCell align="right">{reportData?.summary?.responseTime?.average}ms</TableCell>
                  <TableCell align="right">{reportData?.summary?.responseTime?.max}ms</TableCell>
                  <TableCell align="right">{reportData?.summary?.responseTime?.min}ms</TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
      <Grid item xs={12} md={6}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Performans Trendi</Typography>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={reportData?.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Bellek" />
              <Line type="monotone" dataKey="responseTime" stroke="#ffc658" name="Yanıt Süresi" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderDetailedReport = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Detaylı Performans Analizi</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={reportData?.detailed}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="metric" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Bar dataKey="value" fill="#8884d8" name="Değer" />
              <Bar dataKey="threshold" fill="#82ca9d" name="Eşik" />
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderTrendsReport = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Uzun Vadeli Trendler</Typography>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={reportData?.trends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="timestamp" />
              <YAxis />
              <RechartsTooltip />
              <Legend />
              <Line type="monotone" dataKey="cpu" stroke="#8884d8" name="CPU" />
              <Line type="monotone" dataKey="memory" stroke="#82ca9d" name="Bellek" />
              <Line type="monotone" dataKey="responseTime" stroke="#ffc658" name="Yanıt Süresi" />
            </LineChart>
          </ResponsiveContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderAlertsReport = () => (
    <Grid container spacing={2}>
      <Grid item xs={12}>
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>Uyarı ve Öneriler</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Tarih</TableCell>
                  <TableCell>Tip</TableCell>
                  <TableCell>Mesaj</TableCell>
                  <TableCell>Öneri</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reportData?.alerts?.map((alert, index) => (
                  <TableRow key={index}>
                    <TableCell>{new Date(alert.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{alert.type}</TableCell>
                    <TableCell>{alert.message}</TableCell>
                    <TableCell>{alert.recommendation}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Paper>
      </Grid>
    </Grid>
  );

  const renderReport = () => {
    switch (reportType) {
      case 'summary':
        return renderSummaryReport();
      case 'detailed':
        return renderDetailedReport();
      case 'trends':
        return renderTrendsReport();
      case 'alerts':
        return renderAlertsReport();
      default:
        return null;
    }
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
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="h4">Performans Raporu</Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Zaman Aralığı</InputLabel>
            <Select
              value={timeRange}
              label="Zaman Aralığı"
              onChange={(e) => setTimeRange(e.target.value)}
            >
              {timeRanges.map((range) => (
                <MenuItem key={range.value} value={range.value}>
                  {range.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControl sx={{ minWidth: 120 }}>
            <InputLabel>Rapor Tipi</InputLabel>
            <Select
              value={reportType}
              label="Rapor Tipi"
              onChange={(e) => setReportType(e.target.value)}
            >
              {reportTypes.map((type) => (
                <MenuItem key={type.value} value={type.value}>
                  {type.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Tooltip title="Raporu Yenile">
            <IconButton onClick={fetchReportData}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Raporu İndir">
            <IconButton onClick={handleDownload}>
              <DownloadIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {renderReport()}
    </Box>
  );
};

export default PerformanceReport; 