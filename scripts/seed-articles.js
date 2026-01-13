const mongoose = require('mongoose');

const MONGODB_URI = 'mongodb://localhost:27017/finance-rookie-village';

const academyArticleSchema = new mongoose.Schema({
    topicName: { type: String, required: true },
    thumbnail: { type: String, default: '/uploads/default-thumbnail.jpg' },
    videoUrl: String,
    videoTranscript: String,
    videoDescription: String,
    content: { type: String, required: true },
    category: { type: String, required: true },
    isActive: { type: Boolean, default: true }
}, { timestamps: true });

const AcademyArticle = mongoose.models.AcademyArticle || mongoose.model('AcademyArticle', academyArticleSchema);

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('Connected to DB...');

        await AcademyArticle.deleteMany({});
        console.log('Cleared existing Articles.');

        const categories = ["股票基礎", "技術分析", "理財規劃", "ETF投資", "基金投資"];
        const articles = [];

        categories.forEach(cat => {
            for (let i = 1; i <= 3; i++) {
                articles.push({
                    topicName: `${cat} - 入門課程 ${i}`,
                    content: `這是關於 ${cat} 的第 ${i} 篇教學文章內容。`,
                    category: cat,
                    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
                });
            }
        });

        await AcademyArticle.insertMany(articles);
        console.log(`Seeded ${articles.length} articles successfully.`);
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

seed();
