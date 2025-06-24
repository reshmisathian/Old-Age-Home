import React, { useState } from 'react';
import {
  Typography,
  Box,
  Paper,
  TextField,
  Button,
  Rating,
  Divider
} from '@mui/material';
import FeedbackIcon from '@mui/icons-material/Feedback';
import axios from 'axios';

const FeedbackPage = () => {
  const [form, setForm] = useState({
    staffName: '',
    residentInvolved: '',
    rating: 0,
    experience: '',
    suggestion: '',
    complaint: ''
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      // Get the token from localStorage (assuming you store it there after login)
      const token = localStorage.getItem('token');
      
      if (!token) {
        alert("Please log in to submit feedback");
        return;
      }

      const response = await axios.post('http://localhost:3000/staff-feedback', form, {
        headers: {
          'Authorization': token,
          'Content-Type': 'application/json'
        }
      });

      if (response.status === 200) {
        alert("Feedback submitted!");
        setForm({
          staffName: '',
          residentInvolved: '',
          rating: 0,
          experience: '',
          suggestion: '',
          complaint: ''
        });
      }
    } catch (err) {
      console.error(err);
      if (err.response && err.response.status === 403) {
        alert("⚠ You need to be logged in to submit feedback");
      } else {
        alert("⚠ Submission failed. Please try again.");
      }
    }
  };

  return (
    <Box
      sx={{
        height: '100vh',
        overflow: 'hidden',
        mt: -16,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        px: 2,
        py: 2
      }}
    >
      <Paper
        elevation={4}
        sx={{
          borderRadius: 3,
          p: 3,
          width: '100%',
          maxWidth: 850,
          backgroundColor: 'white',
          boxShadow: '0 4px 20px rgba(0,0,0,0.1)'
        }}
      >
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <FeedbackIcon color="primary" />
          <Typography variant="h5" fontWeight="bold">
            📝 Staff Feedback
          </Typography>
        </Box>

        <Typography sx={{ mb: 2 }} color="text.secondary">
          Share your experience, concerns, or suggestions to help us improve.
        </Typography>

        <Divider sx={{ mb: 3 }} />

        <TextField
          fullWidth
          label="👤 Staff Name"
          name="staffName"
          value={form.staffName}
          onChange={handleChange}
          size="small"
          margin="dense"
          variant="outlined"
          required
        />

        <TextField
          fullWidth
          label="🏠 Resident Involved (Optional)"
          name="residentInvolved"
          value={form.residentInvolved}
          onChange={handleChange}
          size="small"
          margin="dense"
          variant="outlined"
        />

        <Box sx={{ mt: 2, mb: 2 }}>
          <Typography fontWeight={600} fontSize="0.95rem" sx={{ mb: 1 }}>
            🌟 Rate Your Experience
          </Typography>
          <Rating
            name="rating"
            value={form.rating}
            onChange={(e, newVal) => setForm({ ...form, rating: newVal })}
            size="medium"
          />
        </Box>

        <TextField
          fullWidth
          label="🗒️ Experience"
          name="experience"
          value={form.experience}
          onChange={handleChange}
          margin="dense"
          multiline
          rows={2}
          size="small"
          variant="outlined"
          required
        />

        <TextField
          fullWidth
          label="💡 Suggestions"
          name="suggestion"
          value={form.suggestion}
          onChange={handleChange}
          margin="dense"
          multiline
          rows={2}
          size="small"
          variant="outlined"
        />

        <TextField
          fullWidth
          label="🚫 Complaints"
          name="complaint"
          value={form.complaint}
          onChange={handleChange}
          margin="dense"
          multiline
          rows={2}
          size="small"
          variant="outlined"
        />

        <Button
          variant="contained"
          fullWidth
          onClick={handleSubmit}
          sx={{
            mt: 0,
            py: 1.2,
            fontWeight: 'bold',
            fontSize: '1rem',
            background: 'linear-gradient(135deg, #1976d2, #42a5f5)',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            '&:hover': {
              background: 'linear-gradient(135deg, #1565c0, #2196f3)'
            }
          }}
        >
          🚀 Submit Feedback
        </Button>
      </Paper>
    </Box>
  );
};

export default FeedbackPage;