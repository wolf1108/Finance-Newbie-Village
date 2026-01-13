const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

const quizLogSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: 'AcademyArticle', required: true },
    questions: [{
        question: String,
        options: [String],
        correctAnswer: Number,
        userAnswer: Number,
        explanation: String
    }],
    score: Number,
    totalQuestions: Number,
    pointsEarned: Number,
    balanceAdded: Number,
    completedAt: Date
}, { timestamps: true });

const QuizLog = mongoose.models.QuizLog || mongoose.model('QuizLog', quizLogSchema);
const User = mongoose.models.User || mongoose.model('User', new mongoose.Schema({}, { strict: false })); // minimal schema
const AcademyArticle = mongoose.models.AcademyArticle || mongoose.model('AcademyArticle', new mongoose.Schema({}, { strict: false }));

const getRandomDate = (start, end) => {
    return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
};

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB...');

        // Fetch Users and Articles
        const users = await User.find({ role: { $ne: 'admin' } }); // Exclude admin if wanted, or include all
        const articles = await AcademyArticle.find({});

        if (users.length === 0 || articles.length === 0) {
            console.error('No users or articles found. Please seed them first.');
            process.exit(1);
        }

        console.log(`Found ${users.length} users and ${articles.length} articles.`);

        // Clear existing logs
        await QuizLog.deleteMany({});
        console.log('Cleared existing Quiz Logs.');

        const logs = [];
        const start = new Date('2025-10-01');
        const end = new Date('2026-01-08');

        // Generate 50 random logs
        for (let i = 0; i < 50; i++) {
            const user = users[Math.floor(Math.random() * users.length)];
            const article = articles[Math.floor(Math.random() * articles.length)];

            // Mock questions
            const questions = [
                {
                    question: "測試題目 - 關於 " + article.topicName,
                    options: ["選項A", "選項B", "選項C", "選項D"],
                    correctAnswer: 0,
                    userAnswer: Math.floor(Math.random() * 4), // Random answer
                    explanation: "這是AI的解析說明。"
                },
                {
                    question: "測試題目2 - 深入 " + article.topicName,
                    options: ["因為...", "所以...", "但是...", "而且..."],
                    correctAnswer: 1,
                    userAnswer: Math.floor(Math.random() * 4),
                    explanation: "這是第二題的解析。"
                },
                {
                    question: "測試題目3",
                    options: ["A", "B", "C", "D"],
                    correctAnswer: 2,
                    userAnswer: Math.floor(Math.random() * 4),
                    explanation: "解析..."
                },
                {
                    question: "測試題目4",
                    options: ["1", "2", "3", "4"],
                    correctAnswer: 3,
                    userAnswer: Math.floor(Math.random() * 4),
                    explanation: "解析..."
                },
                {
                    question: "測試題目5",
                    options: ["Yes", "No", "Maybe", "Unsure"],
                    correctAnswer: 0,
                    userAnswer: Math.floor(Math.random() * 4),
                    explanation: "解析..."
                }
            ];

            let correctCount = 0;
            questions.forEach(q => {
                if (q.userAnswer === q.correctAnswer) correctCount++;
            });

            const date = getRandomDate(start, end);

            logs.push({
                userId: user._id,
                articleId: article._id,
                questions: questions,
                score: correctCount,
                totalQuestions: 5,
                pointsEarned: correctCount * 10,
                balanceAdded: 0,
                completedAt: date
            });
        }

        await QuizLog.insertMany(logs);
        console.log(`Seeded ${logs.length} quiz logs successfully.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
