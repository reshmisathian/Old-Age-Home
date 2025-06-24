const mongoose = require('mongoose');

const MealPlanSchema = new mongoose.Schema({
  residentName: { type: String, required: true },
  date: { type: Date, required: true },
  meals: {
    breakfast: { type: String },
    lunch: { type: String },
    dinner: { type: String },
  },
  notes: { type: String },
  caregiver: { type: String },
  allergies: [{ type: String }],
  dietaryRestrictions: [{ type: String }]
}, { timestamps: true });

module.exports = mongoose.model('MealPlan', MealPlanSchema);
