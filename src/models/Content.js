const mongoose = require('mongoose');

const contentSchema = new mongoose.Schema({
  id: {
    type: Number,
    required: [true, 'Content ID is required'],
    unique: true
  },
  name: {
    type: String,
    required: [true, 'Content name is required'],
    trim: true
  },
  year: {
    type: Number,
    required: [true, 'Year is required']
  },
  genre: {
    type: String,
    required: [true, 'Genre is required'],
    trim: true
  },
  type: {
    type: String,
    required: [true, 'Type is required'],
    enum: ['series', 'movie']
  },
  // Series specific fields
  episodes: {
    type: Number,
    required: function() {
      return this.type === 'series';
    }
  },
  seasons: {
    type: Number,
    required: function() {
      return this.type === 'series';
    }
  },
  // Movie specific field
  duration: {
    type: String,
    required: function() {
      return this.type === 'movie';
    }
  },
  rating: {
    type: String,
    required: [true, 'Rating is required']
  },
  description: {
    type: String,
    required: [true, 'Description is required']
  },
  image: {
    type: String,
    required: [true, 'Image path is required']
  },
  videoUrl: {
    type: String,
    required: false,
    default: null
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Content', contentSchema);
