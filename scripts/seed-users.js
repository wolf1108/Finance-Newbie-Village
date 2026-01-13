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
    createdAt: { type: Date }, // Override default timestamp for seeding logic
    updatedAt: { type: Date },
}, { timestamps: true }); // Mongoose will still manage timestamps unless we explicitly override during create

const User = mongoose.models.User || mongoose.model('User', userSchema);

const firstNames = ['小', '阿', '大', '老', '金'];
const lastNames = ['強', '明', '華', '美', '寶', '龍', '虎', '珠', '財', '富'];

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('連線到資料庫...');

        const users = [];
        const start = new Date('2025-10-01');
        const end = new Date('2026-01-05');
        const defaultPassword = await bcrypt.hash('123', 10);

        for (let i = 0; i < 10; i++) {
            const username = `User_${Math.floor(Math.random() * 10000)}`;
            const email = `user${Math.floor(Math.random() * 100000)}@example.com`;
            const date = getRandomDate(start, end);

            // Randomize points and balance slightly
            const points = Math.floor(Math.random() * 1000); // 0-1000
            const simulatedBalance = 100000 + Math.floor(Math.random() * 50000) - 10000; // 90000 - 140000

            users.push({
                username,
                email,
                password: defaultPassword,
                role: '村民',
                points,
                simulatedBalance,
                createdAt: date,
                updatedAt: date
            });
        }

        // We use insertMany but Mongoose timestamps might overwrite createdAt if we are not careful.
        // However, passing createdAt usually overrides the default behavior for that doc.
        const result = await User.insertMany(users);
        console.log(`成功新增 ${result.length} 位村民！`);

        process.exit(0);
    } catch (e) {
        // If dup key error, just retry or ignore (simple script)
        console.error('建立失敗 (可能是重複的 username/email):', e.message);
        process.exit(1);
    }
}

seed();
