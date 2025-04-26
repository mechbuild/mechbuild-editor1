import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Container,
  Grid,
  Paper,
  Typography,
  Button,
  Box,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControlLabel,
  Switch,
  InputAdornment,
  Alert,
  CircularProgress
} from '@mui/material';
import { Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { CreditCard, CalendarToday, Security } from '@mui/icons-material';

const SubscriptionPlans = () => {
  const [plans, setPlans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [paymentInfo, setPaymentInfo] = useState({
    cardNumber: '',
    expiryDate: '',
    cvv: '',
    autoRenew: true
  });

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const response = await axios.get('http://localhost:3001/api/subscriptions/plans');
        setPlans(response.data);
      } catch (err) {
        setError('Failed to load subscription plans');
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  const formatCardNumber = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const formatExpiryDate = (value) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    if (v.length >= 2) {
      return `${v.substring(0, 2)}/${v.substring(2, 4)}`;
    }
    return value;
  };

  const handleCardNumberChange = (e) => {
    const formattedValue = formatCardNumber(e.target.value);
    setPaymentInfo({ ...paymentInfo, cardNumber: formattedValue });
  };

  const handleExpiryDateChange = (e) => {
    const formattedValue = formatExpiryDate(e.target.value);
    setPaymentInfo({ ...paymentInfo, expiryDate: formattedValue });
  };

  const handleCvvChange = (e) => {
    const value = e.target.value.replace(/\D/g, '');
    if (value.length <= 4) {
      setPaymentInfo({ ...paymentInfo, cvv: value });
    }
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setOpenDialog(true);
  };

  const handlePaymentSubmit = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.post(
        'http://localhost:3001/api/subscriptions',
        {
          plan: selectedPlan,
          autoRenew: paymentInfo.autoRenew,
          cardLastFour: paymentInfo.cardNumber.slice(-4)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setSuccess('Subscription activated successfully!');
      setOpenDialog(false);
      setTimeout(() => window.location.reload(), 2000);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to activate subscription');
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && (
        <Alert severity="error" sx={{ mb: 4 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 4 }}>
          {success}
        </Alert>
      )}

      <Typography variant="h3" component="h1" align="center" gutterBottom>
        Choose Your Plan
      </Typography>

      <Grid container spacing={4} sx={{ mt: 2 }}>
        {plans && Object.entries(plans).map(([key, plan]) => (
          <Grid item xs={12} md={3} key={key}>
            <Paper
              elevation={3}
              sx={{
                p: 3,
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                border: selectedPlan === key ? '2px solid #1976d2' : 'none'
              }}
            >
              <Typography variant="h5" component="h2" gutterBottom>
                {plan.name}
              </Typography>

              <Typography variant="h4" component="div" gutterBottom>
                ${plan.price}
                <Typography component="span" variant="body2" color="text.secondary">
                  /{plan.duration.toLowerCase()}
                </Typography>
              </Typography>

              <List>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${plan.features.maxProjects} Projects`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${plan.features.maxTeamMembers} Team Members`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    <CheckIcon color="success" />
                  </ListItemIcon>
                  <ListItemText
                    primary={`${plan.features.storageLimit}MB Storage`}
                  />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {plan.features.prioritySupport ? (
                      <CheckIcon color="success" />
                    ) : (
                      <CloseIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Priority Support" />
                </ListItem>
                <ListItem>
                  <ListItemIcon>
                    {plan.features.customDomain ? (
                      <CheckIcon color="success" />
                    ) : (
                      <CloseIcon color="error" />
                    )}
                  </ListItemIcon>
                  <ListItemText primary="Custom Domain" />
                </ListItem>
              </List>

              <Box sx={{ mt: 'auto', pt: 2 }}>
                <Button
                  fullWidth
                  variant="contained"
                  color={selectedPlan === key ? 'primary' : 'secondary'}
                  onClick={() => handlePlanSelect(key)}
                >
                  {selectedPlan === key ? 'Selected' : 'Select Plan'}
                </Button>
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Complete Your Subscription</DialogTitle>
        <DialogContent>
          <Box sx={{ pt: 2 }}>
            <TextField
              fullWidth
              label="Card Number"
              value={paymentInfo.cardNumber}
              onChange={handleCardNumberChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CreditCard />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                maxLength: 19,
                pattern: '[0-9 ]*'
              }}
            />
            <TextField
              fullWidth
              label="Expiry Date (MM/YY)"
              value={paymentInfo.expiryDate}
              onChange={handleExpiryDateChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <CalendarToday />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                maxLength: 5,
                pattern: '[0-9/]*'
              }}
            />
            <TextField
              fullWidth
              label="CVV"
              value={paymentInfo.cvv}
              onChange={handleCvvChange}
              margin="normal"
              required
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Security />
                  </InputAdornment>
                ),
              }}
              inputProps={{
                maxLength: 4,
                pattern: '[0-9]*'
              }}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={paymentInfo.autoRenew}
                  onChange={(e) =>
                    setPaymentInfo({ ...paymentInfo, autoRenew: e.target.checked })
                  }
                />
              }
              label="Auto-renew subscription"
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            onClick={handlePaymentSubmit}
            variant="contained"
            color="primary"
            disabled={!paymentInfo.cardNumber || !paymentInfo.expiryDate || !paymentInfo.cvv}
          >
            Subscribe
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default SubscriptionPlans;
