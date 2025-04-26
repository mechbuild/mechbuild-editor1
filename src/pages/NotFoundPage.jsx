import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="sm">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h2" color="error" gutterBottom>404</Typography>
        <Typography variant="h5" gutterBottom>{t('notfound')}</Typography>
        <Button variant="contained" color="primary" component={Link} to="/">
          {t('welcome')}
        </Button>
      </Box>
    </Container>
  );
};

export default NotFoundPage; 