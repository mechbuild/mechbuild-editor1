import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, TextField, Button } from '@mui/material';
import { useAuth } from '../context/AuthContext';
import { useNotification } from '../context/NotificationContext';

const LoginPage = () => {
  const { t } = useTranslation();
  const { login } = useAuth();
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    // TODO: Replace with real API call
    if (email && password) {
      login({ email });
      notify(t('login') + ' ' + t('success'), 'success');
    } else {
      notify(t('login') + ' ' + t('error'), 'error');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>{t('login')}</Typography>
        <form onSubmit={handleSubmit}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            margin="normal"
            value={email}
            onChange={e => setEmail(e.target.value)}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            margin="normal"
            value={password}
            onChange={e => setPassword(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            {t('login')}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default LoginPage;
