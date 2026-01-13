import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ITransaction extends Document {
    userId: mongoose.Types.ObjectId;
    symbol: string;
    side: 'buy' | 'sell';
    shares: number;
    price: number;
    fee: number;
    totalAmount: number;
    orderType: '整股' | '零股';
    tradeType: '現股' | '融資' | '融券';
    condition: 'ROD' | 'IOC' | 'FOK';
    priceType: '限價' | '市價';
    timestamp: Date;
}

const transactionSchema = new Schema<ITransaction>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        symbol: {
            type: String,
            required: true,
        },
        side: {
            type: String,
            enum: ['buy', 'sell'],
            required: true,
        },
        shares: {
            type: Number,
            required: true,
            min: 1,
        },
        price: {
            type: Number,
            required: true,
            min: 0,
        },
        fee: {
            type: Number,
            required: true,
            min: 0,
        },
        totalAmount: {
            type: Number,
            required: true,
        },
        orderType: {
            type: String,
            enum: ['整股', '零股'],
            default: '整股',
        },
        tradeType: {
            type: String,
            enum: ['現股', '融資', '融券'],
            default: '現股',
        },
        condition: {
            type: String,
            enum: ['ROD', 'IOC', 'FOK'],
            default: 'ROD',
        },
        priceType: {
            type: String,
            enum: ['限價', '市價'],
            default: '限價',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    {
        collection: 'transactions',
    }
);

const Transaction: Model<ITransaction> = mongoose.models.Transaction || mongoose.model<ITransaction>('Transaction', transactionSchema);

export default Transaction;
