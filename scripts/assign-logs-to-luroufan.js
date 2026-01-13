const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

async function assignLogs() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const QuizLog = mongoose.models.QuizLog || mongoose.model('QuizLog', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false }));

        let targetUser = await User.findOne({
            $or: [
                { username: /滷肉飯/ },
                { username: /Luroufan/i }
            ]
        });

        if (!targetUser) {
            console.log('Luroufan not found. Creating him...');
            // Create user "滷肉飯"
            targetUser = await User.create({
                username: '滷肉飯', // Luroufan
                email: 'luroufan@example.com',
                password: '123', // Dummy
                role: '村民',
                points: 100,
                simulatedBalance: 100000
            });
        }

        console.log(`Assigning all quiz logs to: ${targetUser.username} (${targetUser._id})`);

        const result = await QuizLog.updateMany({}, { userId: targetUser._id });
        console.log(`Updated ${result.modifiedCount} logs.`);

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

assignLogs();
