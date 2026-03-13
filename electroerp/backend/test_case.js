import 'dotenv/config';
import mongoose from 'mongoose';
import User from './src/models/User.model.js';

const testCase = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        const emailLower = 'admin@electroerp.com';
        const emailUpper = 'Admin@electroerp.com';
        
        const user1 = await User.findOne({ email: emailLower });
        const user2 = await User.findOne({ email: emailUpper });
        
        console.log(`Lookup '${emailLower}': ${!!user1}`);
        console.log(`Lookup '${emailUpper}': ${!!user2}`);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
};

testCase();
