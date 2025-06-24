const mongoose = require('mongoose');

const AppointmentSchema = new mongoose.Schema({
  residentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Resident',
    required: [true, 'Resident ID is required'],
    validate: {
      validator: async function(value) {
        if (!mongoose.Types.ObjectId.isValid(value)) return false;
        const resident = await mongoose.model('Resident').findById(value);
        return resident !== null;
      },
      message: 'Resident not found or invalid ID'
    }
  },
  type: {
    type: String,
    enum: {
      values: ['doctor', 'family'],
      message: 'Appointment type must be either "doctor" or "family"'
    },
    required: [true, 'Appointment type is required']
  },
  date: {
    type: Date,
    required: [true, 'Date and time are required'],
    validate: {
      validator: function(value) {
        return value > new Date();
      },
      message: 'Appointment date must be in the future'
    }
  },
  purpose: {
    type: String,
    trim: true,
    required: [true, 'Purpose is required'],
    maxlength: [500, 'Purpose cannot be more than 500 characters']
  },
  notes: {
    type: String,
    trim: true,
    default: '',
    maxlength: [1000, 'Notes cannot be more than 1000 characters']
  },
  completed: {
    type: Boolean,
    default: false
  },
  doctorName: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'doctor';
    },
    maxlength: [100, 'Doctor name cannot be more than 100 characters']
  },
  hospitalName: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'doctor';
    },
    maxlength: [100, 'Hospital name cannot be more than 100 characters']
  },
  relativeName: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'family';
    },
    maxlength: [100, 'Relative name cannot be more than 100 characters']
  },
  relation: {
    type: String,
    trim: true,
    required: function() {
      return this.type === 'family';
    },
    maxlength: [50, 'Relation cannot be more than 50 characters']
  },
  relativeNumber: {
    type: String,
    trim: true,
    default: '',
    validate: {
      validator: function(v) {
        if (!v) return true;
        return /^[0-9]{10,15}$/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Creator user ID is required'],
    validate: {
      validator: async function(value) {
        if (!mongoose.Types.ObjectId.isValid(value)) return false;
        const user = await mongoose.model('User').findById(value);
        return user !== null;
      },
      message: 'User not found or invalid ID'
    }
  }
}, { 
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  },
  toObject: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

AppointmentSchema.virtual('formattedDate').get(function() {
  return this.date.toISOString();
});

AppointmentSchema.virtual('daysLeft').get(function() {
  const today = new Date();
  const diffInDays = Math.ceil((this.date - today) / (1000 * 60 * 60 * 24));
  return diffInDays > 0 ? diffInDays : 0;
});

AppointmentSchema.virtual('notificationMessage').get(function() {
  const days = this.daysLeft;
  const residentName = this.residentId?.name || 'Resident';
  
  if (this.type === 'doctor') {
    return days === 0 
      ? `Today is ${residentName}'s doctor appointment` 
      : `${days} day${days !== 1 ? 's' : ''} left for ${residentName}'s doctor appointment`;
  } else {
    return days === 0
      ? `Today is ${residentName}'s family visit`
      : `${days} day${days !== 1 ? 's' : ''} left for ${residentName}'s family visit`;
  }
});

AppointmentSchema.index({ residentId: 1 });
AppointmentSchema.index({ date: 1 });
AppointmentSchema.index({ type: 1 });
AppointmentSchema.index({ completed: 1 });
AppointmentSchema.index({ createdBy: 1 });
AppointmentSchema.index({ createdAt: 1 });
AppointmentSchema.index({ 
  doctorName: 'text', 
  hospitalName: 'text', 
  relativeName: 'text', 
  purpose: 'text', 
  notes: 'text',
  relation: 'text'
});

AppointmentSchema.pre('save', async function(next) {
  if (this.type === 'doctor') {
    if (!this.doctorName || !this.hospitalName) {
      throw new Error('Doctor appointments require both doctor name and hospital name');
    }
  } else if (this.type === 'family') {
    if (!this.relativeName || !this.relation) {
      throw new Error('Family appointments require both relative name and relation');
    }
  }
  
  const resident = await mongoose.model('Resident').findById(this.residentId);
  if (!resident) {
    throw new Error('Associated resident not found');
  }

  const user = await mongoose.model('User').findById(this.createdBy);
  if (!user) {
    throw new Error('Creator user not found');
  }

  next();
});

AppointmentSchema.statics.getUpcoming = function(days = 7) {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + days);
  
  return this.find({
    date: { $gte: today, $lte: endDate },
    completed: false
  })
  .populate('residentId', 'name photo room dob')
  .populate('createdBy', 'username')
  .sort({ date: 1 });
};

AppointmentSchema.statics.search = function(query) {
  return this.find({
    $or: [
      { purpose: { $regex: query, $options: 'i' } },
      { doctorName: { $regex: query, $options: 'i' } },
      { hospitalName: { $regex: query, $options: 'i' } },
      { relativeName: { $regex: query, $options: 'i' } },
      { relation: { $regex: query, $options: 'i' } },
      { notes: { $regex: query, $options: 'i' } }
    ]
  })
  .populate('residentId', 'name photo room')
  .populate('createdBy', 'username');
};

AppointmentSchema.methods.markAsCompleted = async function() {
  if (this.completed) {
    throw new Error('Appointment is already completed');
  }
  
  if (this.date > new Date()) {
    throw new Error('Cannot complete future appointments');
  }

  this.completed = true;
  return this.save();
};

AppointmentSchema.query.upcoming = function(days = 7) {
  const today = new Date();
  const endDate = new Date();
  endDate.setDate(today.getDate() + days);
  return this.where('date').gte(today).lte(endDate);
};

AppointmentSchema.query.byType = function(type) {
  return this.where('type').equals(type);
};

module.exports = mongoose.model('Appointment', AppointmentSchema);