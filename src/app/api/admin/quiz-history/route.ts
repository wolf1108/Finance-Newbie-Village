import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import QuizLog from '@/models/QuizLog';
import User from '@/models/User';
import AcademyArticle from '@/models/AcademyArticle'; // Ensure model is registered

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export async function GET() {
    try {
        await connectDB();

        // Ensure models are registered to avoid populate errors
        // (User and AcademyArticle imports enforce registration)

        // Check Auth
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
        }

        let isAdmin = false;
        try {
            const decoded = jwt.verify(token.value, JWT_SECRET) as any;
            isAdmin = decoded.role === 'admin';
        } catch (e) {
            return NextResponse.json({ message: 'Invalid token' }, { status: 401 });
        }

        if (!isAdmin) {
            return NextResponse.json({ message: 'Forbidden' }, { status: 403 });
        }

        const logs = await QuizLog.find({})
            .populate('userId', 'username email')
            .populate('articleId', 'topicName category')
            .sort({ completedAt: -1 })
            .lean();

        return NextResponse.json(logs);
    } catch (error: any) {
        console.error('Quiz History API Error:', error);
        return NextResponse.json({ message: error.message }, { status: 500 });
    }
}
