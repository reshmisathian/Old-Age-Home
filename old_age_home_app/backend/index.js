const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');

const Resident = require('./model/Resident');
const User = require('./model/User');
const Activity = require('./model/Activity');
const logActivity = require('./utils/logActivity');
const upload = require('./utils/upload');

const MealPlan = require('./model/MealPlan');
const StaffFeedback = require('./model/StaffFeedback');
const Appointment = require('./model/Appointment');

require('./db'); 

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const authenticate = (req, res, next) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).json({ message: 'No token provided' });

  try {
    const decoded = jwt.verify(token, 'mysecret');
    req.user = decoded;
    next();
  } catch {
    res.status(401).json({ message: 'Invalid token' });
  }
};

app.get('/', (req, res) => {
  res.send('Old Age Home API Running');
});

app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  try {
    const exists = await User.findOne({ username });
    if (exists) return res.status(400).json({ message: 'User already exists' });

    const hashed = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashed });
    await user.save();
    res.json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  try {
    const user = await User.findOne({ username });
    if (!user) return res.status(400).json({ message: 'User not found' });

    const match = await bcrypt.compare(password, user.password);
    if (!match) return res.status(401).json({ message: 'Invalid credentials' });

    const token = jwt.sign({ id: user._id, username: user.username }, 'mysecret', { expiresIn: '1h' });
    res.json({ token, message: 'Login successful', user: { id: user._id, username: user.username } });
  } catch {
    res.status(500).json({ message: 'Login error' });
  }
});

app.post('/residents', authenticate, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const residentData = JSON.parse(req.body.data);
    const processedDiseases = residentData.diseases
      .filter(d => d.name?.trim())
      .map(d => ({
        name: d.name.trim(),
        medicines: d.medicines?.filter(m => m.name?.trim()) || []
      }));

    const newResident = new Resident({
      ...residentData,
      diseases: processedDiseases,
      document: req.files.document?.[0]?.filename || null,
      photo: req.files.photo?.[0]?.filename || null,
    });

    await newResident.save();
    await logActivity(req.user.id, 'Added a resident');
    res.send("Resident added");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error adding resident");
  }
});

app.get('/residents', authenticate, async (req, res) => {
  try {
    const residents = await Resident.find();
    res.json(residents);
  } catch (err) {
    res.status(500).send("Error fetching residents");
  }
});

app.put('/residents/:id', authenticate, upload.fields([
  { name: 'document', maxCount: 1 },
  { name: 'photo', maxCount: 1 }
]), async (req, res) => {
  try {
    const updatedData = JSON.parse(req.body.data);
    const processedDiseases = updatedData.diseases
      .filter(d => d.name?.trim())
      .map(d => ({
        name: d.name.trim(),
        medicines: d.medicines?.filter(m => m.name?.trim()) || []
      }));

    const existingResident = await Resident.findById(req.params.id);

    const updatePayload = {
      ...updatedData,
      diseases: processedDiseases,
      document: req.files.document?.[0]?.filename || updatedData.existingDocument || null,
      photo: req.files.photo?.[0]?.filename || updatedData.existingPhoto || null,
    };

    if (req.files.document && existingResident.document) {
      fs.unlink(path.join(__dirname, 'uploads', existingResident.document), err => {
        if (err && err.code !== 'ENOENT') console.error(err);
      });
    }
    if (req.files.photo && existingResident.photo) {
      fs.unlink(path.join(__dirname, 'uploads', existingResident.photo), err => {
        if (err && err.code !== 'ENOENT') console.error(err);
      });
    }

    await Resident.findByIdAndUpdate(req.params.id, updatePayload);
    await logActivity(req.user.id, 'Updated a resident');
    res.send("Resident updated");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error updating resident");
  }
});

app.delete('/residents/:id', authenticate, async (req, res) => {
  try {
    const resident = await Resident.findById(req.params.id);
    if (!resident) return res.status(404).send("Resident not found");

    ['document', 'photo'].forEach(field => {
      if (resident[field]) {
        fs.unlink(path.join(__dirname, 'uploads', resident[field]), err => {
          if (err && err.code !== 'ENOENT') console.error(err);
        });
      }
    });

    await Activity.deleteMany({ residentId: resident._id });

    await Resident.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, 'Deleted a resident');
    res.send("Resident deleted");
  } catch (err) {
    console.error(err);
    res.status(500).send("Error deleting resident");
  }
});

app.post('/activities', authenticate, async (req, res) => {
  try {
    const { residentId, activity, date } = req.body;
    const newActivity = new Activity({ residentId, activity, date });
    await newActivity.save();
    res.json({ message: 'Activity participation recorded' });
  } catch (err) {
    res.status(500).json({ message: 'Error recording activity' });
  }
});

app.get('/activities', authenticate, async (req, res) => {
  try {
    const activities = await Activity.find().populate('residentId', 'name age');
    res.json(activities);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching activities' });
  }
});

app.get('/activities/summary', authenticate, async (req, res) => {
  try {
    const { month, year } = req.query;
    if (!month || !year) return res.status(400).json({ message: 'Month and year are required' });

    const start = new Date(year, month - 1, 1);
    const end = new Date(year, month, 1);

    const participation = await Activity.find({
      date: { $gte: start, $lt: end }
    }).populate('residentId', 'name age');

    const grouped = {};
    for (const entry of participation) {
      const id = entry.residentId?._id;
      if (!id) continue;

      if (!grouped[id]) {
        grouped[id] = {
          residentId: id,
          name: entry.residentId.name,
          age: entry.residentId.age,
          count: 0,
          activities: [],
        };
      }

      grouped[id].count += 1;
      grouped[id].activities.push({
        activity: entry.activity,
        date: entry.date,
      });
    }

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Error in summary:', err);
    res.status(500).json({ message: 'Error fetching summary' });
  }
});

app.get('/users', authenticate, async (req, res) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/users/:id', authenticate, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json("User deleted successfully");
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/user-activity', authenticate, async (req, res) => {
  try {
    const users = await User.find({}, 'username activity');
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching activity' });
  }
});

app.post('/api/meal-plans', authenticate, async (req, res) => {
  try {
    const mealPlan = new MealPlan(req.body);
    await mealPlan.save();
    res.status(201).json(mealPlan);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get('/api/meal-plans', authenticate, async (req, res) => {
  try {
    const plans = await MealPlan.find().sort({ date: -1 });
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/meal-plans/:id', authenticate, async (req, res) => {
  try {
    const updated = await MealPlan.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete('/api/meal-plans/:id', authenticate, async (req, res) => {
  try {
    await MealPlan.findByIdAndDelete(req.params.id);
    res.json({ message: 'Meal plan deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/staff-feedback', authenticate, async (req, res) => {
  try {
    const feedback = new StaffFeedback(req.body);
    await feedback.save();
    res.status(200).json({ message: 'Feedback submitted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error submitting feedback' });
  }
});

app.get('/staff-feedback', authenticate, async (req, res) => {
  try {
    const feedbacks = await StaffFeedback.find();
    res.json(feedbacks);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error fetching feedback' });
  }
});

app.post('/appointments', authenticate, async (req, res) => {
  try {
    if (!req.body.residentId || !req.body.type || !req.body.date || !req.body.purpose) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    let appointmentDate;
    try {
      appointmentDate = new Date(req.body.date);
      if (isNaN(appointmentDate.getTime())) {
        return res.status(400).json({ message: 'Invalid date format' });
      }
    } catch (err) {
      return res.status(400).json({ message: 'Invalid date format' });
    }

    if (appointmentDate < new Date()) {
      return res.status(400).json({ message: 'Cannot create appointment in the past' });
    }

    const appointmentData = {
      residentId: req.body.residentId,
      type: req.body.type,
      date: appointmentDate,
      purpose: req.body.purpose,
      notes: req.body.notes || '',
      createdBy: req.user.id
    };

    if (req.body.type === 'doctor') {
      if (!req.body.doctorName || !req.body.hospitalName) {
        return res.status(400).json({ 
          message: 'Doctor appointments require doctorName and hospitalName' 
        });
      }
      appointmentData.doctorName = req.body.doctorName;
      appointmentData.hospitalName = req.body.hospitalName;
    } 
    else if (req.body.type === 'family') {
      if (!req.body.relativeName || !req.body.relation) {
        return res.status(400).json({ 
          message: 'Family appointments require relativeName and relation' 
        });
      }
      appointmentData.relativeName = req.body.relativeName;
      appointmentData.relation = req.body.relation;
      appointmentData.relativeNumber = req.body.relativeNumber || '';
    }

    const appointment = new Appointment(appointmentData);
    await appointment.save();
    await logActivity(req.user.id, 'Added an appointment');
    
    const savedAppointment = await Appointment.findById(appointment._id)
      .populate('residentId', 'name room photo')
      .populate('createdBy', 'username');
    res.status(201).json(savedAppointment);
    
  } catch (err) {
    console.error('Error creating appointment:', err);
    res.status(500).json({ 
      message: 'Error creating appointment',
      error: err.message 
    });
  }
});

app.get('/appointments', authenticate, async (req, res) => {
  try {
    const appointments = await Appointment.find()
      .populate('residentId', 'name room photo')
      .populate('createdBy', 'username');
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching appointments:', err);
    res.status(500).json({ 
      message: 'Error fetching appointments',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/appointments/upcoming', authenticate, async (req, res) => {
  try {
    const today = new Date();
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(today.getDate() + 7);
    
    const appointments = await Appointment.find({
      date: {
        $gte: today,
        $lte: sevenDaysLater
      },
      completed: { $ne: true }
    })
    .populate('residentId', 'name room photo')
    .populate('createdBy', 'username')
    .sort({ date: 1 });
    
    const enhancedAppointments = appointments.map(appt => {
      const daysLeft = Math.floor((appt.date - today) / (1000 * 60 * 60 * 24));
      
      let notificationType = appt.type;
      let notificationMessage = '';
      
      if (appt.type === 'doctor') {
        notificationMessage = `${daysLeft === 0 ? 'Today' : 
          `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`} for ${appt.residentId?.name || 'Resident'}'s doctor appointment`;
      } else {
        notificationMessage = `${daysLeft === 0 ? 'Today' : 
          `${daysLeft} day${daysLeft !== 1 ? 's' : ''} left`} for ${appt.residentId?.name || 'Resident'}'s family visit`;
      }
      
      return {
        ...appt.toObject(),
        daysLeft,
        notificationType,
        notificationMessage,
        isToday: daysLeft === 0,
        isTomorrow: daysLeft === 1
      };
    });
    
    res.json(enhancedAppointments);
  } catch (err) {
    console.error('Error fetching upcoming appointments:', err);
    res.status(500).json({ 
      message: 'Error fetching upcoming appointments',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/appointments/doctor', authenticate, async (req, res) => {
  try {
    const appointments = await Appointment.find({ type: 'doctor' })
      .populate('residentId', 'name room photo')
      .populate('createdBy', 'username');
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching doctor appointments:', err);
    res.status(500).json({ 
      message: 'Error fetching doctor appointments',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.get('/appointments/family', authenticate, async (req, res) => {
  try {
    const appointments = await Appointment.find({ type: 'family' })
      .populate('residentId', 'name room photo')
      .populate('createdBy', 'username');
    res.json(appointments);
  } catch (err) {
    console.error('Error fetching family appointments:', err);
    res.status(500).json({ 
      message: 'Error fetching family appointments',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

app.put('/appointments/:id', authenticate, async (req, res) => {
  try {
    if (!req.body.residentId || !req.body.type || !req.body.date || !req.body.purpose) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    const updateData = {
      ...req.body,
      date: new Date(req.body.date)
    };

    if (req.body.type === 'doctor') {
      if (!req.body.doctorName || !req.body.hospitalName) {
        return res.status(400).json({ 
          message: 'Doctor appointments require doctorName and hospitalName' 
        });
      }
    } else if (req.body.type === 'family') {
      if (!req.body.relativeName || !req.body.relation) {
        return res.status(400).json({ 
          message: 'Family appointments require relativeName and relation' 
        });
      }
    }

    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    )
    .populate('residentId', 'name room photo')
    .populate('createdBy', 'username');
    
    await logActivity(req.user.id, 'Updated an appointment');
    res.json(appointment);
  } catch (err) {
    console.error('Error updating appointment:', err);
    res.status(500).json({ 
      message: 'Error updating appointment',
      error: err.message 
    });
  }
});

app.delete('/appointments/:id', authenticate, async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    await logActivity(req.user.id, 'Deleted an appointment');
    res.json({ message: 'Appointment deleted' });
  } catch (err) {
    console.error('Error deleting appointment:', err);
    res.status(500).json({ 
      message: 'Error deleting appointment',
      error: err.message 
    });
  }
});

app.get('/appointments/search/:query', authenticate, async (req, res) => {
  try {
    const query = req.params.query;
    
    const appointments = await Appointment.find({
      $or: [
        { purpose: { $regex: query, $options: 'i' } },
        { doctorName: { $regex: query, $options: 'i' } },
        { hospitalName: { $regex: query, $options: 'i' } },
        { relativeName: { $regex: query, $options: 'i' } },
        { notes: { $regex: query, $options: 'i' } }
      ]
    })
    .populate({
      path: 'residentId',
      match: { name: { $regex: query, $options: 'i' } },
      select: 'name room photo'
    })
    .populate('createdBy', 'username')
    .exec();
    
    const filtered = appointments.filter(app => 
      app.residentId || 
      app.purpose?.match(new RegExp(query, 'i')) ||
      app.doctorName?.match(new RegExp(query, 'i')) ||
      app.hospitalName?.match(new RegExp(query, 'i')) ||
      app.relativeName?.match(new RegExp(query, 'i')) ||
      app.notes?.match(new RegExp(query, 'i'))
    );
    
    res.json(filtered);
  } catch (err) {
    console.error('Error searching appointments:', err);
    res.status(500).json({ 
      message: 'Error searching appointments',
      error: err.message 
    });
  }
});

app.patch('/appointments/:id/complete', authenticate, async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(
      req.params.id,
      { completed: true },
      { new: true }
    )
    .populate('residentId', 'name room photo')
    .populate('createdBy', 'username');
    
    res.json(appointment);
  } catch (err) {
    console.error('Error completing appointment:', err);
    res.status(500).json({ 
      message: 'Error completing appointment',
      error: err.message 
    });
  }
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ 
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
