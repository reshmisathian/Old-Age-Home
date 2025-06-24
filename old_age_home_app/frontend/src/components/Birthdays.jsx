import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemText,
  Paper,
  Tabs,
  Tab,
  Divider,
  CircularProgress
} from '@mui/material';
import { 
  CalendarToday,
  Event,
  Cake,
  Timeline,
  Dashboard,
  Person
} from '@mui/icons-material';
import { format, parseISO, isToday, isThisMonth, addYears, isWithinInterval } from 'date-fns';
import axios from 'axios';

// Helper functions
const formatDate = (dateString) => {
  try {
    const date = parseISO(dateString);
    return format(date, 'MMMM d');
  } catch {
    return 'Invalid date';
  }
};

const calculateAge = (dob) => {
  if (!dob) return 'N/A';
  try {
    const birthDate = parseISO(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  } catch {
    return 'N/A';
  }
};

const Birthdays = () => {
  const [tabValue, setTabValue] = useState(0);
  const [residents, setResidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const today = new Date();

  // Fetch residents data
  useEffect(() => {
    const fetchResidents = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:3000/residents', {
          headers: { Authorization: token }
        });
        setResidents(response.data);
      } catch (err) {
        setError('Failed to fetch residents data');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchResidents();
  }, []);

  // Filter residents with valid dob
  const residentsWithDob = residents.filter(resident => resident.dob);

  // Upcoming birthdays (next 30 days)
  const upcoming = residentsWithDob
    .filter(resident => {
      try {
        const dob = parseISO(resident.dob);
        let nextBirthday = new Date(
          today.getFullYear(),
          dob.getMonth(),
          dob.getDate()
        );
        
        if (nextBirthday < today) {
          nextBirthday = addYears(nextBirthday, 1);
        }
        
        const thirtyDaysLater = new Date(today);
        thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
        
        return isWithinInterval(nextBirthday, {
          start: today,
          end: thirtyDaysLater
        });
      } catch {
        return false;
      }
    })
    .sort((a, b) => {
      try {
        const aDate = parseISO(a.dob);
        const bDate = parseISO(b.dob);
        return (
          new Date(today.getFullYear(), aDate.getMonth(), aDate.getDate()) - 
          new Date(today.getFullYear(), bDate.getMonth(), bDate.getDate())
        );
      } catch {
        return 0;
      }
    });

  // Group by month
  const byMonth = residentsWithDob.reduce((acc, resident) => {
    try {
      const month = format(parseISO(resident.dob), 'MMMM');
      if (!acc[month]) acc[month] = [];
      acc[month].push(resident);
      return acc;
    } catch {
      return acc;
    }
  }, {});

  // Timeline data (sorted by date)
  const timelineData = [...residentsWithDob].sort((a, b) => {
    try {
      return (
        parseISO(a.dob).getMonth() - parseISO(b.dob).getMonth() || 
        parseISO(a.dob).getDate() - parseISO(b.dob).getDate()
      );
    } catch {
      return 0;
    }
  });

  // Dashboard stats
  const thisMonthCount = residentsWithDob.filter(resident => {
    try {
      return isThisMonth(parseISO(resident.dob));
    } catch {
      return false;
    }
  }).length;

  const todayCount = residentsWithDob.filter(resident => {
    try {
      return isToday(parseISO(resident.dob));
    } catch {
      return false;
    }
  }).length;

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // View Components
  const CalendarView = () => (
    <Box sx={{ mt: 2 }}>
      <Typography variant="h6" color="text.secondary" gutterBottom>
        Calendar View (Simple Month Grid)
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Grid container spacing={2}>
          {Array.from({ length: 12 }).map((_, monthIndex) => {
            const monthName = format(new Date(2023, monthIndex, 1), 'MMMM');
            const monthResidents = residentsWithDob.filter(resident => {
              try {
                return parseISO(resident.dob).getMonth() === monthIndex;
              } catch {
                return false;
              }
            });
            
            return (
              <Grid key={monthIndex} xs={12} sm={6} md={4}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {monthName} ({monthResidents.length})
                    </Typography>
                    {monthResidents.length > 0 ? (
                      <List dense>
                        {monthResidents.map(resident => (
                          <ListItem key={resident._id}>
                            <ListItemText
                              primary={resident.name}
                              secondary={`${formatDate(resident.dob)} • Room ${resident.room || 'N/A'}`}
                            />
                          </ListItem>
                        ))}
                      </List>
                    ) : (
                      <Typography color="text.secondary">No birthdays</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Paper>
    </Box>
  );

  const UpcomingView = () => (
    <Grid container spacing={3} sx={{ mt: 2 }}>
      {upcoming.length > 0 ? (
        upcoming.map(resident => (
          <Grid key={resident._id} xs={12} sm={6} md={4}>
            <Card sx={{ 
              borderLeft: '4px solid',
              borderColor: isToday(parseISO(resident.dob))
                ? '#4caf50'
                : 'primary.main',
              height: '100%'
            }}>
              <CardContent>
                <Box display="flex" alignItems="center" gap={2}>
                  <Avatar 
                    src={resident.photo ? `http://localhost:3000/uploads/${resident.photo}` : '/default-avatar.jpg'} 
                    sx={{ width: 60, height: 60 }}
                  />
                  <Box>
                    <Typography variant="h6">{resident.name}</Typography>
                    <Typography color="text.secondary">
                      {formatDate(resident.dob)} • Turns {calculateAge(resident.dob) + 1}
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                      <Chip 
                        label={`Room ${resident.room || 'N/A'}`}
                        size="small"
                      />
                      {isToday(parseISO(resident.dob)) && (
                        <Chip 
                          label="Today!"
                          size="small"
                          color="success"
                        />
                      )}
                    </Box>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))
      ) : (
        <Grid item xs={12}>
          <Typography color="text.secondary">No upcoming birthdays in the next 30 days</Typography>
        </Grid>
      )}
    </Grid>
  );

  const MonthView = () => (
    <Box sx={{ mt: 2 }}>
      {Object.keys(byMonth).length > 0 ? (
        Object.entries(byMonth).map(([month, monthResidents]) => (
          <Box key={month} mb={4}>
            <Typography variant="h5" gutterBottom sx={{ 
              color: 'primary.main',
              borderBottom: '2px solid',
              borderColor: 'divider',
              pb: 1,
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <Event /> {month}
            </Typography>
            <List>
              {monthResidents.map(resident => (
                <ListItem 
                  key={resident._id} 
                  sx={{ 
                    py: 2,
                    bgcolor: isToday(parseISO(resident.dob))
                      ? 'action.hover'
                      : 'inherit'
                  }}
                >
                  <ListItemText
                    primary={resident.name}
                    secondary={
                      <>
                        {formatDate(resident.dob)} • Room {resident.room || 'N/A'}
                        <br />
                        <Typography component="span" color="primary">
                          Age: {calculateAge(resident.dob)}
                        </Typography>
                      </>
                    }
                  />
                  <Avatar 
                    src={resident.photo ? `http://localhost:3000/uploads/${resident.photo}` : '/default-avatar.jpg'} 
                  />
                </ListItem>
              ))}
            </List>
          </Box>
        ))
      ) : (
        <Typography color="text.secondary">No birthday data available</Typography>
      )}
    </Box>
  );

  const TimelineView = () => (
    <Box sx={{ 
      position: 'relative',
      mt: 2,
      '&:before': {
        content: '""',
        position: 'absolute',
        left: 18,
        top: 0,
        bottom: 0,
        width: '2px',
        bgcolor: 'divider'
      }
    }}>
      {timelineData.length > 0 ? (
        timelineData.map((resident) => (
          <Box key={resident._id} sx={{ 
            position: 'relative',
            pl: 4,
            mb: 3,
            '&:before': {
              content: '""',
              position: 'absolute',
              left: 0,
              top: 8,
              width: 16,
              height: 16,
              borderRadius: '50%',
              bgcolor: isToday(parseISO(resident.dob))
                ? '#4caf50'
                : 'primary.main',
              zIndex: 1
            }
          }}>
            <Card>
              <CardContent sx={{ display: 'flex', gap: 2 }}>
                <Avatar 
                  src={resident.photo ? `http://localhost:3000/uploads/${resident.photo}` : '/default-avatar.jpg'} 
                  sx={{ width: 56, height: 56 }} 
                />
                <Box>
                  <Typography variant="h6">{resident.name}</Typography>
                  <Typography color="text.secondary">
                    {formatDate(resident.dob)}
                  </Typography>
                  <Box display="flex" gap={1} mt={1}>
                    <Chip 
                      label={`Age ${calculateAge(resident.dob)}`} 
                      size="small" 
                    />
                    <Chip 
                      label={`Room ${resident.room || 'N/A'}`} 
                      size="small" 
                      variant="outlined" 
                    />
                    {isToday(parseISO(resident.dob)) && (
                      <Chip 
                        label="Today!" 
                        size="small" 
                        color="success" 
                      />
                    )}
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Box>
        ))
      ) : (
        <Typography color="text.secondary" sx={{ pl: 4 }}>
          No birthday data available
        </Typography>
      )}
    </Box>
  );

  const DashboardView = () => (
    <Box>
      <Box display="flex" gap={3} mb={4}>
        <Paper sx={{ p: 3, flex: 1, borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Cake /> This Month
          </Typography>
          <Typography variant="h3" color="primary">{thisMonthCount}</Typography>
        </Paper>
        <Paper sx={{ p: 3, flex: 1, borderRadius: 2 }}>
          <Typography variant="h6" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event /> Today
          </Typography>
          <Typography variant="h3" color={todayCount ? 'success.main' : 'text.secondary'}>
            {todayCount || 'None'}
          </Typography>
        </Paper>
      </Box>

      <Typography variant="h5" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Person /> Upcoming Birthdays
      </Typography>
      {upcoming.length > 0 ? (
        <Grid container spacing={2}>
          {upcoming.slice(0, 3).map(resident => (
            <Grid key={resident._id} xs={12} sm={6} md={4}>
              <Card sx={{ height: '100%', borderRadius: 2 }}>
                <CardContent sx={{ textAlign: 'center' }}>
                  <Avatar 
                    src={resident.photo ? `http://localhost:3000/uploads/${resident.photo}` : '/default-avatar.jpg'} 
                    sx={{ 
                      width: 80, 
                      height: 80,
                      mx: 'auto',
                      mb: 2
                    }}
                  />
                  <Typography variant="h6">{resident.name}</Typography>
                  <Typography color="text.secondary">
                    {formatDate(resident.dob)}
                  </Typography>
                  <Typography variant="body2" mt={1}>
                    Turns {calculateAge(resident.dob) + 1} • Room {resident.room || 'N/A'}
                  </Typography>
                  {isToday(parseISO(resident.dob)) && (
                    <Chip 
                      label="Today!" 
                      size="small" 
                      color="success" 
                      sx={{ mt: 1 }}
                    />
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      ) : (
        <Typography color="text.secondary" sx={{ mt: 2 }}>
          No upcoming birthdays in the next 30 days
        </Typography>
      )}
    </Box>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3, textAlign: 'center' }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 2 }}>
        Resident Birthdays
      </Typography>
      
      <Tabs 
        value={tabValue} 
        onChange={handleTabChange} 
        variant="scrollable"
        scrollButtons="auto"
        sx={{ mb: 3 }}
      >
        <Tab label="Calendar" icon={<CalendarToday />} iconPosition="start" />
        <Tab label="Upcoming" icon={<Event />} iconPosition="start" />
        <Tab label="By Month" icon={<Cake />} iconPosition="start" />
        <Tab label="Timeline" icon={<Timeline />} iconPosition="start" />
        <Tab label="Dashboard" icon={<Dashboard />} iconPosition="start" />
      </Tabs>
      
      <Divider sx={{ mb: 3 }} />
      
      {tabValue === 0 && <CalendarView />}
      {tabValue === 1 && <UpcomingView />}
      {tabValue === 2 && <MonthView />}
      {tabValue === 3 && <TimelineView />}
      {tabValue === 4 && <DashboardView />}
    </Box>
  );
};

export default Birthdays;
