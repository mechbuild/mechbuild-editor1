const mongoose = require('mongoose');

const subscriptionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'premium', 'enterprise'],
    default: 'free'
  },
  status: {
    type: String,
    enum: ['active', 'cancelled', 'expired'],
    default: 'active'
  },
  startDate: {
    type: Date,
    default: Date.now
  },
  endDate: {
    type: Date
  },
  autoRenew: {
    type: Boolean,
    default: false
  },
  paymentMethod: {
    type: String,
    enum: ['credit_card'],
    default: 'credit_card'
  },
  lastPaymentDate: {
    type: Date
  },
  nextPaymentDate: {
    type: Date
  },
  cardLastFour: {
    type: String
  },
  features: {
    maxProjects: {
      type: Number,
      default: 3
    },
    maxTeamMembers: {
      type: Number,
      default: 2
    },
    storageLimit: {
      type: Number,
      default: 1024 // MB
    },
    prioritySupport: {
      type: Boolean,
      default: false
    },
    customDomain: {
      type: Boolean,
      default: false
    }
  }
}, {
  timestamps: true
});

// Plan özelliklerini ayarlayan statik metod
subscriptionSchema.statics.getPlanFeatures = function(plan) {
  const features = {
    free: {
      maxProjects: 3,
      maxTeamMembers: 2,
      storageLimit: 1024,
      prioritySupport: false,
      customDomain: false
    },
    basic: {
      maxProjects: 10,
      maxTeamMembers: 5,
      storageLimit: 5120,
      prioritySupport: false,
      customDomain: false
    },
    premium: {
      maxProjects: 50,
      maxTeamMembers: 20,
      storageLimit: 10240,
      prioritySupport: true,
      customDomain: true
    },
    enterprise: {
      maxProjects: 999,
      maxTeamMembers: 999,
      storageLimit: 51200,
      prioritySupport: true,
      customDomain: true
    }
  };

  return features[plan] || features.free;
};

// Abonelik bitiş tarihini hesaplayan metod
subscriptionSchema.methods.calculateEndDate = function() {
  const planDurations = {
    free: 0, // Süresiz
    basic: 30, // 30 gün
    premium: 30, // 30 gün
    enterprise: 365 // 1 yıl
  };

  if (this.plan === 'free') {
    return null; // Free plan süresiz
  }

  const duration = planDurations[this.plan];
  const endDate = new Date(this.startDate);
  endDate.setDate(endDate.getDate() + duration);
  return endDate;
};

// Abonelik durumunu kontrol eden metod
subscriptionSchema.methods.checkStatus = function() {
  if (this.status === 'cancelled') {
    return 'cancelled';
  }

  if (this.endDate && new Date() > this.endDate) {
    return 'expired';
  }

  return 'active';
};

const Subscription = mongoose.model('Subscription', subscriptionSchema);

module.exports = Subscription; 