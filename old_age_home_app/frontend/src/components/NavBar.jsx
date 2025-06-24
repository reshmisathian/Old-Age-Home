import {
  AppBar,
  Box,
  Button,
  Toolbar,
  Typography,
  IconButton,
  Badge,
  Menu,
  MenuItem,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import NotificationsIcon from '@mui/icons-material/Notifications';
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  Cake as BirthdayIcon,
  Event as AppointmentIcon
} from '@mui/icons-material';
import { format, parseISO, differenceInDays, isToday } from 'date-fns';

const Navbar = ({ isLoggedIn, setIsLoggedIn, toggleDrawer }) => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [notificationCount, setNotificationCount] = useState(0);
  const open = Boolean(anchorEl);

  const isAdmin = localStorage.getItem('isAdmin') === 'true';

  useEffect(() => {
    if (isLoggedIn) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 300000);
      return () => clearInterval(interval);
    }
  }, [isLoggedIn]);

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setNotifications([]);
        setNotificationCount(0);
        return;
      }
      
      const headers = { headers: { Authorization: token } };

      const [appointmentsRes, residentsRes] = await Promise.all([
        axios.get('http://localhost:3000/appointments/upcoming', headers)
          .catch(err => ({ data: [] })), // Return empty array if error
        axios.get('http://localhost:3000/residents', headers)
          .catch(err => ({ data: [] }))  // Return empty array if error
      ]);
      
      const today = new Date();
      
      const appointmentNotifications = (appointmentsRes.data || [])
        .filter(appt => appt && !appt.completed && appt.residentId)
        .map(appt => {
          const daysLeft = differenceInDays(parseISO(appt.date), today);
          let message = '';
          const residentName = appt.residentId?.name || 'Resident';
          const hospitalName = appt.hospitalName || 'hospital';
          const relativeName = appt.relativeName || 'family';
          
          if (appt.type === 'doctor') {
            if (daysLeft === 0) {
              message = `Today is ${residentName}'s doctor appointment at ${hospitalName}`;
            } else if (daysLeft === 1) {
              message = `1 day left for ${residentName}'s doctor appointment at ${hospitalName}`;
            } else {
              message = `${daysLeft} days left for ${residentName}'s doctor appointment at ${hospitalName}`;
            }
          } else { 
            if (daysLeft === 0) {
              message = `Today is ${residentName}'s family appointment with ${relativeName}`;
            } else if (daysLeft === 1) {
              message = `1 day left for ${residentName}'s family appointment with ${relativeName}`;
            } else {
              message = `${daysLeft} days left for ${residentName}'s family appointment with ${relativeName}`;
            }
          }
          
          return {
            type: 'appointment',
            id: appt._id,
            message,
            date: appt.date,
            residentId: appt.residentId._id,
            daysLeft
          };
        });
      
      const birthdayNotifications = (residentsRes.data || [])
        .filter(resident => resident && resident.dob && resident.name)
        .map(resident => {
          const dob = parseISO(resident.dob);
          const nextBirthday = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
          
          if (today > nextBirthday) {
            nextBirthday.setFullYear(today.getFullYear() + 1);
          }
          
          const daysLeft = differenceInDays(nextBirthday, today);
          
          if (daysLeft <= 7) { 
            let message = '';
            
            if (daysLeft === 0) {
              message = `Today is ${resident.name}'s birthday!`;
            } else if (daysLeft === 1) {
              message = `1 day left for ${resident.name}'s birthday`;
            } else {
              message = `${daysLeft} days left for ${resident.name}'s birthday`;
            }
            
            return {
              type: 'birthday',
              id: resident._id,
              message,
              date: nextBirthday.toISOString(),
              residentId: resident._id,
              daysLeft
            };
          }
          return null;
        })
        .filter(Boolean);
      
      const allNotifications = [...appointmentNotifications, ...birthdayNotifications]
        .sort((a, b) => new Date(a.date) - new Date(b.date));
      
      setNotifications(allNotifications);
      setNotificationCount(allNotifications.length);
    } catch (err) {
      console.error('Error fetching notifications:', err);
      setNotifications([]);
      setNotificationCount(0);
    }
  };

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationClick = (notification) => {
    handleClose();
    if (notification.type === 'appointment') {
      navigate('/dashboard/appointments');
    } else {
      navigate('/dashboard/birthdays');
    }
  };

  const logoutHandler = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('isAdmin');
    setIsLoggedIn(false);
    navigate('/');
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static">
        <Toolbar>
          {isLoggedIn && !isAdmin && (
            <IconButton
              edge="start"
              color="inherit"
              aria-label="menu"
              sx={{ mr: 2 }}
              onClick={toggleDrawer}
            >
              <MenuIcon />
            </IconButton>
          )}

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            Old Age Home
          </Typography>

          <Button color="inherit">
            <Link to="/" style={{ color: 'white', textDecoration: 'none' }}>Home</Link>
          </Button>

          {isLoggedIn && (
            <>
              {isAdmin && (
                <Button color="inherit">
                  <Link to="/admin" style={{ color: 'white', textDecoration: 'none' }}>Admin Panel</Link>
                </Button>
              )}
              <Button color="inherit">
                <Link to="/residents" style={{ color: 'white', textDecoration: 'none' }}>View Residents</Link>
              </Button>
              {isAdmin && (
                <Button color="inherit">
                  <Link to="/stafffeedback" style={{ color: 'white', textDecoration: 'none' }}>Staff Feedback</Link>
                </Button>
              )}
              {!isAdmin && (
                <>
                  <Button color="inherit">
                    <Link to="/add" style={{ color: 'white', textDecoration: 'none' }}>Add Resident</Link>
                  </Button>
                  <Button color="inherit">
                    <Link to="/activities" style={{ color: 'white', textDecoration: 'none' }}>Activities</Link>
                  </Button>
                  <Button color="inherit">
                    <Link to="/activity-participation" style={{ color: 'white', textDecoration: 'none' }}>Activity Participation</Link>
                  </Button>
                </>
              )}

              {/* Notification Icon */}
              <IconButton
                color="inherit"
                aria-label="notifications"
                onClick={handleClick}
                sx={{ ml: 1 }}
              >
                <Badge badgeContent={notificationCount} color="error">
                  <NotificationsIcon />
                </Badge>
              </IconButton>

              {/* Notification Menu */}
              <Menu
                anchorEl={anchorEl}
                open={open}
                onClose={handleClose}
                PaperProps={{
                  style: {
                    width: '350px',
                    maxHeight: '400px',
                    overflow: 'auto'
                  }
                }}
              >
                <MenuItem disabled>
                  <Typography variant="subtitle1" fontWeight="bold">
                    Notifications ({notificationCount})
                  </Typography>
                </MenuItem>
                <Divider />
                
                {notifications.length === 0 ? (
                  <MenuItem disabled>
                    <Typography variant="body2" color="text.secondary">
                      No new notifications
                    </Typography>
                  </MenuItem>
                ) : (
                  notifications.map((notification, index) => (
                    <MenuItem 
                      key={`${notification.type}-${notification.id}`}
                      onClick={() => handleNotificationClick(notification)}
                      sx={{
                        borderLeft: notification.daysLeft <= 1 ? '4px solid #f44336' : 
                                    notification.daysLeft <= 3 ? '4px solid #ff9800' : '4px solid #4caf50'
                      }}
                    >
                      <ListItemIcon>
                        {notification.type === 'birthday' ? (
                          <BirthdayIcon color="primary" />
                        ) : (
                          <AppointmentIcon color="secondary" />
                        )}
                      </ListItemIcon>
                      <ListItemText
                        primary={notification.message}
                        secondary={isToday(parseISO(notification.date)) ? 
                          'Today' : 
                          format(parseISO(notification.date), 'MMMM d, yyyy')}
                      />
                    </MenuItem>
                  ))
                )}
              </Menu>
            </>
          )}

          {isLoggedIn ? (
            <Button color="inherit" onClick={logoutHandler}>Logout</Button>
          ) : (
            <>
              <Button color="inherit">
                <Link to="/login" style={{ color: 'white', textDecoration: 'none' }}>Login</Link>
              </Button>
              <Button color="inherit">
                <Link to="/register" style={{ color: 'white', textDecoration: 'none' }}>Register</Link>
              </Button>
            </>
          )}
        </Toolbar>
      </AppBar>
    </Box>
  );
};

export default Navbar;
