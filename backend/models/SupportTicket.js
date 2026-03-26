const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['feature_request', 'bug_report', 'general', 'content_request'], default: 'general' },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'in_progress', 'resolved', 'closed'], default: 'open' },
  adminReply: { type: String, default: '' },
  repliedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  repliedAt: { type: Date, default: null },
  priority: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' }
}, { timestamps: true });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
