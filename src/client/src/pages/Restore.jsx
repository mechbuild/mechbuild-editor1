import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorService from '../services/errorService';

const Restore = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];
    if (!selectedFile) {
      setError({ message: 'Lütfen bir dosya seçin' });
      return;
    }

    if (!selectedFile.name.endsWith('.zip')) {
      setError({ message: ErrorService.getErrorMessage('API', 'INVALID_FILE') });
      return;
    }

    setFile(selectedFile);
    setError(null);
  };

  const handleRestore = async () => {
    try {
      if (!file) {
        setError({ message: 'Lütfen bir yedek dosyası seçin' });
        return;
      }

      setIsLoading(true);
      setError(null);
      setSuccess(false);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/restore', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(ErrorService.getErrorMessage('API', 'RESTORE_FAILED'));
      }

      setSuccess(true);
      setFile(null);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Restore');
      setError(processedError);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <button onClick={() => navigate('/')} style={styles.homeButton}>
            <span className="material-icons" style={{ marginRight: '5px' }}>home</span>
            Ana Sayfa
          </button>
          <h1>Veritabanı Geri Yükleme</h1>
        </div>
      </div>

      {error && <div style={styles.error}>{typeof error === 'object' ? (error.message || error.msg || error.text || 'Bilinmeyen hata') : error}</div>}
      {success && <div style={styles.success}>{typeof success === 'object' ? (success.message || success.msg || success.text || 'İşlem başarılı') : success}</div>}

      <div style={styles.content}>
        <p style={styles.description}>
          Yedek dosyasını seçin ve geri yükleme işlemini başlatın.
        </p>
        <div style={styles.fileInputContainer}>
          <input
            type="file"
            accept=".zip"
            onChange={handleFileChange}
            style={styles.fileInput}
          />
          <button
            onClick={handleRestore}
            disabled={isLoading || !file}
            style={styles.restoreButton}
          >
            {isLoading ? 'Geri Yükleniyor...' : 'Geri Yükle'}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    padding: '2rem',
    maxWidth: '800px',
    margin: '0 auto',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '2rem',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem'
  },
  homeButton: {
    display: 'flex',
    alignItems: 'center',
    padding: '0.5rem 1rem',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1rem'
  },
  content: {
    backgroundColor: '#f8f9fa',
    padding: '2rem',
    borderRadius: '8px',
    textAlign: 'center'
  },
  description: {
    marginBottom: '2rem',
    fontSize: '1.1rem',
    color: '#666'
  },
  fileInputContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '1rem'
  },
  fileInput: {
    marginBottom: '1rem'
  },
  restoreButton: {
    padding: '0.75rem 1.5rem',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '1.1rem',
    opacity: props => props.disabled ? 0.6 : 1
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  },
  success: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '1rem',
    borderRadius: '4px',
    marginBottom: '1rem',
  }
};

export default Restore; 