const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

const userSchema = new mongoose.Schema({
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, select: false },
    role: { type: String, default: '村民' },
    points: { type: Number, default: 0 },
    simulatedBalance: { type: Number, default: 100000 },
}, { timestamps: true });

// Prevent overwrite error if model exists (rare in script but safe)
const User = mongoose.models.User || mongoose.model('User', userSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('連線到資料庫...');

        const email = 'teach@gmail.com';
        const username = '村長';
        const password = '123';

        // Remove existing if any
        await User.deleteOne({ email });
        await User.deleteOne({ username });

        console.log('正在創建村長帳號...');
        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            role: 'admin',
            points: 1000000,
            simulatedBalance: 10000000
        });

        console.log('村長帳號建立完成: teach@gmail.com / 123');
        process.exit(0);
    } catch (e) {
        console.error('建立失敗:', e);
        process.exit(1);
    }
}

seed();
