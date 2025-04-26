import React, { useState, useRef, useEffect } from 'react';
import { Box, TextField, Button, Paper, Typography, CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ErrorService from '../services/errorService';
import { useNotification } from '../contexts/NotificationContext';

const AIConsole = () => {
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [prompt, setPrompt] = useState('');
  const [responses, setResponses] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [responses]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ prompt })
      });

      if (!response.ok) {
        throw new Error(t('aiConsole.error'));
      }

      const data = await response.json();
      setResponses(prev => [...prev, { prompt, response: data.response }]);
      setPrompt('');
    } catch (err) {
      const errorResponse = await ErrorService.handle(err, 'AI Chat');
      showNotification(errorResponse.message, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={styles.container}>
      <Paper elevation={3} sx={styles.consoleContainer}>
        <Typography variant="h4" component="h1" sx={styles.title}>
          {t('aiConsole.title')}
        </Typography>

        <Box sx={styles.messagesContainer}>
          {responses.map((item, index) => (
            <React.Fragment key={index}>
              <Paper elevation={1} sx={styles.promptCard}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('aiConsole.you')}
                </Typography>
                <Typography variant="body1">{item.prompt}</Typography>
              </Paper>
              <Paper elevation={1} sx={styles.responseCard}>
                <Typography variant="subtitle2" color="text.secondary">
                  {t('aiConsole.ai')}
                </Typography>
                <Typography variant="body1">{item.response}</Typography>
              </Paper>
            </React.Fragment>
          ))}
          <div ref={messagesEndRef} />
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={styles.inputContainer}>
          <TextField
            fullWidth
            multiline
            rows={2}
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder={t('aiConsole.promptPlaceholder')}
            disabled={isLoading}
            sx={styles.input}
          />
          <Button
            type="submit"
            variant="contained"
            color="primary"
            disabled={isLoading || !prompt.trim()}
            sx={styles.submitButton}
          >
            {isLoading ? <CircularProgress size={24} /> : t('aiConsole.send')}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    padding: '20px'
  },
  consoleContainer: {
    width: '100%',
    maxWidth: '800px',
    height: '80vh',
    display: 'flex',
    flexDirection: 'column',
    padding: '20px'
  },
  title: {
    textAlign: 'center',
    marginBottom: '20px'
  },
  messagesContainer: {
    flex: 1,
    overflowY: 'auto',
    marginBottom: '20px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px'
  },
  promptCard: {
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    alignSelf: 'flex-end',
    maxWidth: '80%'
  },
  responseCard: {
    padding: '10px',
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    alignSelf: 'flex-start',
    maxWidth: '80%'
  },
  inputContainer: {
    display: 'flex',
    gap: '10px'
  },
  input: {
    flex: 1
  },
  submitButton: {
    minWidth: '100px'
  }
};

export default AIConsole; 