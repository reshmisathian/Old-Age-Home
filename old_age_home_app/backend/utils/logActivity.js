const User = require('../model/User');

const logActivity = async (userId, action) => {
  try {
    await User.findByIdAndUpdate(userId, {
      $push: {
        activity: {
          action,
          timestamp: new Date()
        }
      }
    });
  } catch (error) {
    console.error("Error logging activity:", error.message);
  }
};

module.exports = logActivity;
