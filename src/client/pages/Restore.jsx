import React, { useState } from 'react';
import ErrorService from '../../services/errorService';

const Restore = () => {
  const [file, setFile] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      if (selectedFile.type !== 'application/json') {
        setError(ErrorService.getErrorMessage('FILE', 'INVALID_TYPE'));
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const handleRestore = async () => {
    try {
      if (!file) {
        throw new Error(ErrorService.getErrorMessage('FILE', 'NO_FILE'));
      }

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
      setError(null);
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Restore Data');
      setError(processedError);
      setSuccess(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setError('Lütfen geçerli bir JSON dosyası yükleyin');
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const backupData = JSON.parse(e.target.result);
          const token = localStorage.getItem('token');
          const response = await fetch('http://localhost:3002/api/backup/restore', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(backupData)
          });

          const data = await response.json();

          if (!response.ok) {
            throw new Error(data.error || 'Yedekleme geri yüklenirken bir hata oluştu');
          }

          setSuccess('Yedekleme başarıyla geri yüklendi');
          setError('');
        } catch (err) {
          const processedError = await ErrorService.handleApiError(err, 'Backup');
          setError(processedError.message || 'Yedekleme geri yüklenirken bir hata oluştu');
        }
      };
      reader.readAsText(file);
    } catch (err) {
      setError('Dosya okunurken bir hata oluştu');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Veri Geri Yükleme</h2>
      
      {error && (
        <div className="error-message">
          {error.message}
        </div>
      )}

      {success && (
        <div className="success-message">
          Veri başarıyla geri yüklendi!
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ marginBottom: '1rem' }}
        />
        <button
          onClick={handleRestore}
          disabled={!file}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: file ? 'pointer' : 'not-allowed',
            opacity: file ? 1 : 0.5
          }}
        >
          Geri Yükle
        </button>
      </div>
    </div>
  );
};

export default Restore; 