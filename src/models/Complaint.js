const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  tenantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, enum: ['Maintenance', 'Cleanliness', 'Noise', 'Security', 'Food', 'Other'], required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed'], default: 'Open' },
  priority: { type: String, enum: ['Low', 'Medium', 'High', 'Urgent'], default: 'Medium' },
  adminNote: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Complaint', complaintSchema);
