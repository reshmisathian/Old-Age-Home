import React from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { ListItemButton } from '@mui/material';
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  CssBaseline,
  Toolbar,
  Typography,
  Divider,
  useTheme,
  Paper
} from '@mui/material';
import {
  RestaurantMenu as MealPlansIcon,
  EventAvailable as AppointmentsIcon,
  Cake as BirthdaysIcon,
  Feedback as FeedbackIcon,
  Today as TodayIcon
} from '@mui/icons-material';

const drawerWidth = 260;

const SidebarLayout = ({ drawerOpen, toggleDrawer }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();

  const sidebarItems = [
    { text: 'Meal Plans', path: '/dashboard/meal-plans', icon: <MealPlansIcon /> },
    { text: 'Appointments', path: '/dashboard/appointments', icon: <AppointmentsIcon /> },
    { text: 'Birthdays', path: '/dashboard/birthdays', icon: <BirthdaysIcon /> },
    { text: 'Feedback', path: '/dashboard/feedback', icon: <FeedbackIcon /> },
  ];

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />

      <Drawer
        variant="temporary"
        open={drawerOpen}
        onClose={toggleDrawer}
        ModalProps={{ keepMounted: true }}
        sx={{
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: '#f8faff',
            borderRight: 'none',
            boxShadow: theme.shadows[3],
          },
        }}
      >
        <Toolbar />
        <Box sx={{ px: 3, py: 2 }}>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              color: theme.palette.primary.main,
              mb: 2,
              fontSize: '1.3rem',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}
          >
            Dashboard
          </Typography>
          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)' }} />
        </Box>

        <List sx={{ px: 2 }}>
          {sidebarItems.map((item) => {
            const isSelected = location.pathname === item.path;

            return (
              <ListItemButton
                key={item.text}
                onClick={() => {
                  navigate(item.path);
                  toggleDrawer();
                }}
                selected={isSelected}
                sx={{
                  borderRadius: 2,
                  mb: 1,
                  px: 2,
                  py: 1,
                  transition: 'all 0.2s ease',
                  backgroundColor: isSelected ? theme.palette.primary.main : 'transparent',
                  '&:hover': {
                    backgroundColor: isSelected ? theme.palette.primary.dark : theme.palette.action.hover,
                  },
                  '&.Mui-selected': {
                    '& .MuiListItemIcon-root': {
                      color: 'white',
                    },
                    '& .MuiListItemText-primary': {
                      color: 'white',
                      fontWeight: 500,
                    },
                  },
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 36,
                  color: isSelected ? 'white' : theme.palette.text.secondary
                }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText 
                  primary={item.text} 
                  primaryTypographyProps={{
                    color: isSelected ? 'white' : 'text.primary',
                    fontWeight: isSelected ? 500 : 400,
                    fontSize: '0.95rem'
                  }} 
                />
              </ListItemButton>
            );
          })}
        </List>

        <Box sx={{ px: 3, py: 2, mt: 'auto' }}>
          <Divider sx={{ borderColor: 'rgba(0, 0, 0, 0.08)', mb: 2 }} />
          <Paper 
            elevation={0} 
            sx={{
              p: 2,
              borderRadius: 2,
              backgroundColor: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              gap: 1.5
            }}
          >
            <TodayIcon color="primary" />
            <Typography variant="body2" color="primary">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'short', 
                day: 'numeric' 
              })}
            </Typography>
          </Paper>
        </Box>
      </Drawer>

      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 3,
          backgroundColor: '#f5f7fa',
          minHeight: '100%'
        }}
      >
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};

export default SidebarLayout;
