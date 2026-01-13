import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IQuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;   // 正確答案索引 (0-3)
    userAnswer?: number;     // 使用者答案索引
    explanation?: string;    // AI 解析 (答錯時)
}

export interface IQuizLog extends Document {
    _id: mongoose.Types.ObjectId;
    userId: mongoose.Types.ObjectId;      // 使用者 ID
    articleId: mongoose.Types.ObjectId;   // 文章 ID
    questions: IQuizQuestion[];
    score: number;                        // 得分 (答對題數)
    totalQuestions: number;               // 總題數
    pointsEarned: number;                 // 獲得積分
    balanceAdded: number;                 // 增加的模擬資金
    completedAt: Date;
}

const quizQuestionSchema = new Schema<IQuizQuestion>(
    {
        question: {
            type: String,
            required: true,
        },
        options: {
            type: [String],
            required: true,
            validate: {
                validator: (v: string[]) => v.length === 4,
                message: '必須有 4 個選項',
            },
        },
        correctAnswer: {
            type: Number,
            required: true,
            min: 0,
            max: 3,
        },
        userAnswer: {
            type: Number,
            min: 0,
            max: 3,
        },
        explanation: {
            type: String,
        },
    },
    { _id: false }
);

const quizLogSchema = new Schema<IQuizLog>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        articleId: {
            type: Schema.Types.ObjectId,
            ref: 'AcademyArticle',
            required: true,
        },
        questions: {
            type: [quizQuestionSchema],
            required: true,
        },
        score: {
            type: Number,
            required: true,
            min: 0,
        },
        totalQuestions: {
            type: Number,
            required: true,
            min: 1,
        },
        pointsEarned: {
            type: Number,
            required: true,
            default: 0,
        },
        balanceAdded: {
            type: Number,
            required: true,
            default: 0,
        },
        completedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'quiz_logs',
    }
);

// 建立索引
quizLogSchema.index({ userId: 1 });
quizLogSchema.index({ articleId: 1 });
quizLogSchema.index({ completedAt: -1 });

const QuizLog: Model<IQuizLog> =
    mongoose.models.QuizLog || mongoose.model<IQuizLog>('QuizLog', quizLogSchema);

export default QuizLog;
