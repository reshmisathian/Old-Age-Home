const mongoose = require('mongoose');

const MedicineSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  dosage: {
    type: String,
    trim: true
  },
  frequency: {
    type: String,
    trim: true
  }
});

const DiseaseSchema = new mongoose.Schema({
  name: {
    type: String,
    trim: true
  },
  medicines: [MedicineSchema]
});

const ResidentSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  dob: {
     type: Date, 
     required: true
     },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
    required: true
  },
  admissionDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  emergencyContact: {
    type: String,
    required: true,
    trim: true
  },
  history: {
    type: String,
    trim: true
  },
  room: {
    type: String,
    required: true,
    trim: true
  },
  dietary: {
    type: String,
    trim: true
  },
  diseases: [DiseaseSchema],
  allergies: {
    type: String,
    trim: true
  },
  document: {
    type: String,
    trim: true
  },
  photo: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

ResidentSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

module.exports = mongoose.model('Resident', ResidentSchema);
