const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  location: { type: String, required: true },
  startDate: { type: Date, required: true },
  status: {
    type: String,
    enum: ['active', 'completed', 'archived'],
    default: 'active'
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  members: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['owner', 'admin', 'member'],
      default: 'member'
    }
  }],
  settings: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  buildingType: { 
    type: String, 
    required: true,
    enum: ['Otel', 'Ofis', 'Fabrika', 'Hastane', 'AVM', 'Konut', 'Diğer']
  },
  area: { 
    type: Number, 
    required: true,
    min: 0 
  },
  floorCount: { 
    type: Number, 
    required: true,
    min: 1 
  },
  activeModules: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  logs: [
    {
      date: { type: Date, default: Date.now },
      type: String, // "AI", "PDF", "COMMAND"
      message: String
    }
  ]
}, {
  timestamps: true
});

// Indexes for faster queries
projectSchema.index({ name: 1 });
projectSchema.index({ status: 1 });
projectSchema.index({ createdBy: 1 });
projectSchema.index({ 'members.user': 1 });

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 