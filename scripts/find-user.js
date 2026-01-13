const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

async function findUser() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));

        const user = await User.findOne({
            $or: [
                { username: /滷肉飯/ },
                { username: /Luroufan/i }
            ]
        });

        if (user) {
            console.log('Found Luroufan:', user);
        } else {
            console.log('Luroufan not found.');
        }

        // Check for "模擬使用者"
        const simUsers = await User.find({ username: '模擬使用者' });
        console.log(`Found ${simUsers.length} users named "模擬使用者".`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

findUser();
