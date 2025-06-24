import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Grid,
  Card,
  CardContent,
  MenuItem,
  Divider,
  Chip,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Select,
  FormControl,
  InputLabel,
  Paper,
  InputAdornment,
  Alert
} from '@mui/material';
import {
  Restaurant as RestaurantIcon,
  Notes as NotesIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Close as CloseIcon,
  Search as SearchIcon,
  FilterList as FilterListIcon,
  GroupWork as GroupWorkIcon
} from '@mui/icons-material';
import axios from 'axios';
import { format, parseISO, getWeek, startOfWeek, endOfWeek } from 'date-fns';

const MealPlans = () => {
  const [mealPlans, setMealPlans] = useState([]);
  const [residents, setResidents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const [formData, setFormData] = useState({
    residentId: '',
    date: '',
    breakfast: '',
    lunch: '',
    dinner: '',
    notes: '',
  });
  const [selectedResident, setSelectedResident] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState({
    mealType: '',
    dietaryNeed: '',
    dateRange: { start: null, end: null }
  });
  const [groupBy, setGroupBy] = useState('none');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchMealPlans();
    fetchResidents();
  }, []);

  const fetchMealPlans = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/api/meal-plans', {
        headers: { Authorization: token }
      });
      const plansWithDates = res.data.map(plan => ({
        ...plan,
        date: parseISO(plan.date)
      }));
      setMealPlans(plansWithDates);
      setError(null);
    } catch (err) {
      console.error('Error fetching meal plans:', err);
      setError('Failed to load meal plans. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchResidents = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get('http://localhost:3000/residents', {
        headers: { Authorization: token }
      });
      if (Array.isArray(res.data)) {
        setResidents(res.data);
        setError(null);
      } else {
        console.error('Residents data is not an array', res.data);
        setError('Invalid residents data format');
      }
    } catch (err) {
      console.error('Error fetching residents:', err);
      setError('Failed to load residents. Please check your connection.');
    } finally {
      setIsLoading(false);
    }
  };

  // Filter and search logic
  const filteredMealPlans = useMemo(() => {
    return mealPlans.filter(plan => {
      const matchesSearch = 
        plan.residentName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.meals?.breakfast?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.meals?.lunch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.meals?.dinner?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        plan.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        format(plan.date, 'PPPP').toLowerCase().includes(searchTerm.toLowerCase());

      const matchesMealType = 
        !filters.mealType || 
        plan.meals?.breakfast?.toLowerCase().includes(filters.mealType.toLowerCase()) || 
        plan.meals?.lunch?.toLowerCase().includes(filters.mealType.toLowerCase()) || 
        plan.meals?.dinner?.toLowerCase().includes(filters.mealType.toLowerCase());

      const matchesDietaryNeed = 
        !filters.dietaryNeed || 
        plan.notes?.toLowerCase().includes(filters.dietaryNeed.toLowerCase());

      const matchesDateRange = 
        (!filters.dateRange.start || plan.date >= filters.dateRange.start) &&
        (!filters.dateRange.end || plan.date <= filters.dateRange.end);

      return matchesSearch && matchesMealType && matchesDietaryNeed && matchesDateRange;
    });
  }, [mealPlans, searchTerm, filters]);

  // Grouping logic
  const groupedMealPlans = useMemo(() => {
    if (groupBy === 'none') return { 'All Meal Plans': filteredMealPlans };
    
    const groups = {};
    
    filteredMealPlans.forEach(plan => {
      let key;
      
      if (groupBy === 'week') {
        const weekNumber = getWeek(plan.date);
        const weekStart = startOfWeek(plan.date);
        const weekEnd = endOfWeek(plan.date);
        key = `Week ${weekNumber} (${format(weekStart, 'MMM d')} - ${format(weekEnd, 'MMM d, yyyy')})`;
      } 
      else if (groupBy === 'resident') {
        key = plan.residentName || 'Unknown Resident';
      }
      else if (groupBy === 'dietary') {
        key = plan.notes || 'No dietary notes';
      }
      
      if (!groups[key]) groups[key] = [];
      groups[key].push(plan);
    });
    
    return groups;
  }, [filteredMealPlans, groupBy]);

  // Form handlers
  const handleChange = (e) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const handleResidentChange = (e) => {
    const residentId = e.target.value;
    const selected = residents.find(r => r._id === residentId);
    setSelectedResident(selected);
    setFormData(prev => ({ ...prev, residentId }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedResident) {
      alert("Please select a valid resident.");
      return;
    }

    const payload = {
      residentName: selectedResident.name,
      date: formData.date,
      meals: {
        breakfast: formData.breakfast,
        lunch: formData.lunch,
        dinner: formData.dinner
      },
      notes: formData.notes
    };

    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      const config = { headers: { Authorization: token } };
      
      if (editingPlan) {
        await axios.put(
          `http://localhost:3000/api/meal-plans/${editingPlan._id}`, 
          payload,
          config
        );
      } else {
        await axios.post(
          'http://localhost:3000/api/meal-plans', 
          payload,
          config
        );
      }
      await fetchMealPlans();
      resetForm();
    } catch (err) {
      console.error('Meal plan submission error:', err);
      alert(`Failed to ${editingPlan ? 'update' : 'add'} meal plan. Please check input fields.`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEdit = (plan) => {
    const resident = residents.find(r => r.name === plan.residentName);
    setEditingPlan(plan);
    setSelectedResident(resident);
    setFormData({
      residentId: resident?._id || '',
      date: format(plan.date, 'yyyy-MM-dd'),
      breakfast: plan.meals?.breakfast || '',
      lunch: plan.meals?.lunch || '',
      dinner: plan.meals?.dinner || '',
      notes: plan.notes || ''
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = (id) => {
    setOpenDialog(true);
    setEditingPlan(mealPlans.find(plan => plan._id === id));
  };

  const confirmDelete = async () => {
    try {
      setIsLoading(true);
      const token = localStorage.getItem('token');
      await axios.delete(
        `http://localhost:3000/api/meal-plans/${editingPlan._id}`,
        { headers: { Authorization: token } }
      );
      await fetchMealPlans();
      setOpenDialog(false);
      setEditingPlan(null);
    } catch (err) {
      console.error('Delete error:', err);
      alert('Failed to delete meal plan.');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      residentId: '',
      date: '',
      breakfast: '',
      lunch: '',
      dinner: '',
      notes: '',
    });
    setSelectedResident(null);
    setEditingPlan(null);
  };

  // Helper functions
  const getResidentNameById = (name) => name || 'Resident';

  const displayArrayData = (data) => {
    if (!data) return 'None';
    if (Array.isArray(data)) return data.join(', ');
    return String(data);
  };

  const MealPlanCard = ({ plan }) => {
    return (
      <Card sx={{ 
        boxShadow: 2, 
        borderRadius: 2, 
        backgroundColor: '#ffffff',
        height: '100%',
        borderLeft: '4px solid',
        borderColor: 'secondary.main',
        '&:hover': {
          boxShadow: 4
        }
      }}>
        <CardContent>
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 1
          }}>
            <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
              {getResidentNameById(plan.residentName)}
            </Typography>
            <Box>
              <IconButton 
                color="primary" 
                onClick={() => handleEdit(plan)}
                disabled={isLoading}
                aria-label="edit"
              >
                <EditIcon />
              </IconButton>
              <IconButton 
                color="error" 
                onClick={() => handleDelete(plan._id)}
                disabled={isLoading}
                aria-label="delete"
              >
                <DeleteIcon />
              </IconButton>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Chip 
              label={format(plan.date, 'PPPP')} 
              color="primary" 
              size="small"
              variant="outlined"
            />
          </Box>
          
          <Divider sx={{ my: 1.5 }} />
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: '2em', textAlign: 'center', fontSize: '1.2em' }}>🍳</Typography>
            <Typography><strong>Breakfast:</strong> {plan.meals?.breakfast || 'Not specified'}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: '2em', textAlign: 'center', fontSize: '1.2em' }}>🍲</Typography>
            <Typography><strong>Lunch:</strong> {plan.meals?.lunch || 'Not specified'}</Typography>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <Typography sx={{ minWidth: '2em', textAlign: 'center', fontSize: '1.2em' }}>🍽️</Typography>
            <Typography><strong>Dinner:</strong> {plan.meals?.dinner || 'Not specified'}</Typography>
          </Box>
          
          {plan.notes && (
            <>
              <Divider sx={{ my: 1.5 }} />
              <Box sx={{ display: 'flex', alignItems: 'flex-start' }}>
                <Typography sx={{ minWidth: '2em', textAlign: 'center', fontSize: '1.2em' }}>📝</Typography>
                <Typography><strong>Notes:</strong> {plan.notes}</Typography>
              </Box>
            </>
          )}
        </CardContent>
      </Card>
    );
  };

  return (
    <Box sx={{ 
      px: { xs: 2, md: 6 }, 
      py: 4, 
      backgroundColor: '#f0f2f5', 
      minHeight: '100vh',
      overflow: 'hidden'
    }}>
      <Typography variant="h4" fontWeight={600} gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
        <RestaurantIcon fontSize="large" sx={{ mr: 1 }} />
        {editingPlan ? 'Edit Meal Plan' : 'Meal Plans'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Form */}
      <Card sx={{ 
        p: 4, 
        mb: 4, 
        boxShadow: 3, 
        borderRadius: 2, 
        backgroundColor: '#ffffff',
        borderLeft: '4px solid',
        borderColor: 'primary.main'
      }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                select
                name="residentId"
                label="Select Resident"
                value={formData.residentId}
                onChange={handleResidentChange}
                required
                fullWidth
                variant="outlined"
                InputProps={{
                  sx: { 
                    height: '56px', 
                    backgroundColor: 'white',
                    minWidth: '200px'
                  }
                }}
                error={!!error}
                helperText={error ? "Failed to load residents" : ""}
              >
                {residents.map((resident) => (
                  <MenuItem key={resident._id} value={resident._id}>
                    {resident.name} (Age {resident.age})
                  </MenuItem>
                ))}
              </TextField>
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                name="date"
                label="Date"
                type="date"
                value={formData.date}
                onChange={handleChange}
                InputLabelProps={{ shrink: true }}
                fullWidth
                required
                InputProps={{
                  sx: { 
                    height: '56px', 
                    backgroundColor: 'white' 
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="breakfast"
                label="Breakfast"
                value={formData.breakfast}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  sx: { 
                    backgroundColor: 'white',
                    height: '56px'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="lunch"
                label="Lunch"
                value={formData.lunch}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  sx: { 
                    backgroundColor: 'white',
                    height: '56px'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                name="dinner"
                label="Dinner"
                value={formData.dinner}
                onChange={handleChange}
                fullWidth
                InputProps={{
                  sx: { 
                    backgroundColor: 'white',
                    height: '56px'
                  }
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                name="notes"
                label="Notes (e.g. diabetic)"
                value={formData.notes}
                onChange={handleChange}
                multiline
                rows={3}
                fullWidth
                InputProps={{
                  sx: { backgroundColor: 'white' }
                }}
              />
            </Grid>

            {selectedResident && (
              <Grid item xs={12}>
                <Box sx={{ 
                  p: 2, 
                  backgroundColor: '#e3f2fd', 
                  borderRadius: 1,
                  borderLeft: '3px solid',
                  borderColor: 'info.main'
                }}>
                  <Typography variant="subtitle1" gutterBottom>
                    <strong>Allergies:</strong> {displayArrayData(selectedResident.allergies)}
                  </Typography>
                  <Typography variant="subtitle1">
                    <strong>Dietary Restrictions:</strong> {displayArrayData(selectedResident.dietary)}
                  </Typography>
                </Box>
              </Grid>
            )}

            <Grid item xs={12}>
              <Button 
                variant="contained" 
                type="submit" 
                fullWidth 
                size="large"
                disabled={isLoading}
                sx={{
                  py: 1.5,
                  fontWeight: 'bold',
                  fontSize: '1rem',
                  height: '56px'
                }}
              >
                {isLoading ? 'Processing...' : editingPlan ? 'Update Meal Plan' : 'Add Meal Plan'}
              </Button>
              {editingPlan && (
                <Button
                  variant="outlined"
                  fullWidth
                  size="large"
                  disabled={isLoading}
                  sx={{
                    mt: 2,
                    py: 1.5,
                    fontWeight: 'bold',
                    fontSize: '1rem',
                    height: '56px'
                  }}
                  onClick={resetForm}
                >
                  Cancel
                </Button>
              )}
            </Grid>
          </Grid>
        </form>
      </Card>

      {/* Meal Plans List */}
      <Box sx={{ mt: 4 }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          mb: 3
        }}>
          <Typography variant="h5" color="primary" sx={{ display: 'flex', alignItems: 'center' }}>
            <NotesIcon sx={{ mr: 1 }} />
            All Meal Plans
          </Typography>
          
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button
              variant="outlined"
              startIcon={<FilterListIcon />}
              onClick={() => setShowFilters(!showFilters)}
            >
              Filters
            </Button>
            <FormControl sx={{ minWidth: 180 }} size="small">
              <InputLabel>Group By</InputLabel>
              <Select
                value={groupBy}
                onChange={(e) => setGroupBy(e.target.value)}
                label="Group By"
                startAdornment={
                  <InputAdornment position="start">
                    <GroupWorkIcon />
                  </InputAdornment>
                }
              >
                <MenuItem value="none">No Grouping</MenuItem>
                <MenuItem value="week">Week</MenuItem>
                <MenuItem value="resident">Resident</MenuItem>
                <MenuItem value="dietary">Dietary Notes</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </Box>

        {/* Search and Filters */}
        <Box sx={{ mb: 3 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder="Search by name, date, meal, or notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              sx: { backgroundColor: 'white' }
            }}
          />
          
          {showFilters && (
            <Paper elevation={2} sx={{ p: 3, mt: 2, backgroundColor: 'white' }}>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    select
                    fullWidth
                    label="Meal Type"
                    value={filters.mealType}
                    onChange={(e) => setFilters({...filters, mealType: e.target.value})}
                  >
                    <MenuItem value="">All Meal Types</MenuItem>
                    <MenuItem value="breakfast">Breakfast</MenuItem>
                    <MenuItem value="lunch">Lunch</MenuItem>
                    <MenuItem value="dinner">Dinner</MenuItem>
                  </TextField>
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="Dietary Needs"
                    placeholder="e.g. diabetic"
                    value={filters.dietaryNeed}
                    onChange={(e) => setFilters({...filters, dietaryNeed: e.target.value})}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="From Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateRange.start ? format(filters.dateRange.start, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters({
                      ...filters, 
                      dateRange: {
                        ...filters.dateRange, 
                        start: e.target.value ? new Date(e.target.value) : null
                      }
                    })}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    fullWidth
                    label="To Date"
                    type="date"
                    InputLabelProps={{ shrink: true }}
                    value={filters.dateRange.end ? format(filters.dateRange.end, 'yyyy-MM-dd') : ''}
                    onChange={(e) => setFilters({
                      ...filters, 
                      dateRange: {
                        ...filters.dateRange, 
                        end: e.target.value ? new Date(e.target.value) : null
                      }
                    })}
                  />
                </Grid>
              </Grid>
            </Paper>
          )}
        </Box>

        {isLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <Typography>Loading meal plans...</Typography>
          </Box>
        ) : filteredMealPlans.length === 0 ? (
          <Card sx={{ 
            p: 3, 
            textAlign: 'center', 
            boxShadow: 2,
            backgroundColor: '#ffffff',
            borderRadius: 2
          }}>
            <Typography variant="body1">
              {searchTerm || Object.values(filters).some(f => f) 
                ? 'No meal plans match your search criteria.' 
                : 'No meal plans available.'}
            </Typography>
          </Card>
        ) : (
          <Box>
            {Object.entries(groupedMealPlans).map(([groupName, plans]) => (
              <Box key={groupName} sx={{ mb: 4 }}>
                {groupBy !== 'none' && (
                  <Typography variant="h6" sx={{ 
                    mb: 2, 
                    p: 1, 
                    backgroundColor: 'primary.main', 
                    color: 'white',
                    borderRadius: 1,
                    display: 'inline-block'
                  }}>
                    {groupName}
                  </Typography>
                )}
                
                <Grid container spacing={3}>
                  {plans.map((plan) => (
                    <Grid item xs={12} md={groupBy === 'none' ? 6 : 12} key={plan._id}>
                      <MealPlanCard plan={plan} />
                    </Grid>
                  ))}
                </Grid>
              </Box>
            ))}
          </Box>
        )}
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>
          Confirm Delete
          <IconButton
            aria-label="close"
            onClick={() => setOpenDialog(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete the meal plan for {editingPlan?.residentName} on {editingPlan?.date && format(editingPlan.date, 'PPPP')}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)} disabled={isLoading}>
            Cancel
          </Button>
          <Button 
            onClick={confirmDelete} 
            color="error" 
            variant="contained"
            disabled={isLoading}
            startIcon={<DeleteIcon />}
          >
            {isLoading ? 'Deleting...' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default MealPlans;