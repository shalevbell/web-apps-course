const mongoose = require('mongoose');

const profileSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  name: {
    type: String,
    required: [true, 'Profile name is required'],
    trim: true,
    minlength: [1, 'Profile name cannot be empty'],
    maxlength: [20, 'Profile name cannot exceed 20 characters']
  },
  avatar: {
    type: String,
    required: [true, 'Avatar is required'],
    enum: {
      values: ['profile_pic_1.png', 'profile_pic_2.png', 'profile_pic_3.png', 'profile_pic_4.png'],
      message: 'Invalid avatar selection'
    }
  },
  likes: [{
    type: Number,
    min: 1
  }]
}, {
  timestamps: true
});

// Ensure unique profile names per user
profileSchema.index({ userId: 1, name: 1 }, { unique: true });

module.exports = mongoose.model('Profile', profileSchema);
