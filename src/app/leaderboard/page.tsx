import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import LeaderboardContent from './LeaderboardContent';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

// Ensure data is fresh
export const dynamic = 'force-dynamic';

export default async function LeaderboardPage() {
    await connectDB();

    // Fetch ALL users (or a large limit) to allow client-side sorting of both metrics
    // We fetch 'points' too now.
    const users = await User.find({}, 'username simulatedBalance points').lean();

    // Serializing ObjectId to string is safer for Client Componentsprops
    const serializedUsers = users.map((user: any) => ({
        _id: user._id.toString(),
        username: user.username,
        simulatedBalance: user.simulatedBalance || 0,
        points: user.points || 0
    }));

    // Get Current User ID from Cookie
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    let currentUserId: string | undefined = undefined;

    if (token) {
        try {
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
            const decoded = jwt.verify(token.value, JWT_SECRET) as any;
            currentUserId = decoded.userId;
        } catch (e) {
            // Invalid token
        }
    }

    return (
        <LeaderboardContent users={serializedUsers} currentUserId={currentUserId} />
    );
}
