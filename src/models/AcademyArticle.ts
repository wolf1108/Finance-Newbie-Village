import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAcademyArticle extends Document {
    _id: mongoose.Types.ObjectId;
    topicName: string;           // 主題名稱
    thumbnail: string;           // 縮圖路徑
    videoUrl?: string;           // 影片連結
    videoTranscript?: string;    // 影片字幕
    videoDescription?: string;   // 影片描述
    content: string;             // 文章內容
    category: string;            // 分類
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

const academyArticleSchema = new Schema<IAcademyArticle>(
    {
        topicName: {
            type: String,
            required: true,
            trim: true,
        },
        thumbnail: {
            type: String,
            default: '/uploads/default-thumbnail.jpg',
        },
        videoUrl: {
            type: String,
            trim: true,
        },
        videoTranscript: {
            type: String,
        },
        videoDescription: {
            type: String,
        },
        content: {
            type: String,
            required: true,
        },
        category: {
            type: String,
            required: true,
            trim: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        collection: 'academy_articles',
    }
);

// 建立索引
academyArticleSchema.index({ category: 1 });
academyArticleSchema.index({ isActive: 1 });

const AcademyArticle: Model<IAcademyArticle> =
    mongoose.models.AcademyArticle || mongoose.model<IAcademyArticle>('AcademyArticle', academyArticleSchema);

export default AcademyArticle;
