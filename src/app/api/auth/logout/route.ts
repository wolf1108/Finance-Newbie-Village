import { NextResponse } from 'next/server';
import { serialize } from 'cookie';

export async function POST() {
    const serialized = serialize('auth_token', '', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: -1,
        path: '/',
    });

    return NextResponse.json(
        { message: '已登出' },
        {
            status: 200,
            headers: { 'Set-Cookie': serialized }
        }
    );
}
