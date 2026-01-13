import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import bcrypt from 'bcryptjs';

export async function POST(req: Request) {
    try {
        const { username, email, newPassword } = await req.json();

        if (!newPassword) {
            return NextResponse.json({ message: '請輸入新密碼' }, { status: 400 });
        }

        await connectDB();
        const user = await User.findOne({ username, email });

        if (!user) {
            return NextResponse.json({ message: '用戶驗證失敗' }, { status: 400 });
        }

        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        await user.save();

        return NextResponse.json({ message: '密碼重設成功' });
    } catch (error) {
        return NextResponse.json({ message: '重設失敗' }, { status: 500 });
    }
}
