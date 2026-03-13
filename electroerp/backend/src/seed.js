/**
 * Seed script — run once to bootstrap the database
 * Usage: node src/seed.js
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import Role from './models/Role.model.js';
import User from './models/User.model.js';
import Category from './models/Category.model.js';
import logger from './config/logger.js';

const roles = [
    {
        name: 'ADMIN',
        description: 'Full access to all modules',
        permissions: [
            'products', 'categories', 'suppliers', 'purchases',
            'bills', 'gst', 'reports', 'users', 'notifications', 'audit-logs',
        ].map(r => ({ resource: r, actions: ['create', 'read', 'update', 'delete', 'export'] })),
    },
    {
        name: 'MANAGER',
        description: 'Manage inventory, billing, suppliers',
        permissions: [
            { resource: 'products', actions: ['create', 'read', 'update'] },
            { resource: 'categories', actions: ['create', 'read', 'update'] },
            { resource: 'suppliers', actions: ['create', 'read', 'update'] },
            { resource: 'purchases', actions: ['create', 'read'] },
            { resource: 'bills', actions: ['create', 'read', 'update'] },
            { resource: 'gst', actions: ['read'] },
            { resource: 'reports', actions: ['read', 'export'] },
        ],
    },
    {
        name: 'CASHIER',
        description: 'Create bills and view products',
        permissions: [
            { resource: 'products', actions: ['read'] },
            { resource: 'bills', actions: ['create', 'read'] },
        ],
    },
    {
        name: 'STAFF',
        description: 'Inventory management and maintenance',
        permissions: [
            { resource: 'products', actions: ['create', 'read', 'update', 'delete'] },
            { resource: 'categories', actions: ['read'] },
        ],
    },
];

const categories = [
    'Wires & Cables', 'Switches & Sockets', 'Fans & Ventilation',
    'Lighting & LEDs', 'Circuit Breakers & Panels', 'Conduits & Pipes',
    'Meters & Testers', 'Batteries & UPS', 'MCBs & ELCBs', 'Others',
];

const seedDB = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        logger.info('Connected to MongoDB for seeding...');

        // Clear existing
        await Role.deleteMany({});
        await Category.deleteMany({});

        // Create roles
        const createdRoles = await Role.insertMany(roles);
        logger.info(`✅ ${createdRoles.length} roles created`);

        // Create categories
        await Category.insertMany(categories.map(name => ({ name })));
        logger.info(`✅ ${categories.length} categories created`);

        // Check if admin already exists
        const adminRole = createdRoles.find(r => r.name === 'ADMIN');
        const existingAdmin = await User.findOne({ email: 'admin@electroerp.com' });

        if (!existingAdmin) {
            await User.create({
                name: 'Super Admin',
                email: 'admin@electroerp.com',
                password: 'Admin@123',
                role: adminRole._id,
                phone: '+91-9876543210',
            });
            logger.info('✅ Admin user created: admin@electroerp.com / Admin@123');
        } else {
            logger.info('ℹ️  Admin user already exists');
        }

        logger.info('🌱 Database seeded successfully!');
        process.exit(0);
    } catch (err) {
        logger.error('Seed failed:', err);
        process.exit(1);
    }
};

seedDB();
