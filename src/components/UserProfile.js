import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Alert,
  CircularProgress,
  Grid,
  Avatar
} from '@mui/material';
import { deepPurple } from '@mui/material/colors';

const UserProfile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    email: ''
  });

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        const response = await axios.get('/api/users/profile', {
          headers: { Authorization: `Bearer ${token}` }
        });

        setUser(response.data);
        setFormData({
          username: response.data.username,
          email: response.data.email
        });
      } catch (err) {
        setError('Failed to load profile');
        if (err.response?.status === 401) {
          navigate('/login');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const token = localStorage.getItem('token');
      await axios.put('/api/users/profile', formData, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setUser({ ...user, ...formData });
      setSuccess('Profile updated successfully');
      setEditMode(false);
    } catch (err) {
      setError(err.response?.data?.msg || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Paper elevation={3} sx={{ p: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} display="flex" justifyContent="center">
              <Avatar
                sx={{
                  width: 100,
                  height: 100,
                  bgcolor: deepPurple[500],
                  fontSize: '2.5rem'
                }}
              >
                {user?.username?.charAt(0).toUpperCase()}
              </Avatar>
            </Grid>

            <Grid item xs={12}>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}

              {success && (
                <Alert severity="success" sx={{ mb: 2 }}>
                  {success}
                </Alert>
              )}

              {editMode ? (
                <form onSubmit={handleSubmit}>
                  <TextField
                    fullWidth
                    label="Username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />

                  <TextField
                    fullWidth
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    margin="normal"
                    required
                  />

                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="primary"
                      disabled={loading}
                    >
                      {loading ? <CircularProgress size={24} /> : 'Save Changes'}
                    </Button>

                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => setEditMode(false)}
                    >
                      Cancel
                    </Button>
                  </Box>
                </form>
              ) : (
                <>
                  <Typography variant="h5" gutterBottom>
                    {user?.username}
                  </Typography>
                  <Typography variant="body1" color="text.secondary" gutterBottom>
                    {user?.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Member since: {new Date(user?.createdAt).toLocaleDateString()}
                  </Typography>

                  <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() => setEditMode(true)}
                    >
                      Edit Profile
                    </Button>

                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleLogout}
                    >
                      Logout
                    </Button>
                  </Box>
                </>
              )}
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Container>
  );
};

export default UserProfile; 