import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Grid,
  Avatar,
  Divider,
  Snackbar,
  Alert
} from '@mui/material';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { CalendarMonth, Person } from '@mui/icons-material';

const ActivityDetails = () => {
  const { activityName } = useParams();
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchActivities = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/activities', {
          headers: {
            Authorization: token
          }
        });
        
        const filtered = response.data.filter(
          (a) => a.activity === decodeURIComponent(activityName)
        );
        setParticipants(filtered);
      } catch (err) {
        console.error('Error fetching activities:', err);
        setError(err.response?.data?.message || 'Failed to load activity details');
      } finally {
        setLoading(false);
      }
    };

    fetchActivities();
  }, [activityName]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="error">{error}</Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 4 }, backgroundColor: '#f8f9fa', minHeight: '100vh' }}>
      <Typography variant="h4" gutterBottom fontWeight={600} textAlign="center" color="primary">
        📝 Participants in "{activityName}"
      </Typography>

      {participants.length === 0 ? (
        <Typography textAlign="center" color="text.secondary" sx={{ mt: 4 }}>
          No participants yet for this activity.
        </Typography>
      ) : (
        <Grid container spacing={3} sx={{ mt: 2 }}>
          {participants.map((p) => (
            <Grid item xs={12} sm={6} md={4} key={p._id}>
              <Card
                sx={{
                  borderRadius: 3,
                  boxShadow: 4,
                  p: 2,
                  backgroundColor: '#fff',
                  transition: 'transform 0.2s',
                  '&:hover': { transform: 'scale(1.02)' },
                }}
              >
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                    <Avatar sx={{ bgcolor: 'primary.main', mr: 2 }}>
                      <Person />
                    </Avatar>
                    <Box>
                      <Typography variant="h6">
                        {p.residentId?.name || 'Unknown'}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Age: {p.residentId?.age || '--'}
                      </Typography>
                    </Box>
                  </Box>

                  <Divider sx={{ my: 1 }} />

                  <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 1 }}>
                    <CalendarMonth sx={{ mr: 1, fontSize: 18, verticalAlign: 'middle' }} />
                    {new Date(p.date).toLocaleDateString()}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};

export default ActivityDetails;