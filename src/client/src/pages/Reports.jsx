import React, { useState, useEffect } from 'react';
import { Box, Button, Paper, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';
import ExportService from '../services/ExportService';
import DownloadIcon from '@mui/icons-material/Download';

const Reports = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [reports, setReports] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/reports', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to load reports');
      }

      const data = await response.json();
      setReports(data);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Reports Load');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      setIsLoading(true);
      await ExportService.exportReports(reports);
      showNotification('Reports exported successfully', 'success');
    } catch (error) {
      showNotification(error.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Box sx={styles.header}>
          <Typography variant="h4" component="h1">
            {t('reports.title')}
          </Typography>
          <Button
            variant="contained"
            color="primary"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            disabled={isLoading || reports.length === 0}
          >
            {t('export')}
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>{t('reports.columns.title')}</TableCell>
                <TableCell>{t('reports.columns.type')}</TableCell>
                <TableCell>{t('reports.columns.createdAt')}</TableCell>
                <TableCell>{t('reports.columns.updatedAt')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.title}</TableCell>
                  <TableCell>{report.type}</TableCell>
                  <TableCell>{new Date(report.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell>{new Date(report.updatedAt).toLocaleDateString()}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
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
  }
};

export default Reports; 