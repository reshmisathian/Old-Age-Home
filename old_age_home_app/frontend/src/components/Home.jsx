import React from 'react';
import { Box, CardMedia, Typography } from '@mui/material';

const Home = () => {
  const image = '/old_age_home.jpg'; 
  const primaryColor = '#0D47A1'; 
  const secondaryColor = '#f0f4ff'; 

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: `linear-gradient(135deg, ${secondaryColor} 0%, white 100%)`,
        padding: 4,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          maxWidth: 1200,
          width: '100%',
          backgroundColor: '#ffffff',
          borderRadius: 4,
          boxShadow: '0 8px 20px rgba(0,0,0,0.1)',
          overflow: 'hidden',
        }}
      >
        {/* Left Side: Text */}
        <Box
          sx={{
            width: { xs: '100%', md: '50%' },
            p: { xs: 3, md: 5 },
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            color: primaryColor,
          }}
        >
          <Typography variant="h4" fontWeight={600} sx={{ mb: 1 }}>
            Welcome to
          </Typography>
          <Typography variant="h2" fontWeight={700} sx={{ mb: 2, color: primaryColor }}>
            Care Haven
          </Typography>
          <Typography variant="body1" sx={{ color: 'gray', lineHeight: 1.8 }}>
            We care for the elderly with compassion, love, and respect.
            Our dedicated team provides personalized support and creates
            a warm, nurturing environment that feels like home.
          </Typography>
        </Box>

        {/* Right Side: Image */}
        <CardMedia
          component="img"
          image={image}
          alt="Old Age Home"
          sx={{
            width: { xs: '100%', md: '50%' },
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            filter: 'brightness(0.95) drop-shadow(0px 4px 6px rgba(0,0,0,0.1))',
          }}
        />
      </Box>
    </Box>
  );
};

export default Home;
