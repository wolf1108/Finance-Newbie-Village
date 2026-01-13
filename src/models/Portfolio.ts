import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPortfolio extends Document {
    userId: mongoose.Types.ObjectId;
    symbol: string;
    shares: number;         // 持有股數
    avgCost: number;        // 平均成本
}

const portfolioSchema = new Schema<IPortfolio>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
            index: true,
        },
        symbol: {
            type: String,
            required: true,
            index: true,
        },
        shares: {
            type: Number,
            required: true,
            min: 0,
        },
        avgCost: {
            type: Number,
            required: true,
            min: 0,
        },
    },
    {
        timestamps: true,
        collection: 'portfolios',
    }
);

// 複合索引: 同一個使用者對同一支股票只能有一筆 Portfolio 紀錄
portfolioSchema.index({ userId: 1, symbol: 1 }, { unique: true });

const Portfolio: Model<IPortfolio> = mongoose.models.Portfolio || mongoose.model<IPortfolio>('Portfolio', portfolioSchema);

export default Portfolio;
