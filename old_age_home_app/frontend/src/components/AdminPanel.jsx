import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  Button,
  Paper,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert,
  Snackbar
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonOutlineIcon from '@mui/icons-material/PersonOutline';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

const AdminPanel = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // Get authorization headers with token
  const getAuthConfig = () => {
    const token = localStorage.getItem('token');
    return {
      headers: {
        Authorization: token
      }
    };
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.get(
        'http://localhost:3000/user-activity',
        getAuthConfig()
      );
      setUsers(response.data);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(err.response?.data?.message || 'Failed to fetch users. Please try again.');
      showSnackbar('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const deleteUser = async (id) => {
    try {
      const response = await axios.delete(
        `http://localhost:3000/users/${id}`,
        getAuthConfig()
      );
      setUsers(prev => prev.filter(user => user._id !== id));
      showSnackbar('User deleted successfully', 'success');
    } catch (err) {
      console.error('Error deleting user:', err);
      showSnackbar(
        err.response?.data?.message || 'Failed to delete user',
        'error'
      );
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleSnackbarClose = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress size={60} />
        <Typography variant="h6" ml={2}>
          Loading users...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={4}>
        <Alert 
          severity="error" 
          sx={{ mb: 2 }}
          action={
            <Button 
              color="inherit" 
              size="small"
              onClick={fetchUsers}
            >
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        padding: 4,
        backgroundColor: '#f0f2f5',
        minHeight: '100vh',
      }}
    >
      <Typography
        variant="h4"
        align="center"
        fontWeight="bold"
        gutterBottom
        sx={{ color: '#2b2b2b' }}
      >
        Admin Panel
      </Typography>
      <Typography
        variant="subtitle1"
        align="center"
        color="text.secondary"
        mb={4}
      >
        Manage Users & View Activity Logs
      </Typography>

      {users.length === 0 && !loading ? (
        <Paper
          elevation={3}
          sx={{
            p: 4,
            textAlign: 'center',
            maxWidth: 500,
            mx: 'auto'
          }}
        >
          <Typography variant="h6" color="text.secondary">
            No users found
          </Typography>
          <Button
            variant="contained"
            onClick={fetchUsers}
            sx={{ mt: 2 }}
          >
            Refresh
          </Button>
        </Paper>
      ) : (
        <Grid container spacing={4}>
          {users.map((user) => (
            <Grid item xs={12} sm={6} md={4} key={user._id}>
              <Paper
                elevation={5}
                sx={{
                  padding: 3,
                  borderRadius: 3,
                  backgroundColor: '#ffffff',
                  boxShadow: '0 8px 20px rgba(0,0,0,0.07)',
                  transition: 'transform 0.3s',
                  '&:hover': {
                    transform: 'translateY(-5px)',
                  },
                }}
              >
                <Box display="flex" alignItems="center" mb={2}>
                  <PersonOutlineIcon color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6" fontWeight="600">
                    {user.username}
                  </Typography>
                  <Tooltip title="Delete User">
                    <IconButton
                      onClick={() => {
                        if (window.confirm(`Are you sure you want to delete ${user.username}?`)) {
                          deleteUser(user._id);
                        }
                      }}
                      sx={{ marginLeft: 'auto' }}
                      color="error"
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Tooltip>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box display="flex" alignItems="center" mb={1}>
                  <HistoryEduIcon color="action" sx={{ mr: 1 }} />
                  <Typography variant="subtitle2" fontWeight="bold">
                    Activity Logs
                  </Typography>
                </Box>

                <Box
                  sx={{
                    maxHeight: 150,
                    overflowY: 'auto',
                    px: 1,
                    borderLeft: '2px solid #e0e0e0',
                  }}
                >
                  {user.activity && user.activity.length > 0 ? (
                    user.activity.map((log, i) => (
                      <Box key={i} mb={1}>
                        <Typography variant="body2" color="text.primary">
                          • {log.action}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ ml: 2 }}
                        >
                          {new Date(log.timestamp).toLocaleString()}
                        </Typography>
                      </Box>
                    ))
                  ) : (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ ml: 1 }}
                    >
                      No activity available.
                    </Typography>
                  )}
                </Box>
              </Paper>
            </Grid>
          ))}
        </Grid>
      )}

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default AdminPanel;