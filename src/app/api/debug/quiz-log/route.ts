import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuizLog from '@/models/QuizLog';

// GET /api/debug/quiz-log - 取得最新的 QuizLog 用於除錯
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId') || '507f1f77bcf86cd799439011';

        // 取得最新一筆紀錄
        const log = await QuizLog.findOne({ userId })
            .sort({ completedAt: -1 })
            .lean();

        if (!log) {
            return NextResponse.json({ success: false, error: '沒有找到紀錄' });
        }

        // 檢查有多少題有 explanation
        const questionsWithExplanation = log.questions.filter((q: { explanation?: string }) => q.explanation);

        return NextResponse.json({
            success: true,
            data: {
                _id: log._id,
                score: log.score,
                totalQuestions: log.totalQuestions,
                questionsCount: log.questions.length,
                questionsWithExplanationCount: questionsWithExplanation.length,
                sampleQuestion: log.questions[0],
                allQuestions: log.questions,
            },
        });
    } catch (error) {
        console.error('除錯查詢失敗:', error);
        return NextResponse.json({ success: false, error: String(error) });
    }
}
