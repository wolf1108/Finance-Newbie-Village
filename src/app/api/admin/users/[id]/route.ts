import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { id } = await params;
        const body = await req.json();
        const { username, email, password, role, points, simulatedBalance } = body;

        await connectDB();

        const updateData: any = {
            username,
            email,
            role,
            points,
            simulatedBalance
        };

        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }

        const updatedUser = await User.findByIdAndUpdate(id, updateData, { new: true });

        return NextResponse.json(updatedUser);
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
    if (!(await isAdmin())) {
        return NextResponse.json({ message: 'Unauthorized' }, { status: 403 });
    }
    try {
        const { id } = await params;
        await connectDB();
        await User.findByIdAndDelete(id);
        return NextResponse.json({ message: 'User deleted' });
    } catch (err: any) {
        return NextResponse.json({ message: err.message }, { status: 400 });
    }
}
