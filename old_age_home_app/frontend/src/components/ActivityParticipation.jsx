import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
  Card,
  CardContent,
  Grid,
  Divider,
  Paper,
  CircularProgress,
  Snackbar,
  Alert
} from '@mui/material';
import { Event, Person, CalendarMonth } from '@mui/icons-material';
import axios from 'axios';

const ActivityParticipation = () => {
  const [residents, setResidents] = useState([]);
  const [form, setForm] = useState({
    residentId: '',
    activity: '',
    date: '',
  });
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState({
    residents: false,
    submit: false,
    summary: false
  });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  const activities = [
    'Morning Walk',
    'Yoga Session',
    'Art Therapy',
    'Board Games',
    'Music Time',
    'Group Discussion',
  ];

  useEffect(() => {
    const fetchResidents = async () => {
      setLoading(prev => ({ ...prev, residents: true }));
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/residents', {
          headers: {
            Authorization: token
          }
        });
        setResidents(response.data);
      } catch (err) {
        console.error('Error fetching residents:', err);
        showSnackbar('Failed to load residents', 'error');
      } finally {
        setLoading(prev => ({ ...prev, residents: false }));
      }
    };

    fetchResidents();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    if (!form.residentId || !form.activity || !form.date) {
      showSnackbar('Please fill all fields', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, submit: true }));
    try {
      const token = localStorage.getItem('token');
      await axios.post('http://localhost:3000/activities', form, {
        headers: {
          Authorization: token
        }
      });
      showSnackbar('Participation logged successfully!', 'success');
      setForm({ residentId: '', activity: '', date: '' });
    } catch (err) {
      console.error('Error logging participation:', err);
      showSnackbar('Error logging participation', 'error');
    } finally {
      setLoading(prev => ({ ...prev, submit: false }));
    }
  };

  const fetchSummary = async () => {
    if (!month || !year) {
      showSnackbar('Please enter both month and year', 'error');
      return;
    }

    setLoading(prev => ({ ...prev, summary: true }));
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `http://localhost:3000/activities/summary?month=${month}&year=${year}`,
        {
          headers: {
            Authorization: token
          }
        }
      );
      setSummary(response.data);
    } catch (err) {
      console.error('Error fetching summary:', err);
      showSnackbar('Error fetching summary', 'error');
    } finally {
      setLoading(prev => ({ ...prev, summary: false }));
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({
      open: true,
      message,
      severity
    });
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      {/* Page Header */}
      <Typography variant="h4" gutterBottom fontWeight={600} textAlign="center" color="primary">
        🧓 Activity Tracker
      </Typography>

      {/* Participation Logging Section */}
      <Paper elevation={3} sx={{ p: 4, mb: 6, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          Log New Participation
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="resident-label">Select Resident</InputLabel>
          <Select
            labelId="resident-label"
            name="residentId"
            value={form.residentId}
            onChange={handleChange}
            disabled={loading.residents}
          >
            {loading.residents ? (
              <MenuItem disabled>Loading residents...</MenuItem>
            ) : (
              residents.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.name} (Age {r.age})
                </MenuItem>
              ))
            )}
          </Select>
        </FormControl>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel id="activity-label">Select Activity</InputLabel>
          <Select
            labelId="activity-label"
            name="activity"
            value={form.activity}
            onChange={handleChange}
          >
            {activities.map((act, idx) => (
              <MenuItem key={idx} value={act}>
                {act}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <TextField
          fullWidth
          name="date"
          label="Date"
          type="date"
          value={form.date}
          onChange={handleChange}
          InputLabelProps={{ shrink: true }}
          sx={{ mb: 3 }}
        />

        <Button
          variant="contained"
          size="large"
          fullWidth
          onClick={handleSubmit}
          disabled={loading.submit}
        >
          {loading.submit ? <CircularProgress size={24} /> : 'Submit Participation'}
        </Button>
      </Paper>

      {/* Monthly Summary Filter */}
      <Paper elevation={2} sx={{ p: 4, borderRadius: 3 }}>
        <Typography variant="h6" gutterBottom color="primary">
          View Monthly Participation Summary
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 4 }}>
          <TextField
            label="Month"
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            inputProps={{ min: 1, max: 12 }}
            sx={{ width: 120 }}
          />
          <TextField
            label="Year"
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            sx={{ width: 120 }}
          />
          <Button
            variant="outlined"
            onClick={fetchSummary}
            disabled={loading.summary}
          >
            {loading.summary ? <CircularProgress size={24} /> : 'Get Summary'}
          </Button>
        </Box>

        {loading.summary ? (
          <Box display="flex" justifyContent="center" my={4}>
            <CircularProgress />
          </Box>
        ) : summary.length > 0 ? (
          <Grid container spacing={3}>
            {summary.map((r) => (
              <Grid item xs={12} sm={6} md={4} key={r.residentId}>
                <Card
                  sx={{
                    borderRadius: 3,
                    boxShadow: 4,
                    backgroundColor: '#ffffff',
                    transition: 'transform 0.2s',
                    '&:hover': { transform: 'scale(1.02)' },
                  }}
                >
                  <CardContent>
                    <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                      <Person sx={{ mr: 1 }} color="primary" /> {r.name}
                    </Typography>
                    <Typography sx={{ mb: 1 }}>Age: <strong>{r.age}</strong></Typography>
                    <Typography sx={{ mb: 1 }}>
                      Total Activities: <strong>{r.count}</strong>
                    </Typography>
                    <Divider sx={{ my: 1 }} />
                    <Typography variant="subtitle2" sx={{ mb: 1 }}>
                      Activities:
                    </Typography>
                    <ul style={{ paddingLeft: 16, margin: 0 }}>
                      {r.activities.map((a, i) => (
                        <li key={i} style={{ marginBottom: 4 }}>
                          <Event fontSize="small" sx={{ mr: 1, verticalAlign: 'middle' }} />
                          {a.activity}{' '}
                          <CalendarMonth fontSize="small" sx={{ ml: 1, verticalAlign: 'middle' }} />
                          {new Date(a.date).toLocaleDateString()}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        ) : (
          <Typography sx={{ mt: 2 }} color="text.secondary">
            No participation records found for the selected month and year.
          </Typography>
        )}
      </Paper>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default ActivityParticipation;