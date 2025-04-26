import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, TextField, Button } from '@mui/material';
import { useNotification } from '../context/NotificationContext';

const RegisterPage = () => {
  const { t } = useTranslation();
  const { notify } = useNotification();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email && password && password === confirm) {
      notify(t('register') + ' ' + t('success'), 'success');
    } else {
      notify(t('register') + ' ' + t('error'), 'error');
    }
  };

  return (
    <Container maxWidth="xs">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>{t('register')}</Typography>
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
          <TextField
            label="Confirm Password"
            type="password"
            fullWidth
            margin="normal"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
          />
          <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 2 }}>
            {t('register')}
          </Button>
        </form>
      </Box>
    </Container>
  );
};

export default RegisterPage; 