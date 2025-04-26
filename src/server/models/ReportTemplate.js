const mongoose = require('mongoose');

const reportTemplateSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  description: String,
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  styles: {
    fontFamily: {
      type: String,
      default: 'Arial, sans-serif'
    },
    primaryColor: {
      type: String,
      default: '#333333'
    },
    secondaryColor: {
      type: String,
      default: '#666666'
    },
    accentColor: {
      type: String,
      default: '#007bff'
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    headerStyle: {
      type: String,
      enum: ['centered', 'left-aligned'],
      default: 'centered'
    },
    pageSize: {
      type: String,
      enum: ['A4', 'Letter', 'Legal'],
      default: 'A4'
    }
  },
  sections: [{
    name: {
      type: String,
      required: true
    },
    title: {
      type: String,
      required: true
    },
    enabled: {
      type: Boolean,
      default: true
    },
    order: {
      type: Number,
      required: true
    },
    customContent: {
      header: String,
      footer: String
    }
  }],
  metadata: {
    version: {
      type: Number,
      default: 1
    },
    lastModified: {
      type: Date,
      default: Date.now
    },
    tags: [String]
  }
});

reportTemplateSchema.index({ name: 1 });
reportTemplateSchema.index({ 'metadata.tags': 1 });
reportTemplateSchema.index({ createdBy: 1, name: 1 });

module.exports = mongoose.model('ReportTemplate', reportTemplateSchema); 