import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Feedback from '@/models/Feedback';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

async function isAdmin() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    if (!token) return false;
    try {
        const decoded = jwt.verify(token.value, JWT_SECRET) as any;
        return decoded.role === 'admin';
    } catch {
        return false;
    }
}

export async function GET() {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    await connectDB();
    const feedbacks = await Feedback.find({}).sort({ createdAt: -1 });
    return NextResponse.json(feedbacks);
}
