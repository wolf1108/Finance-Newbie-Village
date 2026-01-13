import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export async function POST(req: Request) {
    try {
        const { identifier, password } = await req.json();

        if (!identifier || !password) {
            return NextResponse.json({ message: '請填寫所有欄位' }, { status: 400 });
        }

        await connectDB();

        // Find by email or username
        const user = await User.findOne({
            $or: [{ email: identifier }, { username: identifier }]
        }).select('+password');

        if (!user) {
            return NextResponse.json({ message: '帳號或密碼錯誤' }, { status: 401 });
        }

        const isMatch = await bcrypt.compare(password, user.password || '');

        if (!isMatch) {
            return NextResponse.json({ message: '帳號或密碼錯誤' }, { status: 401 });
        }

        const token = jwt.sign(
            { userId: user._id, role: user.role, username: user.username },
            JWT_SECRET,
            { expiresIn: '7d' }
        );

        const serialized = serialize('auth_token', token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 60 * 60 * 24 * 7, // 7 days
            path: '/',
        });

        return NextResponse.json(
            {
                message: '登入成功',
                user: {
                    username: user.username,
                    email: user.email,
                    role: user.role,
                    points: user.points,
                    simulatedBalance: user.simulatedBalance
                }
            },
            {
                status: 200,
                headers: { 'Set-Cookie': serialized }
            }
        );

    } catch (error) {
        console.error('Login Error:', error);
        return NextResponse.json({ message: '登入失敗' }, { status: 500 });
    }
}
