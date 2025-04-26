import React, { useState } from 'react';
import ErrorService from '../../services/errorService';

const Backup = () => {
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleBackup = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:3002/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Yedekleme oluşturulurken bir hata oluştu');
      }

      // Trigger download
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${new Date().toISOString()}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      setSuccess('Yedekleme başarıyla oluşturuldu');
      setError('');
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Backup');
      setError(processedError.message || 'Yedekleme oluşturulurken bir hata oluştu');
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <h2>Veri Yedekleme</h2>
      
      {error && (
        <div className="error-message">
          {error?.message || 'Yedekleme işlemi sırasında bir hata oluştu'}
        </div>
      )}

      {success && (
        <div className="success-message">
          {success}
        </div>
      )}

      <div style={{ marginTop: '1rem' }}>
        <button
          onClick={handleBackup}
          disabled={isLoading}
          style={{
            padding: '0.5rem 1.5rem',
            background: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.5 : 1
          }}
        >
          {isLoading ? 'Yedekleniyor...' : 'Yedekle'}
        </button>
      </div>
    </div>
  );
};

export default Backup; 