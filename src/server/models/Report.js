const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema({
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  format: {
    type: String,
    enum: ['pdf', 'docx'],
    required: true
  },
  templateId: {
    type: String,
    default: 'default'
  },
  fileName: {
    type: String,
    required: true
  },
  filePath: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  metadata: {
    projectName: String,
    location: String,
    status: String,
    suggestions: [{
      title: String,
      priority: String,
      description: String
    }],
    systems: [{
      name: String,
      requirementLevel: String,
      reason: String,
      technicalDetails: String,
      costImpact: String
    }]
  }
});

reportSchema.index({ projectId: 1, createdAt: -1 });
reportSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('Report', reportSchema); 