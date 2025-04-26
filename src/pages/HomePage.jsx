// src/pages/HomePage.jsx
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const HomePage = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h2" gutterBottom>{t('welcome')}</Typography>
        <Typography variant="h5" color="text.secondary" paragraph>
          {t('dashboard')} | {t('projects')} | {t('settings')} | {t('profile')}
        </Typography>
        <Button variant="contained" color="primary" component={Link} to="/dashboard">
          {t('dashboard')}
        </Button>
      </Box>
    </Container>
  );
};

export default HomePage;
