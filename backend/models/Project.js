const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Proje adı gereklidir'],
    trim: true,
    minlength: [3, 'Proje adı en az 3 karakter olmalıdır']
  },
  description: {
    type: String,
    trim: true
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'Proje sahibi gereklidir']
  },
  collaborators: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    role: {
      type: String,
      enum: ['viewer', 'editor', 'admin'],
      default: 'viewer'
    },
    addedAt: {
      type: Date,
      default: Date.now
    }
  }],
  status: {
    type: String,
    enum: ['active', 'archived', 'deleted'],
    default: 'active'
  },
  location: {
    type: String,
    required: [true, 'Proje lokasyonu zorunludur']
  },
  modules: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Module'
  }],
  files: [{
    filename: String,
    path: String,
    size: Number,
    uploadedAt: Date
  }],
  logs: [{
    action: String,
    details: String,
    timestamp: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  settings: {
    theme: {
      type: String,
      default: 'light'
    },
    notifications: {
      type: Boolean,
      default: true
    }
  }
});

// Update timestamps on save
projectSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Proje silme yerine arşivleme
projectSchema.pre('remove', async function(next) {
  try {
    this.status = 'archived';
    await this.save();
    next();
  } catch (error) {
    next(error);
  }
});

// İşbirlikçi ekleme metodu
projectSchema.methods.addCollaborator = async function(userId, role = 'viewer') {
  if (this.collaborators.some(c => c.user.toString() === userId.toString())) {
    throw new Error('Bu kullanıcı zaten projeye eklenmiş');
  }
  
  this.collaborators.push({
    user: userId,
    role: role
  });
  
  return await this.save();
};

// İşbirlikçi kaldırma metodu
projectSchema.methods.removeCollaborator = async function(userId) {
  this.collaborators = this.collaborators.filter(
    c => c.user.toString() !== userId.toString()
  );
  
  return await this.save();
};

// İşbirlikçi rolünü güncelleme metodu
projectSchema.methods.updateCollaboratorRole = async function(userId, newRole) {
  const collaborator = this.collaborators.find(
    c => c.user.toString() === userId.toString()
  );
  
  if (!collaborator) {
    throw new Error('Kullanıcı bulunamadı');
  }
  
  collaborator.role = newRole;
  return await this.save();
};

const Project = mongoose.model('Project', projectSchema);

module.exports = Project; 
module.exports = mongoose.model('Project', projectSchema); 