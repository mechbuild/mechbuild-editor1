import React, { useState } from 'react';
import ThemeService from '../services/themeService';
import ErrorService from '../services/errorService';

const AIPanel = ({ project }) => {
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!question.trim()) return;

    setIsLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/ai/ask', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          question,
          projectId: project._id,
          projectContext: {
            name: project.name,
            location: project.location,
            startDate: project.startDate,
            status: project.status
          }
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'AI yanıt verirken bir hata oluştu');
      }

      setResponse(data.response);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'AI');
      setError(processedError.message || 'Bir hata oluştu');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>AI Asistan</h2>
      {error && (
        <div style={styles.error}>
          {error?.message || 'AI işlemi sırasında bir hata oluştu'}
        </div>
      )}
      
      <form onSubmit={handleSubmit} style={styles.form}>
        <div style={styles.inputContainer}>
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Projeyle ilgili bir soru sorun..."
            style={styles.input}
            disabled={isLoading}
          />
          <button
            type="submit"
            style={ThemeService.getButtonStyle('primary')}
            disabled={isLoading || !question.trim()}
          >
            {isLoading ? (
              <span className="material-icons" style={styles.loadingIcon}>sync</span>
            ) : (
              <span className="material-icons">send</span>
            )}
          </button>
        </div>
      </form>

      {response && (
        <div style={styles.responseContainer}>
          <h3 style={styles.responseTitle}>AI Yanıtı:</h3>
          <p style={styles.responseText}>{response}</p>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    marginTop: ThemeService.spacing.xl,
    padding: ThemeService.spacing.xl,
    backgroundColor: ThemeService.colors.light,
    borderRadius: ThemeService.borderRadius.lg,
    boxShadow: ThemeService.shadows.md
  },
  title: {
    margin: 0,
    marginBottom: ThemeService.spacing.lg,
    fontSize: ThemeService.typography.fontSize.h3,
    fontWeight: ThemeService.typography.fontWeight.bold,
    color: ThemeService.colors.primary
  },
  form: {
    marginBottom: ThemeService.spacing.md
  },
  inputContainer: {
    display: 'flex',
    gap: ThemeService.spacing.sm
  },
  input: {
    flex: 1,
    padding: ThemeService.spacing.sm,
    fontSize: ThemeService.typography.fontSize.base,
    borderRadius: ThemeService.borderRadius.sm,
    border: `1px solid ${ThemeService.colors.secondary}`,
    backgroundColor: ThemeService.colors.white
  },
  loadingIcon: {
    animation: 'spin 1s linear infinite'
  },
  responseContainer: {
    marginTop: ThemeService.spacing.lg,
    padding: ThemeService.spacing.lg,
    backgroundColor: ThemeService.colors.white,
    borderRadius: ThemeService.borderRadius.md,
    border: `1px solid ${ThemeService.colors.secondary}`
  },
  responseTitle: {
    margin: 0,
    marginBottom: ThemeService.spacing.sm,
    fontSize: ThemeService.typography.fontSize.large,
    fontWeight: ThemeService.typography.fontWeight.semibold,
    color: ThemeService.colors.dark
  },
  responseText: {
    margin: 0,
    fontSize: ThemeService.typography.fontSize.base,
    lineHeight: ThemeService.typography.lineHeight.normal,
    color: ThemeService.colors.dark
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: ThemeService.spacing.md,
    borderRadius: ThemeService.borderRadius.sm,
    marginBottom: ThemeService.spacing.md
  }
};

export default AIPanel; 