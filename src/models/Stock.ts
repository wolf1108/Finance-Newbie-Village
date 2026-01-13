import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IStock extends Document {
    symbol: string;         // 代號 (如 2330.TW)
    name: string;           // 名稱 (如 台積電)
    currentPrice: number;   // 現價
    change: number;         // 漲跌
    changePercent: number;  // 漲跌幅
    lastUpdated: Date;      // 上次更新時間
}

const stockSchema = new Schema<IStock>(
    {
        symbol: {
            type: String,
            required: true,
            unique: true,
            index: true,
            trim: true,
        },
        name: {
            type: String,
            required: true,
        },
        currentPrice: {
            type: Number,
            required: true,
        },
        change: {
            type: Number,
            default: 0,
        },
        changePercent: {
            type: Number,
            default: 0,
        },
        lastUpdated: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
        collection: 'stocks',
    }
);

const Stock: Model<IStock> = mongoose.models.Stock || mongoose.model<IStock>('Stock', stockSchema);

export default Stock;
