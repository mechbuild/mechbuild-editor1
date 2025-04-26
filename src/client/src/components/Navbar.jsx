import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AppBar, Toolbar, Button, Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';
import ThemeService from '../services/themeService';
import LanguageSelector from './LanguageSelector';
import AdminPanelIcon from '@mui/icons-material/AdminPanelSettings';
import jwt_decode from 'jwt-decode';
import { useNotification } from '../contexts/NotificationContext';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationCenter from './NotificationCenter';

const Navbar = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { showNotification } = useNotification();
  const [user, setUser] = useState(null);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    navigate('/');
    window.location.reload();
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Decode token to get user info
      const decoded = jwt_decode(token);
      setUser(decoded);
    }
  }, []);

  return (
    <AppBar position="static" sx={styles.appBar}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
          MechBuildPro
        </Typography>
        <Box sx={styles.navLinks}>
          <Button color="inherit" component={Link} to="/">
            {t('navbar.home')}
          </Button>
          <Button color="inherit" component={Link} to="/projects">
            {t('navbar.projects')}
          </Button>
          <Button color="inherit" component={Link} to="/dashboard">
            {t('navbar.dashboard')}
          </Button>
          <Button color="inherit" component={Link} to="/map">
            {t('navbar.map')}
          </Button>
          <Button color="inherit" component={Link} to="/monitoring">
            {t('navbar.monitoring')}
          </Button>
          <Button color="inherit" component={Link} to="/ai-console">
            {t('navbar.aiConsole')}
          </Button>
          <Button 
            color="inherit" 
            component={Link} 
            to="/ai-report"
            startIcon={<DescriptionIcon />}
          >
            {t('navbar.aiReport')}
          </Button>
          {user?.role === 'admin' && (
            <Button 
              color="inherit" 
              component={Link} 
              to="/admin"
              startIcon={<AdminPanelIcon />}
            >
              {t('navbar.admin')}
            </Button>
          )}
          <Button color="inherit" component={Link} to="/settings">
            {t('navbar.settings')}
          </Button>
        </Box>
        <Box sx={styles.rightSection}>
          <NotificationCenter />
          <LanguageSelector />
          <Button color="inherit" onClick={handleLogout}>
            {t('navbar.logout')}
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

const styles = {
  appBar: {
    backgroundColor: ThemeService.colors.primary,
    marginBottom: ThemeService.spacing.xl
  },
  navLinks: {
    flexGrow: 1,
    display: 'flex',
    gap: ThemeService.spacing.md
  },
  rightSection: {
    display: 'flex',
    alignItems: 'center',
    gap: ThemeService.spacing.md
  }
};

export default Navbar; 