import mongoose from 'mongoose';

const { Schema } = mongoose;

const ActivityLogSchema = new Schema({
    user: { type: Schema.Types.ObjectId, ref: 'User', index: true },
    userName: { type: String },
    action: { type: String, required: true },
    resource: { type: String },
    resourceId: { type: Schema.Types.ObjectId },
    details: { type: Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
}, { timestamps: true });

ActivityLogSchema.index({ createdAt: -1 });
ActivityLogSchema.index({ user: 1, createdAt: -1 });
ActivityLogSchema.index({ resource: 1, createdAt: -1 });

const ActivityLog = mongoose.model('ActivityLog', ActivityLogSchema);
export default ActivityLog;
