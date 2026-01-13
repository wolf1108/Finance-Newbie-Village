import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import QuizLog from '@/models/QuizLog';

export async function GET(request: NextRequest) {
    try {
        await connectDB();

        // 1. 總使用者數
        const totalUsers = await User.countDocuments({ role: { $ne: 'admin' } });

        // 2. 今日註冊人數
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayRegistrations = await User.countDocuments({
            role: { $ne: 'admin' },
            createdAt: { $gte: today }
        });

        // 3. 答題總數
        const totalQuizzes = await QuizLog.countDocuments();

        // 4. 今日答題總數
        const todayQuizzes = await QuizLog.countDocuments({
            completedAt: { $gte: today }
        });

        // 5. 過去 7 天每日新進使用者數 (折線圖資料)        
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const dailyRegistrations = await User.aggregate([
            {
                $match: {
                    role: { $ne: 'admin' },
                    createdAt: { $gte: sevenDaysAgo }
                }
            },
            {
                $group: {
                    _id: {
                        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" }
                    },
                    count: { $sum: 1 }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // 6. 各文章分類的測驗次數 (橫向長條圖資料)
        const categoryStats = await QuizLog.aggregate([
            {
                $lookup: {
                    from: 'academyarticles',
                    localField: 'articleId',
                    foreignField: '_id',
                    as: 'article'
                }
            },
            { $unwind: '$article' },
            {
                $group: {
                    _id: '$article.category',
                    count: { $sum: 1 }
                }
            },
            { $sort: { count: -1 } }
        ]);

        return NextResponse.json({
            cards: {
                totalUsers,
                todayRegistrations,
                totalQuizzes,
                todayQuizzes
            },
            charts: {
                dailyRegistrations: dailyRegistrations.map(item => ({
                    date: item._id,
                    count: item.count
                })),
                categoryStats: categoryStats.map(item => ({
                    category: item._id || '未分類',
                    count: item.count
                }))
            }
        });

    } catch (error) {
        console.error('Dashboard stats error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch dashboard statistics' },
            { status: 500 }
        );
    }
}
