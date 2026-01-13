import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IUser extends Document {
    _id: mongoose.Types.ObjectId;
    username: string;
    email: string;
    password?: string;
    points: number;              // 全局積分 (與模擬區共享)
    simulatedBalance: number;    // 模擬資金
    role: string;
    aiAnalysis?: string;         // AI 學習分析
    createdAt: Date;
    updatedAt: Date;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        password: {
            type: String,
            select: false,
        },
        points: {
            type: Number,
            default: 0,
            min: 0,
        },
        simulatedBalance: {
            type: Number,
            default: 100000, // 初始 10 萬模擬資金
            min: 0,
        },
        role: {
            type: String,
            default: '村民',
        },
        aiAnalysis: {
            type: String,
            default: '',
        },
    },
    {
        timestamps: true,
        collection: 'users',
    }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>('User', userSchema);

export default User;
