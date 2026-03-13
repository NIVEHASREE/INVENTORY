import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';
import Role from './src/models/Role.model.js';

const checkUsers = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const users = await User.find({}).populate('role');
        console.log('Current Users in Database:');
        users.forEach(u => {
            console.log(`- Name: ${u.name}, Email: ${u.email}, Active: ${u.isActive}, Role: ${u.role ? u.role.name : 'N/A'}`);
        });
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

checkUsers();
