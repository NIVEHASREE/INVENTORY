import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';

const resetAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const email = 'admin@electroerp.com';
        const user = await User.findOne({ email });
        
        if (!user) {
            console.log(`User ${email} NOT found.`);
            process.exit(1);
        }
        
        user.password = 'Admin@123';
        user.isActive = true;
        await user.save();
        
        console.log(`Successfully reset password for ${email} to 'Admin@123' and ensured isActive: true`);
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

resetAdmin();
