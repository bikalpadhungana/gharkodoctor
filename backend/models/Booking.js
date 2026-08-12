const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  patient: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  provider: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Provider',
    default: null
  },
  serviceType: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ServiceType',
    required: true
  },
  status: {
    type: String,
    enum: ['requested', 'confirmed', 'en_route', 'completed', 'cancelled'],
    default: 'requested'
  },
  scheduledTime: {
    type: Date,
    required: [true, 'समय तोक्नुहोस्'] // Please set a time
  },
  address: {
    type: String,
    required: [true, 'ठेगाना आवश्यक छ'] // Address is required
  },
  ward: {
    type: String,
    default: ''
  },
  municipality: {
    type: String,
    default: ''
  },
  paymentMethod: {
    type: String,
    enum: ['esewa', 'khalti', 'cash'],
    default: 'cash'
  },
  paymentStatus: {
    type: String,
    enum: ['pending', 'paid', 'refunded'],
    default: 'pending'
  },
  amount: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    default: '',
    maxlength: 1000
  },
  emergencyContact: {
    type: String,
    default: ''
  },
  cancellationReason: {
    type: String,
    default: ''
  },
  visitReport: {
    summary: { type: String, default: '' },
    vitalSigns: {
      bp: { type: String, default: '' },
      pulse: { type: String, default: '' },
      temp: { type: String, default: '' },
      spo2: { type: String, default: '' }
    },
    completedTasks: [{ type: String }],
    documents: [{
      name: { type: String, default: 'Medical Document' },
      fileData: { type: String },
      mimeType: { type: String, default: 'image/jpeg' },
      uploadedAt: { type: Date, default: Date.now }
    }],
    completedAt: { type: Date }
  },
  statusHistory: [{
    status: String,
    changedAt: { type: Date, default: Date.now },
    changedBy: String
  }]
}, {
  timestamps: true
});

// Auto-add status change to history
bookingSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system'
    });
  }
  next();
});

module.exports = mongoose.model('Booking', bookingSchema);
