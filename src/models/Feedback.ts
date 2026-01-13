import mongoose, { Schema, Model } from 'mongoose';

export interface IFeedback {
    name: string;
    email: string;
    message: string;
    status: 'pending' | 'processed';
    createdAt: Date;
}

const FeedbackSchema = new Schema<IFeedback>({
    name: {
        type: String,
        required: [true, 'Please provide your name'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Please provide your email'],
        trim: true,
        lowercase: true,
    },
    message: {
        type: String,
        required: [true, 'Please provide your message'],
        trim: true,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    status: {
        type: String,
        enum: ['pending', 'processed'],
        default: 'pending',
    },
});

const Feedback: Model<IFeedback> = mongoose.models.Feedback || mongoose.model<IFeedback>('Feedback', FeedbackSchema);

export default Feedback;
