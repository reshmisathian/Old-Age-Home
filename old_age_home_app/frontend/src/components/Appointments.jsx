import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Card,
  CardContent,
  Avatar,
  Chip,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Divider,
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Paper,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  Event,
  Person,
  MedicalServices,
  FamilyRestroom,
  Add,
  Edit,
  Delete,
  Close,
  Today,
  EventAvailable,
  EventNote
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO, isToday, isTomorrow, differenceInDays, isAfter, isBefore, addDays } from 'date-fns';

const Appointments = () => {
  const [tabValue, setTabValue] = useState(0);
  const [appointments, setAppointments] = useState([]);
  const [upcomingAppointments, setUpcomingAppointments] = useState([]);
  const [doctorAppointments, setDoctorAppointments] = useState([]);
  const [familyAppointments, setFamilyAppointments] = useState([]);
  const [residents, setResidents] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentAppointment, setCurrentAppointment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const today = new Date();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const headers = { 
        headers: { 
          Authorization: token 
        } 
      };

      const [allRes, upcomingRes, doctorRes, familyRes, residentsRes] = await Promise.all([
        axios.get('http://localhost:3000/appointments', headers).catch(err => ({ data: [] })),
        axios.get('http://localhost:3000/appointments/upcoming', headers).catch(err => ({ data: [] })),
        axios.get('http://localhost:3000/appointments/doctor', headers).catch(err => ({ data: [] })),
        axios.get('http://localhost:3000/appointments/family', headers).catch(err => ({ data: [] })),
        axios.get('http://localhost:3000/residents', headers).catch(err => ({ data: [] }))
      ]);

      const processAppointments = (appointments) => {
        return [...appointments.data]
          .sort((a, b) => new Date(a.date) - new Date(b.date))
          .map(appt => ({
            ...appt,
            residentId: appt.residentId || { name: 'Unknown Resident', room: 'N/A', photo: null }
          }));
      };

      setAppointments(processAppointments(allRes));
      setUpcomingAppointments(processAppointments(upcomingRes));
      setDoctorAppointments(processAppointments(doctorRes));
      setFamilyAppointments(processAppointments(familyRes));
      setResidents(residentsRes.data);

    } catch (err) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || err.message || 'Failed to load appointments. Please try again.');
      if (err.response?.status === 401) {
        localStorage.removeItem('token');
        window.location.reload();
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleOpenDialog = (appointment = null) => {
    setCurrentAppointment(appointment || {
      residentId: '',
      type: 'doctor',
      date: format(new Date(), "yyyy-MM-dd'T'HH:mm"),
      purpose: '',
      notes: '',
      doctorName: '',
      hospitalName: '',
      relativeName: '',
      relation: '',
      relativeNumber: ''
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentAppointment(null);
    setError(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setCurrentAppointment(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const validateAppointment = (appt) => {
    if (!appt.residentId) return 'Resident is required';
    if (!appt.type) return 'Appointment type is required';
    if (!appt.date) return 'Date and time is required';
    if (!appt.purpose) return 'Purpose is required';
    
    if (appt.type === 'doctor') {
      if (!appt.doctorName) return 'Doctor name is required';
      if (!appt.hospitalName) return 'Hospital name is required';
    } else if (appt.type === 'family') {
      if (!appt.relativeName) return 'Relative name is required';
      if (!appt.relation) return 'Relation is required';
    }
    
    return null;
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      const validationError = validateAppointment(currentAppointment);
      if (validationError) {
        setError(validationError);
        return;
      }

      const token = localStorage.getItem('token');
      const userId = JSON.parse(localStorage.getItem('user'))?.id;
      
      const data = {
        ...currentAppointment,
        date: new Date(currentAppointment.date).toISOString(),
        createdBy: userId
      };

      // Clean up empty fields
      Object.keys(data).forEach(key => {
        if (data[key] === '' || data[key] === undefined) {
          delete data[key];
        }
      });

      if (currentAppointment._id) {
        await axios.put(
          `http://localhost:3000/appointments/${currentAppointment._id}`,
          data,
          { headers: { Authorization: token } }
        );
      } else {
        await axios.post(
          'http://localhost:3000/appointments',
          data,
          { headers: { Authorization: token } }
        );
      }

      fetchData();
      handleCloseDialog();
    } catch (err) {
      console.error('Error saving appointment:', err);
      setError(err.response?.data?.message || err.message || 'Failed to save appointment');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this appointment?')) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:3000/appointments/${id}`, {
          headers: { Authorization: token }
        });
        fetchData();
      } catch (err) {
        console.error('Error deleting appointment:', err);
        setError(err.response?.data?.message || 'Failed to delete appointment');
      }
    }
  };

  const groupUpcomingAppointments = () => {
    const todayAppts = [];
    const tomorrowAppts = [];
    const upcomingAppts = [];
    const sevenDaysLater = addDays(today, 7);

    upcomingAppointments.forEach(appt => {
      const apptDate = parseISO(appt.date);
      
      if (isBefore(apptDate, today) || isAfter(apptDate, sevenDaysLater)) {
        return;
      }

      if (isToday(apptDate)) {
        todayAppts.push(appt);
      } else if (isTomorrow(apptDate)) {
        tomorrowAppts.push(appt);
      } else {
        upcomingAppts.push(appt);
      }
    });

    todayAppts.sort((a, b) => new Date(a.date) - new Date(b.date));
    tomorrowAppts.sort((a, b) => new Date(a.date) - new Date(b.date));
    upcomingAppts.sort((a, b) => new Date(a.date) - new Date(b.date));

    return { todayAppts, tomorrowAppts, upcomingAppts };
  };

  const { todayAppts, tomorrowAppts, upcomingAppts } = groupUpcomingAppointments();

  const getDaysLeft = (date) => {
    const diff = differenceInDays(parseISO(date), today);
    if (diff === 0) return 'Today';
    if (diff === 1) return 'Tomorrow';
    return `${diff} days left`;
  };

  const shouldHighlight = (date) => {
    const diff = differenceInDays(parseISO(date), today);
    return diff <= 2;
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  const AppointmentCard = ({ appt, daysLeft, highlight = false, onEdit, onDelete }) => {
    const residentName = appt.residentId?.name || 'Unknown Resident';
    const roomNumber = appt.residentId?.room || 'N/A';
    const photoUrl = appt.residentId?.photo 
      ? `http://localhost:3000/uploads/${appt.residentId.photo}` 
      : '/default-avatar.jpg';

    return (
      <Card sx={{ 
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        borderLeft: highlight ? '4px solid #ff5722' : '4px solid transparent',
        transition: 'all 0.3s ease',
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: 3
        }
      }}>
        <CardContent sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
            <Avatar
              src={photoUrl}
              sx={{ width: 56, height: 56 }}
            />
            <Box>
              <Typography variant="h6" component="div">
                {residentName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Room {roomNumber}
              </Typography>
            </Box>
          </Box>

          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              {appt.type === 'doctor' ? (
                <MedicalServices color="primary" fontSize="small" />
              ) : (
                <FamilyRestroom color="secondary" fontSize="small" />
              )}
              {appt.type.charAt(0).toUpperCase() + appt.type.slice(1)} Appointment
            </Typography>

            <Typography variant="body2" sx={{ mt: 1 }}>
              <strong>When:</strong> {format(parseISO(appt.date), 'MMMM d, yyyy h:mm a')}
            </Typography>

            {appt.purpose && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Purpose:</strong> {appt.purpose}
              </Typography>
            )}

            {appt.type === 'doctor' && appt.doctorName && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Doctor:</strong> {appt.doctorName} {appt.hospitalName && `(${appt.hospitalName})`}
              </Typography>
            )}

            {appt.type === 'family' && appt.relativeName && (
              <Typography variant="body2" sx={{ mt: 1 }}>
                <strong>Relative:</strong> {appt.relativeName} {appt.relation && `(${appt.relation})`}
              </Typography>
            )}

            <Box sx={{ 
              mt: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Chip
                label={daysLeft}
                color={daysLeft === 'Today' ? 'error' : daysLeft === 'Tomorrow' ? 'warning' : 'primary'}
                size="small"
              />
              <Box>
                <IconButton size="small" onClick={() => onEdit(appt)}>
                  <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" onClick={() => onDelete(appt._id)}>
                  <Delete fontSize="small" />
                </IconButton>
              </Box>
            </Box>
          </Box>
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
        Appointments Management
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'flex-end',
        mb: 3
      }}>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Appointment
        </Button>
      </Box>

      <Tabs
        value={tabValue}
        onChange={handleTabChange}
        variant="fullWidth"
        sx={{ mb: 3 }}
      >
        <Tab label="All Appointments" icon={<Event />} />
        <Tab label="Upcoming Appointments" icon={<EventAvailable />} />
        <Tab label="Doctor Appointments" icon={<MedicalServices />} />
        <Tab label="Family Appointments" icon={<FamilyRestroom />} />
      </Tabs>

      {tabValue === 0 && (
        <Paper elevation={3} sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Event /> All Appointments
          </Typography>
          {appointments.length === 0 ? (
            <Typography sx={{ p: 2 }} color="text.secondary">
              No appointments found
            </Typography>
          ) : (
            <List>
              {appointments.map((appt) => (
                <React.Fragment key={appt._id}>
                  <ListItem
                    secondaryAction={
                      <>
                        <IconButton edge="end" onClick={() => handleOpenDialog(appt)}>
                          <Edit />
                        </IconButton>
                        <IconButton edge="end" onClick={() => handleDelete(appt._id)}>
                          <Delete />
                        </IconButton>
                      </>
                    }
                  >
                    <ListItemAvatar>
                      <Avatar
                        src={appt.residentId?.photo ? `http://localhost:3000/uploads/${appt.residentId.photo}` : '/default-avatar.jpg'}
                      />
                    </ListItemAvatar>
                    <ListItemText
                      primary={`${appt.residentId?.name || 'Unknown Resident'} (Room ${appt.residentId?.room || 'N/A'})`}
                      secondary={
                        <>
                          <Typography component="span" sx={{ display: 'block' }}>
                            {format(parseISO(appt.date), 'MMMM d, yyyy h:mm a')} • {appt.type} appointment
                          </Typography>
                          {appt.purpose && (
                            <Typography component="span" sx={{ display: 'block' }}>
                              Purpose: {appt.purpose}
                            </Typography>
                          )}
                          {appt.type === 'doctor' && appt.doctorName && (
                            <Typography component="span" sx={{ display: 'block' }}>
                              Doctor: {appt.doctorName} {appt.hospitalName && `(${appt.hospitalName})`}
                            </Typography>
                          )}
                          {appt.type === 'family' && appt.relativeName && (
                            <Typography component="span" sx={{ display: 'block' }}>
                              Relative: {appt.relativeName} {appt.relation && `(${appt.relation})`} 
                              {appt.relativeNumber && ` - ${appt.relativeNumber}`}
                            </Typography>
                          )}
                          {appt.notes && (
                            <Typography component="span" sx={{ display: 'block' }}>
                              Notes: {appt.notes}
                            </Typography>
                          )}
                        </>
                      }
                    />
                  </ListItem>
                  <Divider variant="inset" component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>
      )}

      {tabValue === 1 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <EventAvailable /> Upcoming Appointments (Next 7 Days)
          </Typography>

          {todayAppts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Today color="primary" /> Today
              </Typography>
              <Grid container spacing={2}>
                {todayAppts.map((appt) => (
                  <Grid item xs={12} sm={6} md={4} key={appt._id}>
                    <AppointmentCard 
                      appt={appt} 
                      daysLeft="Today" 
                      highlight 
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {tomorrowAppts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventAvailable color="primary" /> Tomorrow
              </Typography>
              <Grid container spacing={2}>
                {tomorrowAppts.map((appt) => (
                  <Grid item xs={12} sm={6} md={4} key={appt._id}>
                    <AppointmentCard 
                      appt={appt} 
                      daysLeft="Tomorrow" 
                      highlight 
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {upcomingAppts.length > 0 && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <EventNote color="primary" /> Upcoming
              </Typography>
              <Grid container spacing={2}>
                {upcomingAppts.map((appt) => (
                  <Grid item xs={12} sm={6} md={4} key={appt._id}>
                    <AppointmentCard 
                      appt={appt} 
                      daysLeft={getDaysLeft(appt.date)} 
                      onEdit={handleOpenDialog}
                      onDelete={handleDelete}
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          )}

          {todayAppts.length === 0 && tomorrowAppts.length === 0 && upcomingAppts.length === 0 && (
            <Typography sx={{ p: 2 }} color="text.secondary">
              No upcoming appointments in the next 7 days
            </Typography>
          )}
        </Box>
      )}

      {tabValue === 2 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <MedicalServices /> Doctor Appointments
          </Typography>
          <Grid container spacing={2}>
            {doctorAppointments.length > 0 ? (
              doctorAppointments.map((appt) => (
                <Grid item xs={12} sm={6} md={4} key={appt._id}>
                  <AppointmentCard 
                    appt={appt} 
                    daysLeft={getDaysLeft(appt.date)} 
                    highlight={shouldHighlight(appt.date)}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography sx={{ p: 2 }} color="text.secondary">
                  No doctor appointments scheduled
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      {tabValue === 3 && (
        <Box>
          <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
            <FamilyRestroom /> Family Appointments
          </Typography>
          <Grid container spacing={2}>
            {familyAppointments.length > 0 ? (
              familyAppointments.map((appt) => (
                <Grid item xs={12} sm={6} md={4} key={appt._id}>
                  <AppointmentCard 
                    appt={appt} 
                    daysLeft={getDaysLeft(appt.date)} 
                    highlight={shouldHighlight(appt.date)}
                    onEdit={handleOpenDialog}
                    onDelete={handleDelete}
                  />
                </Grid>
              ))
            ) : (
              <Grid item xs={12}>
                <Typography sx={{ p: 2 }} color="text.secondary">
                  No family appointments scheduled
                </Typography>
              </Grid>
            )}
          </Grid>
        </Box>
      )}

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {currentAppointment?._id ? 'Edit Appointment' : 'Add New Appointment'}
          <IconButton
            onClick={handleCloseDialog}
            sx={{ position: 'absolute', right: 8, top: 8 }}
          >
            <Close />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Resident</InputLabel>
              <Select
                name="residentId"
                value={currentAppointment?.residentId || ''}
                onChange={handleInputChange}
                label="Resident"
              >
                {residents.map((resident) => (
                  <MenuItem key={resident._id} value={resident._id}>
                    {resident.name} (Room {resident.room})
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth required>
              <InputLabel>Appointment Type</InputLabel>
              <Select
                name="type"
                value={currentAppointment?.type || 'doctor'}
                onChange={handleInputChange}
                label="Appointment Type"
              >
                <MenuItem value="doctor">Doctor</MenuItem>
                <MenuItem value="family">Family</MenuItem>
              </Select>
            </FormControl>

            <TextField
              name="date"
              label="Date & Time"
              type="datetime-local"
              value={currentAppointment?.date || ''}
              onChange={handleInputChange}
              InputLabelProps={{ shrink: true }}
              fullWidth
              required
            />

            <TextField
              name="purpose"
              label="Purpose"
              value={currentAppointment?.purpose || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={2}
              required
            />

            {currentAppointment?.type === 'doctor' && (
              <>
                <TextField
                  name="doctorName"
                  label="Doctor Name"
                  value={currentAppointment?.doctorName || ''}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
                <TextField
                  name="hospitalName"
                  label="Hospital Name"
                  value={currentAppointment?.hospitalName || ''}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
              </>
            )}

            {currentAppointment?.type === 'family' && (
              <>
                <TextField
                  name="relativeName"
                  label="Relative Name"
                  value={currentAppointment?.relativeName || ''}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
                <TextField
                  name="relation"
                  label="Relation"
                  value={currentAppointment?.relation || ''}
                  onChange={handleInputChange}
                  fullWidth
                  required
                />
                <TextField
                  name="relativeNumber"
                  label="Contact Number"
                  value={currentAppointment?.relativeNumber || ''}
                  onChange={handleInputChange}
                  fullWidth
                />
              </>
            )}

            <TextField
              name="notes"
              label="Notes"
              value={currentAppointment?.notes || ''}
              onChange={handleInputChange}
              fullWidth
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {currentAppointment?._id ? 'Update' : 'Save'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Appointments;
