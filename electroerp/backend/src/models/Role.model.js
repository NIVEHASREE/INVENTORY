import mongoose from 'mongoose';

const { Schema } = mongoose;

const PermissionSchema = new Schema({
    resource: { type: String, required: true },
    actions: [{ type: String, enum: ['create', 'read', 'update', 'delete', 'export'] }],
}, { _id: false });

const RoleSchema = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        enum: ['ADMIN', 'MANAGER', 'CASHIER', 'STAFF'],
    },
    permissions: [PermissionSchema],
    description: String,
    isDefault: { type: Boolean, default: false },
}, { timestamps: true });

const Role = mongoose.model('Role', RoleSchema);
export default Role;
