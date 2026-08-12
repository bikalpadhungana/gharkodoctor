const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const providerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'नाम आवश्यक छ'],
    trim: true,
    maxlength: 100
  },
  phone: {
    type: String,
    required: [true, 'फोन नम्बर आवश्यक छ'],
    unique: true,
    match: [/^\+?[0-9]{7,15}$/, 'कृपया मान्य फोन नम्बर प्रविष्ट गर्नुहोस्']
  },
  email: {
    type: String,
    sparse: true,
    match: [/^\S+@\S+\.\S+$/, 'कृपया मान्य इमेल प्रविष्ट गर्नुहोस्']
  },
  password: {
    type: String,
    required: [true, 'पासवर्ड आवश्यक छ'],
    minlength: 6,
    select: false
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: false
  },
  verificationStatus: {
    type: String,
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  verificationDocs: {
    citizenshipId: { type: String, default: '' },
    licenseNumber: { type: String, default: '' },
    certificatePhoto: { type: String, default: '' }
  },
  verificationNotes: {
    type: String,
    default: ''
  },
  communityReference: {
    type: String,
    default: ''
  },
  serviceArea: [{
    type: String
  }],
  serviceRadiusKm: {
    type: Number,
    default: 5,
    min: 1,
    max: 50
  },
  locationCoords: {
    lat: { type: Number, default: 27.7172 },
    lng: { type: Number, default: 85.3240 }
  },
  availabilitySchedule: [{
    day: {
      type: String,
      enum: ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    },
    startTime: String,
    endTime: String,
    isAvailable: {
      type: Boolean,
      default: true
    }
  }],
  rating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5
  },
  totalRatings: {
    type: Number,
    default: 0
  },
  completedVisits: {
    type: Number,
    default: 0
  },
  isNewProvider: {
    type: Boolean,
    default: true
  },
  role: {
    type: String,
    default: 'provider',
    immutable: true
  },
  address: {
    type: String,
    default: ''
  },
  ward: {
    type: String,
    default: ''
  },
  municipality: {
    type: String,
    default: ''
  },
  bio: {
    type: String,
    default: '',
    maxlength: 500
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before save
providerSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
providerSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Auto-remove "new provider" flag after 10 completed visits
providerSchema.pre('save', function(next) {
  if (this.completedVisits >= 10) {
    this.isNewProvider = false;
  }
  next();
});

module.exports = mongoose.model('Provider', providerSchema);
