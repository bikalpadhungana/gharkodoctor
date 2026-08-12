const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema({
  action: {
    type: String,
    required: true,
    index: true
  },
  performedBy: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Admin' },
    name: { type: String, default: 'System' },
    role: { type: String, default: 'admin' }
  },
  target: {
    type: { type: String, default: '' },
    id: { type: String, default: '' },
    label: { type: String, default: '' }
  },
  details: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  ipAddress: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('AuditLog', auditLogSchema);
