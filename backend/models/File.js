const mongoose = require('mongoose');

const fileSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Dosya adı gereklidir'],
    trim: true
  },
  originalName: {
    type: String,
    required: true
  },
  path: {
    type: String,
    required: [true, 'Dosya yolu gereklidir']
  },
  type: {
    type: String,
    required: [true, 'Dosya tipi gereklidir']
  },
  size: {
    type: Number,
    required: [true, 'Dosya boyutu gereklidir']
  },
  module: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module',
    required: [true, 'Modül referansı gereklidir']
  },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  lastModified: {
    type: Date,
    default: Date.now
  },
  metadata: {
    pageCount: Number,
    keywords: [String],
    analysis: {
      type: Map,
      of: mongoose.Schema.Types.Mixed
    }
  },
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  version: {
    type: Number,
    default: 1
  },
  previousVersions: [{
    path: String,
    version: Number,
    modifiedAt: Date,
    modifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }]
});

// Güncelleme tarihini otomatik olarak güncelle
fileSchema.pre('save', function(next) {
  this.lastModified = Date.now();
  next();
});

// Dosya silme yerine arşivleme
fileSchema.pre('remove', async function(next) {
  try {
    this.status = 'archived';
    await this.save();
    next();
  } catch (error) {
    next(error);
  }
});

// Yeni versiyon ekleme metodu
fileSchema.methods.addVersion = async function(newPath, userId) {
  this.previousVersions.push({
    path: this.path,
    version: this.version,
    modifiedAt: this.lastModified,
    modifiedBy: this.uploadedBy
  });
  
  this.path = newPath;
  this.version += 1;
  this.uploadedBy = userId;
  
  return await this.save();
};

// Metadata güncelleme metodu
fileSchema.methods.updateMetadata = async function(newMetadata) {
  this.metadata = {
    ...this.metadata,
    ...newMetadata
  };
  return await this.save();
};

// Dosya durumunu güncelleme metodu
fileSchema.methods.updateStatus = async function(newStatus) {
  this.status = newStatus;
  return await this.save();
};

const File = mongoose.model('File', fileSchema);

module.exports = File; 