const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'नाम आवश्यक छ'], // Name is required
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
  preferredLanguage: {
    type: String,
    enum: ['ne', 'en'],
    default: 'ne'
  },
  role: {
    type: String,
    default: 'patient',
    immutable: true
  },
  verifiedPhone: {
    type: Boolean,
    default: false
  },
  profileImage: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Hash password before save
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
