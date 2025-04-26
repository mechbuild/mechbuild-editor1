import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Select,
  MenuItem,
  Button,
  TextField,
  CircularProgress,
  Rating,
  IconButton,
  Alert,
  FormControl,
  InputLabel
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNotification } from '../contexts/NotificationContext';
import ErrorService from '../services/errorService';
import DownloadIcon from '@mui/icons-material/Download';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import { saveAs } from 'file-saver';
import { Document, Packer, Paragraph, TextRun } from 'docx';

const AIReportGenerator = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [report, setReport] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState({ rating: 0, comment: '' });
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    loadProjects();
  }, []);

  const loadProjects = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/projects', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (!response.ok) {
        throw new Error('Failed to load projects');
      }

      const data = await response.json();
      setProjects(data);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Load Projects');
      showNotification(errorResponse.message, 'error');
    }
  };

  const handleGenerateReport = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/generate-report', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ projectId: selectedProject })
      });

      if (!response.ok) {
        throw new Error('Failed to generate report');
      }

      const data = await response.json();
      setReport(data.report);
      setShowFeedback(true);
      showNotification('Report generated successfully', 'success');
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Generate Report');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({
                  text: report,
                  bold: true,
                  size: 24
                })
              ]
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      saveAs(blob, `AI_Report_${selectedProject}_${new Date().toISOString()}.docx`);
      showNotification('Report downloaded successfully', 'success');
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Download Report');
      showNotification(errorResponse.message, 'error');
    }
  };

  const handleSubmitFeedback = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/feedback', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          projectId: selectedProject,
          rating: feedback.rating,
          comment: feedback.comment
        })
      });

      if (!response.ok) {
        throw new Error('Failed to submit feedback');
      }

      showNotification('Feedback submitted successfully', 'success');
      setFeedback({ rating: 0, comment: '' });
      setShowFeedback(false);
    } catch (error) {
      const errorResponse = await ErrorService.handle(error, 'Submit Feedback');
      showNotification(errorResponse.message, 'error');
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.paper}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          {t('aiReport.title')}
        </Typography>

        <FormControl fullWidth sx={styles.formControl}>
          <InputLabel>{t('aiReport.selectProject')}</InputLabel>
          <Select
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            label={t('aiReport.selectProject')}
          >
            {projects.map((project) => (
              <MenuItem key={project._id} value={project._id}>
                {project.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Button
          variant="contained"
          color="primary"
          onClick={handleGenerateReport}
          disabled={!selectedProject || isLoading}
          sx={styles.generateButton}
        >
          {isLoading ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            t('aiReport.generate')
          )}
        </Button>

        {report && (
          <Paper elevation={2} sx={styles.reportContainer}>
            <Box sx={styles.reportHeader}>
              <Typography variant="h6">
                {t('aiReport.generatedReport')}
              </Typography>
              <IconButton onClick={handleDownload} color="primary">
                <DownloadIcon />
              </IconButton>
            </Box>
            <Typography sx={styles.reportContent}>
              {report}
            </Typography>
          </Paper>
        )}

        {showFeedback && (
          <Paper elevation={2} sx={styles.feedbackContainer}>
            <Typography variant="h6" sx={styles.feedbackTitle}>
              {t('aiReport.feedback')}
            </Typography>
            <Box sx={styles.ratingContainer}>
              <Typography>{t('aiReport.rating')}</Typography>
              <Rating
                value={feedback.rating}
                onChange={(event, newValue) => {
                  setFeedback({ ...feedback, rating: newValue });
                }}
              />
            </Box>
            <TextField
              fullWidth
              multiline
              rows={4}
              label={t('aiReport.comment')}
              value={feedback.comment}
              onChange={(e) => setFeedback({ ...feedback, comment: e.target.value })}
              sx={styles.commentField}
            />
            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmitFeedback}
              disabled={feedback.rating === 0}
              sx={styles.submitButton}
            >
              {t('aiReport.submitFeedback')}
            </Button>
          </Paper>
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
  title: {
    marginBottom: '20px'
  },
  formControl: {
    marginBottom: '20px'
  },
  generateButton: {
    marginBottom: '20px'
  },
  reportContainer: {
    padding: '20px',
    marginBottom: '20px'
  },
  reportHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '10px'
  },
  reportContent: {
    whiteSpace: 'pre-wrap'
  },
  feedbackContainer: {
    padding: '20px'
  },
  feedbackTitle: {
    marginBottom: '20px'
  },
  ratingContainer: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    marginBottom: '20px'
  },
  commentField: {
    marginBottom: '20px'
  },
  submitButton: {
    width: '100%'
  }
};

export default AIReportGenerator; 