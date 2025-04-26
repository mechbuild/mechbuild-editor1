import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Button,
  Container,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActions
} from '@mui/material';
import {
  Engineering as EngineeringIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon
} from '@mui/icons-material';
import ExampleComponent from '../components/ExampleComponent';

const HomePage = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const features = [
    {
      title: t('home.features.projectManagement'),
      description: t('home.features.projectManagementDesc'),
      icon: <EngineeringIcon sx={{ fontSize: 40 }} />,
      path: '/projects'
    },
    {
      title: t('home.features.dashboard'),
      description: t('home.features.dashboardDesc'),
      icon: <DashboardIcon sx={{ fontSize: 40 }} />,
      path: '/dashboard'
    },
    {
      title: t('home.features.settings'),
      description: t('home.features.settingsDesc'),
      icon: <SettingsIcon sx={{ fontSize: 40 }} />,
      path: '/settings'
    }
  ];

  return (
    <Container maxWidth="lg">
      <Box
        sx={{
          pt: 8,
          pb: 6
        }}
      >
        <Typography
          component="h1"
          variant="h2"
          align="center"
          color="text.primary"
          gutterBottom
        >
          {t('home.title')}
        </Typography>
        <Typography
          variant="h5"
          align="center"
          color="text.secondary"
          paragraph
        >
          {t('home.description')}
        </Typography>
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            mt: 4
          }}
        >
          <Button
            variant="contained"
            size="large"
            onClick={() => navigate('/projects')}
          >
            {t('home.getStarted')}
          </Button>
        </Box>
      </Box>
      <Grid container spacing={4}>
        {features.map((feature) => (
          <Grid item key={feature.title} xs={12} sm={6} md={4}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    mb: 2
                  }}
                >
                  {feature.icon}
                </Box>
                <Typography
                  gutterBottom
                  variant="h5"
                  component="h2"
                  align="center"
                >
                  {feature.title}
                </Typography>
                <Typography align="center">
                  {feature.description}
                </Typography>
              </CardContent>
              <CardActions>
                <Button
                  fullWidth
                  variant="outlined"
                  onClick={() => navigate(feature.path)}
                >
                  {t('common.learnMore')}
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
      <ExampleComponent />
    </Container>
  );
};

export default HomePage;
