import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuizLog from '@/models/QuizLog';
import AcademyArticle from '@/models/AcademyArticle';

// GET /api/academy/history - 取得使用者的歷史作答紀錄
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json(
                { success: false, error: '缺少使用者 ID' },
                { status: 400 }
            );
        }

        // 取得所有作答紀錄，按時間降序排列
        const logs = await QuizLog.find({ userId })
            .sort({ completedAt: -1 })
            .lean();

        // 取得相關文章資訊
        const articleIds = [...new Set(logs.map(log => log.articleId.toString()))];
        const articles = await AcademyArticle.find({ _id: { $in: articleIds } })
            .select('topicName thumbnailUrl')
            .lean();

        const articleMap = new Map(
            articles.map(a => [a._id.toString(), a])
        );

        // 組合資料
        const history = logs.map(log => {
            const article = articleMap.get(log.articleId.toString());
            return {
                _id: log._id,
                articleId: log.articleId,
                topicName: article?.topicName || '未知課程',
                thumbnailUrl: article?.thumbnail || '',
                score: log.score,
                totalQuestions: log.totalQuestions,
                pointsEarned: log.pointsEarned,
                balanceAdded: log.balanceAdded,
                completedAt: log.completedAt,
                questions: log.questions,
            };
        });

        return NextResponse.json({
            success: true,
            data: history,
        });
    } catch (error) {
        console.error('取得歷史紀錄失敗:', error);
        return NextResponse.json(
            { success: false, error: '取得歷史紀錄失敗' },
            { status: 500 }
        );
    }
}
