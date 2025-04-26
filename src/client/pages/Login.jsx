import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import ErrorService from '../services/ErrorService';

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3002/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Giriş yapılırken bir hata oluştu');
      }

      localStorage.setItem('token', data.token);
      navigate('/dashboard');
    } catch (err) {
      const processedError = await ErrorService.handleApiError(err, 'Authentication');
      setError(processedError.message || 'Giriş yapılırken bir hata oluştu');
    }
  };

  return (
    <div>
      {/* Form content */}
    </div>
  );
};

export default Login; 