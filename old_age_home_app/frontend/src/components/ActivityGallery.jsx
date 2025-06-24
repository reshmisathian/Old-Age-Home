// components/ActivityGallery.jsx
import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Grid,
  Card,
  CardActionArea,
  CardMedia,
  CardContent,
  Typography
} from '@mui/material';

const activities = [
  {
    name: 'Yoga Session',
    image: 'yoga.jpg',
  },
  {
    name: 'Art Therapy',
    image: 'art.jpg',
  },
  {
    name: 'Board Games',
    image: 'games.jpg',
  },
  {
    name: 'Morning Walk',
    image: 'walk.jpg',
  },
  {
    name: 'Music Time',
    image: 'music.jpg',
  },
];

const ActivityGallery = () => {
  const navigate = useNavigate();

  const handleClick = (activityName) => {
    navigate(`/activities/${encodeURIComponent(activityName)}`);
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Activities
      </Typography>
      <Grid container spacing={3}>
        {activities.map((a) => (
          <Grid item xs={12} sm={6} md={4} key={a.name}>
            <Card>
              <CardActionArea onClick={() => handleClick(a.name)}>
                <CardMedia
                  component="img"
                  height="160"
                  image={a.image}
                  alt={a.name}
                />
                <CardContent>
                  <Typography variant="h6">{a.name}</Typography>
                </CardContent>
              </CardActionArea>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default ActivityGallery;
