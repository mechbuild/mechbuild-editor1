import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box } from '@mui/material';

const DashboardPage = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>{t('dashboard')}</Typography>
        <Typography variant="body1">{t('dashboard')} page content goes here.</Typography>
      </Box>
    </Container>
  );
};

export default DashboardPage; 