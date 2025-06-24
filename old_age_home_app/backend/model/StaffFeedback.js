const mongoose = require('mongoose');
const staffFeedbackSchema = new mongoose.Schema({
  staffName: { type: String, required: true },
  residentInvolved: { type: String },
  rating: { type: Number, min: 0, max: 5 },
  experience: { type: String },
  disagreement: { type: String },
  suggestion: { type: String },
  complaint: { type: String },
  submittedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('StaffFeedback', staffFeedbackSchema);
