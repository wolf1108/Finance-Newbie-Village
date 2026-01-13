import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function POST(req: Request) {
    try {
        const { username, email } = await req.json();

        await connectDB();
        // Case insensitive Check likely better for email, but let's stick to exact match or what logic we had.
        // Login used: $or: [{ email: identifier }, { username: identifier }]
        // Here we need BOTH to match specific user.

        const user = await User.findOne({
            username,
            email
        });

        if (user) {
            return NextResponse.json({ valid: true });
        } else {
            return NextResponse.json({ message: '找不到符合的帳號資料' }, { status: 400 });
        }
    } catch (error) {
        return NextResponse.json({ message: '驗證失敗' }, { status: 500 });
    }
}
