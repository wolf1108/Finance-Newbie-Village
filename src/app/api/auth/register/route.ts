import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { username, email, password, confirmPassword } = await req.json();

        if (!username || !email || !password || !confirmPassword) {
            return NextResponse.json({ message: '請填寫所有欄位' }, { status: 400 });
        }

        if (password !== confirmPassword) {
            return NextResponse.json({ message: '密碼不一致' }, { status: 400 });
        }

        await connectDB();

        const existingUser = await User.findOne({
            $or: [{ email }, { username }]
        });

        if (existingUser) {
            return NextResponse.json({ message: '信箱或暱稱已被註冊' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        await User.create({
            username,
            email,
            password: hashedPassword,
            role: '村民',
        });

        return NextResponse.json({ message: '註冊成功' }, { status: 201 });

    } catch (error: any) {
        console.error('Registration Error:', error);
        return NextResponse.json({ message: error.message || '註冊失敗' }, { status: 500 });
    }
}
