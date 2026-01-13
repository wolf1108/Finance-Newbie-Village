const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

async function listUsers() {
    try {
        await mongoose.connect(MONGODB_URI);

        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const users = await User.find({});
        console.log('--- Users List ---');
        users.forEach(u => {
            console.log(`ID: ${u._id}, Username: ${u.username}, Role: ${u.role}`);
        });
        console.log('------------------');

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listUsers();
