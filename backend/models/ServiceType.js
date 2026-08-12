const mongoose = require('mongoose');

const serviceTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  displayName: {
    ne: { type: String, required: true },  // Nepali
    en: { type: String, required: true }   // English
  },
  description: {
    ne: { type: String, default: '' },
    en: { type: String, default: '' }
  },
  requiredVerificationFields: [{
    type: String
  }],
  basePriceRange: {
    min: { type: Number, default: 0 },
    max: { type: Number, default: 0 }
  },
  categoryGroup: {
    type: String,
    enum: ['medical', 'diagnostic', 'home_repair'],
    default: 'medical'
  },
  icon: {
    type: String,
    default: '🏥'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  sortOrder: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ServiceType', serviceTypeSchema);
