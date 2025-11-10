const mongoose = require('mongoose');

const viewingHistorySchema = new mongoose.Schema({
  profileId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Profile',
    required: [true, 'Profile ID is required'],
    index: true
  },
  contentId: {
    type: Number,
    required: [true, 'Content ID is required'],
    index: true
  },
  currentTime: {
    type: Number,
    required: [true, 'Current time is required'],
    default: 0,
    min: [0, 'Current time cannot be negative']
  },
  duration: {
    type: Number,
    required: [true, 'Duration is required'],
    min: [0, 'Duration cannot be negative']
  },
  completed: {
    type: Boolean,
    default: false
  },
  lastWatched: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Compound index for efficient queries
viewingHistorySchema.index({ profileId: 1, contentId: 1 }, { unique: true });

// Update lastWatched before saving
viewingHistorySchema.pre('save', function(next) {
  this.lastWatched = new Date();
  next();
});

module.exports = mongoose.model('ViewingHistory', viewingHistorySchema);
