import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export async function GET() {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ message: '未登入' }, { status: 401 });
        }

        const decoded = jwt.verify(token.value, JWT_SECRET) as any;

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ message: '用戶不存在' }, { status: 404 });
        }

        return NextResponse.json({
            user: {
                username: user.username,
                email: user.email,
                role: user.role,
                points: user.points,
                simulatedBalance: user.simulatedBalance
            }
        });

    } catch (error) {
        return NextResponse.json({ message: '無效的 Token' }, { status: 401 });
    }
}
