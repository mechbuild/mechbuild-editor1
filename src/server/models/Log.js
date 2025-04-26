const mongoose = require('mongoose');

const logSchema = new mongoose.Schema({
  level: {
    type: String,
    enum: ['info', 'warning', 'error', 'debug'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  source: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Index for faster queries
logSchema.index({ timestamp: -1 });
logSchema.index({ level: 1 });
logSchema.index({ source: 1 });

const Log = mongoose.model('Log', logSchema);

module.exports = Log; 