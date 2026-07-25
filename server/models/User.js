const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    minlength: 3
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  bio: {
    type: String,
    default: '',
    maxlength: 300
  },
  major: {
    type: String,
    default: ''
  },
  graduating: {
    type: String,
    default: ''
  },
  interests: {
    type: String,
    default: ''
  },
  profilePic: {
    type: String,
    default: ''
  },
  profileVisibility: {
    type: String,
    enum: ['public', 'friends'],
    default: 'public'
  },
  batchCrushEnabled: {
    type: Boolean,
    default: true
  },
  isAdmin: {
    type: Boolean,
    default: true
  },
  isOrganizer: {
    type: Boolean,
    default: true
  },
  followers: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  following: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  secretCrushes: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  crushMatches: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    matchedAt: {
      type: Date,
      default: Date.now
    },
    seen: {
      type: Boolean,
      default: false
    }
  }],
  friendRequests: [{
    from: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    to: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
