import React, { useEffect, useState } from 'react';
import './App.css';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Box, CircularProgress } from '@mui/material';

import NavBar from './components/NavBar';
import Home from './components/Home';
import Login from './components/Login';
import Register from './components/Register';
import AdminPanel from './components/AdminPanel';
import AddResident from './components/AddResident';
import ViewResident from './components/ViewResident';
import ActivityParticipation from './components/ActivityParticipation';
import ActivityGallery from './components/ActivityGallery';
import ActivityDetails from './components/ActivityDetails';
import StaffFeedbackList from './components/StaffFeedbackList';


import SidebarLayout from './components/SidebarLayout';
import MealPlans from './components/MealPlans';
import Appointments from './components/Appointments';
import Birthdays from './components/Birthdays';
import FeedbackPage from './components/FeedbackPage';

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    setIsLoading(false);
  }, []);

  const handleDrawerToggle = () => {
    setDrawerOpen((prev) => !prev);
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <>
      <NavBar
        isLoggedIn={isLoggedIn}
        setIsLoggedIn={setIsLoggedIn}
        toggleDrawer={handleDrawerToggle}
      />

      <Box sx={{ px: 4, py: 4 }}> {/* Removed mobile-responsive padding */}
        <Routes>
          {/* Public Pages */}
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login setIsLoggedIn={setIsLoggedIn} />} />
          <Route path="/register" element={<Register />} />

          {/* Protected Routes - wrapped with Sidebar */}
          <Route
            path="/"
            element={
              isLoggedIn ? (
                <SidebarLayout drawerOpen={drawerOpen} toggleDrawer={handleDrawerToggle} />
              ) : (
                <Navigate to="/login" />
              )
            }
          >
            <Route path="admin" element={<AdminPanel />} />
            <Route path="add" element={<AddResident />} />
            <Route path="residents" element={<ViewResident />} />
	 <Route path="stafffeedback" element={<StaffFeedbackList />} />

            <Route path="activities" element={<ActivityGallery />} />
            <Route path="activity-participation" element={<ActivityParticipation />} />
            <Route path="activities/:activityName" element={<ActivityDetails />} />
            <Route path="dashboard/meal-plans" element={<MealPlans />} />
            <Route path="dashboard/appointments" element={<Appointments />} />
            <Route path="dashboard/birthdays" element={<Birthdays />} />
            <Route path="dashboard/feedback" element={<FeedbackPage />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Box>
    </>
  );
}

export default App;
