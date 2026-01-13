const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

async function distributeLogsToVillagers() {
    try {
        await mongoose.connect(MONGODB_URI);
        const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false }));
        const QuizLog = mongoose.models.QuizLog || mongoose.model('QuizLog', new mongoose.Schema({ userId: mongoose.Schema.Types.ObjectId }, { strict: false }));

        // 1. 找出所有「真實村民」 (排除 admin 和 模擬使用者)
        const realVillagers = await User.find({
            role: { $ne: 'admin' },
            username: { $ne: '模擬使用者' }
        });

        if (realVillagers.length === 0) {
            console.log('找不到真實村民，無法分配。');
            process.exit(1);
        }

        console.log(`找到 ${realVillagers.length} 位真實村民，準備分配答題紀錄...`);

        // 2. 找出所有答題紀錄
        const logs = await QuizLog.find({});
        console.log(`共有 ${logs.length} 筆答題紀錄。`);

        // 3. 隨機分配
        let updatedCount = 0;
        for (const log of logs) {
            // 隨機選一位村民
            const randomVillager = realVillagers[Math.floor(Math.random() * realVillagers.length)];

            // 更新該筆紀錄的 userId
            log.userId = randomVillager._id;
            await log.save();
            updatedCount++;
        }

        console.log(`成功更新 ${updatedCount} 筆紀錄，現在答題人已隨機分佈於真實村民中。`);

        // 特別保留幾筆給 "滷肉飯" (如果他在名單內)
        const luroufan = realVillagers.find(u => u.username.includes('滷肉飯') || u.username.toLowerCase().includes('luroufan'));
        if (luroufan) {
            console.log(`特別指定最近 5 筆紀錄給「${luroufan.username}」...`);
            const recentLogs = await QuizLog.find().sort({ completedAt: -1 }).limit(5);
            for (const log of recentLogs) {
                log.userId = luroufan._id;
                await log.save();
            }
        }

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

distributeLogsToVillagers();
