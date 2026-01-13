import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';

export async function GET() {
    try {
        await connectDB();

        const fakeUsers = [];
        const baseNames = ['John', 'Jane', 'Alex', 'Chris', 'Sam', 'Tom', 'Jerry', 'Alice', 'Bob', 'Eve'];
        const domains = ['gmail.com', 'yahoo.com', 'outlook.com'];

        for (let i = 0; i < 10; i++) {
            const randomName = baseNames[Math.floor(Math.random() * baseNames.length)];
            const suffix = Math.floor(Math.random() * 10000);
            const username = `${randomName}${suffix}`;
            const email = `${username.toLowerCase()}@${domains[Math.floor(Math.random() * domains.length)]}`;

            fakeUsers.push({
                username,
                email,
                password: 'password123', // Placeholder plain text for mock data
                points: Math.floor(Math.random() * 1000),
                simulatedBalance: Math.floor(Math.random() * 500000) + 100000, // 100k to 600k
                role: 'user'
            });
        }

        // Use insertMany to add them all at once (skipping validaton/hooks if needed, but here simple create is fine)
        // We'll use create to ensure defaults and types are checked roughly.
        // However, insertMany is efficient.

        // Check if they exist first to avoid checking uniqueness on limited random pool? 
        // MongoDB duplicate key error might happen if we get super unlucky, but with 10000 suffix it's rare.
        // Just try catch or insert one by one. InsertMany is transaction-like.

        const result = await User.insertMany(fakeUsers, { ordered: false });

        return NextResponse.json({
            message: `Successfully created ${result.length} fake users.`,
            data: result
        });

    } catch (error: any) {
        console.error('Seed Error:', error);
        return NextResponse.json(
            { error: 'Failed to seed users', details: error.message },
            { status: 500 }
        );
    }
}
