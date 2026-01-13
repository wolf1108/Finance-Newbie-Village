import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export async function PUT(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ error: '未登入' }, { status: 401 });
        }

        const decoded = jwt.verify(token.value, JWT_SECRET) as any;
        const body = await request.json();
        const { username, email, currentPassword, newPassword } = body;

        await connectDB();
        const user = await User.findById(decoded.userId);

        if (!user) {
            return NextResponse.json({ error: '用戶不存在' }, { status: 404 });
        }

        // 檢查 email 是否已被其他人使用
        if (email !== user.email) {
            const existingUser = await User.findOne({ email });
            if (existingUser) {
                return NextResponse.json({ error: '此信箱已被使用' }, { status: 400 });
            }
        }

        // 更新基本資料
        user.username = username;
        user.email = email;

        // 如果要修改密碼
        if (newPassword) {
            if (!currentPassword) {
                return NextResponse.json({ error: '請輸入目前密碼' }, { status: 400 });
            }

            // 驗證目前密碼
            if (!user.password) {
                return NextResponse.json({ error: '無法驗證密碼' }, { status: 500 });
            }

            const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
            if (!isPasswordValid) {
                return NextResponse.json({ error: '目前密碼錯誤' }, { status: 400 });
            }


            // 加密新密碼
            user.password = await bcrypt.hash(newPassword, 10);
        }

        await user.save();

        return NextResponse.json({
            message: '資料更新成功',
            user: {
                username: user.username,
                email: user.email
            }
        });

    } catch (error) {
        console.error('Profile update error:', error);
        return NextResponse.json({ error: '更新失敗' }, { status: 500 });
    }
}
