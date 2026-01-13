const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

const feedbackSchema = new mongoose.Schema({
    name: String,
    email: String,
    message: String,
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending',
    },
    createdAt: Date,
});

const Feedback = mongoose.models.Feedback || mongoose.model('Feedback', feedbackSchema);

const names = ['小明', '阿華', '美美', 'Jason', 'Kevin', 'Alice', '股神', '韭菜一號', '新手小白', '大戶'];
const messages = [
    '請問模擬股市的報價是即時的嗎？',
    '介面操作很流暢，希望能出 App 版本！',
    '希望能增加更多 ETF 的教學課程。',
    '村長好，我想請問技術分析的課程什麼時候會更新？',
    '註冊的時候一直收不到驗證碼（但也許是我信箱問題）。',
    '字體可以再大一點嗎？老花眼看不清楚。',
    '模擬交易的本金可以重設嗎？我輸光了...',
    '排行榜的更新頻率是多久一次？',
    '希望能有暗黑模式（Dark Mode）。',
    '這裡的學習資源真的很豐富，謝謝村長！',
    '請問有推薦的新手書單嗎？',
    '網站偶爾會有點卡頓，麻煩檢查一下伺服器。',
    '可以增加討論區功能嗎？想跟其他村民交流。',
    '小幫手 AI 回答得很有趣！',
    '祝理財新手村越來越好！'
];

function getRandomDate(start, end) {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('連線到資料庫...');

        const feedbacks = [];
        const start = new Date('2025-10-01');
        const end = new Date('2026-01-08');

        for (let i = 0; i < 30; i++) {
            const name = names[Math.floor(Math.random() * names.length)];
            const message = messages[Math.floor(Math.random() * messages.length)];
            const status = Math.random() > 0.5 ? 'processed' : 'pending';
            const createdAt = getRandomDate(start, end);

            feedbacks.push({
                name: name,
                email: `${i}${Math.floor(Math.random() * 1000)}@example.com`,
                message: message,
                status: status,
                createdAt: createdAt
            });
        }

        await Feedback.insertMany(feedbacks);
        console.log(`成功新增 ${feedbacks.length} 筆意見回饋資料！`);

        process.exit(0);
    } catch (e) {
        console.error('建立失敗:', e);
        process.exit(1);
    }
}

seed();
