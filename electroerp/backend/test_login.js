import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';
import bcrypt from 'bcryptjs';

const testLogin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@electroerp.com';
        const password = 'Admin@123';
        
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            console.log('User not found');
            process.exit(0);
        }
        
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`Password match with 'Admin@123': ${isMatch}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testLogin();
