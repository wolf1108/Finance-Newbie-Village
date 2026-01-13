import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { name, email, message } = body;

        // Validate input
        if (!name || !email || !message) {
            return NextResponse.json(
                { message: 'All fields (name, email, message) are required' },
                { status: 400 }
            );
        }

        await connectDB();

        const newFeedback = await Feedback.create({
            name,
            email,
            message,
        });

        return NextResponse.json(
            { message: 'Feedback submitted successfully', data: newFeedback },
            { status: 201 }
        );
    } catch (error: any) {
        console.error('Error submitting feedback:', error);
        return NextResponse.json(
            { message: 'Internal Server Error', error: error.message },
            { status: 500 }
        );
    }
}
