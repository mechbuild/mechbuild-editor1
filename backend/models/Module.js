const mongoose = require('mongoose');

const moduleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Modül adı gereklidir'],
    trim: true,
    minlength: [3, 'Modül adı en az 3 karakter olmalıdır']
  },
  project: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Project',
    required: [true, 'Proje referansı gereklidir']
  },
  type: {
    type: String,
    enum: ['yangın', 'hvac', 'elektrik', 'mekanik', 'diğer'],
    required: [true, 'Modül tipi gereklidir']
  },
  status: {
    type: String,
    enum: ['active', 'in_progress', 'completed', 'archived'],
    default: 'active'
  },
  description: {
    type: String,
    trim: true
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  updatedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  files: [{
    name: String,
    path: String,
    type: String,
    size: Number,
    uploadedAt: {
      type: Date,
      default: Date.now
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }
  }],
  settings: {
    isPublic: {
      type: Boolean,
      default: false
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
});

// Güncelleme tarihini otomatik olarak güncelle
moduleSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Modül silme yerine arşivleme
moduleSchema.pre('remove', async function(next) {
  try {
    this.status = 'archived';
    await this.save();
    next();
  } catch (error) {
    next(error);
  }
});

// Dosya ekleme metodu
moduleSchema.methods.addFile = async function(fileData, userId) {
  this.files.push({
    ...fileData,
    uploadedBy: userId
  });
  
  return await this.save();
};

// Dosya silme metodu
moduleSchema.methods.removeFile = async function(fileName) {
  this.files = this.files.filter(f => f.name !== fileName);
  return await this.save();
};

// Modül durumunu güncelleme metodu
moduleSchema.methods.updateStatus = async function(newStatus, userId) {
  this.status = newStatus;
  this.updatedBy = userId;
  return await this.save();
};

const Module = mongoose.model('Module', moduleSchema);

module.exports = Module; 