import mongoose from 'mongoose';

const LeadSyncLog = new mongoose.Schema({
  source: { type: String, required: true, index: true },
  externalSourceId: { type: String, index: true },
  leadId: { type: mongoose.Schema.ObjectId, ref: 'Lead' },
  outcome: { type: String, enum: ['created', 'duplicate', 'failed'], required: true, index: true },
  error: String,
  receivedAt: { type: Date, default: Date.now, index: true },
}, { versionKey: false });

export default mongoose.model('LeadSyncLog', LeadSyncLog);
