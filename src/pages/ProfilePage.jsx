import React from 'react';
import { useTranslation } from 'react-i18next';
import { Container, Typography, Box } from '@mui/material';

const ProfilePage = () => {
  const { t } = useTranslation();
  return (
    <Container maxWidth="md">
      <Box sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h3" gutterBottom>{t('profile')}</Typography>
        <Typography variant="body1">{t('profile')} page content goes here.</Typography>
      </Box>
    </Container>
  );
};

export default ProfilePage; 