import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';

const StaffFeedbackList = () => {
  const [feedbacks, setFeedbacks] = useState([]);

  useEffect(() => {
    const fetchFeedbacks = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await axios.get('http://localhost:3000/staff-feedback', {
          headers: { Authorization: token }
        });
        setFeedbacks(res.data);
      } catch (err) {
        console.error('Error fetching feedbacks', err);
      }
    };

    fetchFeedbacks();
  }, []);

  const ratingData = [1, 2, 3, 4, 5].map((r) => ({
    rating: `${r}★`,
    count: feedbacks.filter((f) => f.rating === r).length,
  }));

  return (
    <Box sx={{ mt:-10}}> 
      <Typography variant="h4" gutterBottom fontWeight="bold">
        📊 Staff Feedback Dashboard
      </Typography>

      <Divider sx={{ mt: 0, mb: 3 }} />

      {/* Chart Section */}
      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>Rating Summary</Typography>
        <ResponsiveContainer width="90%" height={250}>
          <BarChart data={ratingData}>
            <XAxis dataKey="rating" />
            <YAxis allowDecimals={false} />
            <Tooltip />
           <Bar dataKey="count" fill="#1976d2" barSize={90} />
          </BarChart>
        </ResponsiveContainer>
      </Paper>

      {/* List of Feedbacks */}
      <Grid container spacing={3}>
        {feedbacks.map((fb, index) => (
          <Grid item xs={12} md={6} key={index}>
            <Paper elevation={2} sx={{ p: 2 }}>
              <Typography variant="subtitle1" fontWeight="bold">
                👤 {fb.staffName}
              </Typography>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                🕒 {new Date(fb.submittedAt).toLocaleString()}
              </Typography>
              <Divider sx={{ mb: 1 }} />
              <List dense>
                {fb.residentInvolved && (
                  <ListItem>
                    <ListItemText primary="Resident" secondary={fb.residentInvolved} />
                  </ListItem>
                )}
                <ListItem>
                  <ListItemText primary="Rating" secondary={`${fb.rating} ★`} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Experience" secondary={fb.experience || '—'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Suggestions" secondary={fb.suggestion || '—'} />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Complaints" secondary={fb.complaint || '—'} />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default StaffFeedbackList;
