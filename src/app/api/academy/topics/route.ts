import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import AcademyArticle from '@/models/AcademyArticle';

import QuizLog from '@/models/QuizLog';

// GET /api/academy/topics - 取得所有主題 (含學習進度)
export async function GET(request: NextRequest) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const userId = searchParams.get('userId');

        // 1. 取得所有啟用主題
        const topics = await AcademyArticle.find({ isActive: true })
            .select('topicName thumbnail category videoUrl createdAt')
            .sort({ createdAt: -1 })
            .lean();

        // 2. 如果有 userId，查詢學習進度
        let progressMap = new Map<string, { bestScore: number; quizCount: number; lastQuizAt: Date }>();

        if (userId) {
            const logs = await QuizLog.find({ userId })
                .select('articleId score totalQuestions completedAt')
                .lean();

            logs.forEach(log => {
                const articleId = log.articleId.toString();
                const current = progressMap.get(articleId);

                // 計算得分百分比 (整數 0-100)
                const scorePercent = Math.round((log.score / log.totalQuestions) * 100);

                if (!current) {
                    progressMap.set(articleId, {
                        bestScore: scorePercent,
                        quizCount: 1,
                        lastQuizAt: log.completedAt
                    });
                } else {
                    progressMap.set(articleId, {
                        bestScore: Math.max(current.bestScore, scorePercent),
                        quizCount: current.quizCount + 1,
                        lastQuizAt: log.completedAt > current.lastQuizAt ? log.completedAt : current.lastQuizAt
                    });
                }
            });
        }

        // 3. 合併資料
        const topicsWithProgress = topics.map(topic => {
            const progress = progressMap.get(topic._id.toString());
            return {
                ...topic,
                progress: progress || null
            };
        });

        return NextResponse.json({
            success: true,
            data: topicsWithProgress,
        });
    } catch (error) {
        console.error('取得主題失敗:', error);
        return NextResponse.json(
            { success: false, error: '取得主題失敗' },
            { status: 500 }
        );
    }
}

// POST /api/academy/topics - 新增主題
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { topicName, thumbnail, videoUrl, videoTranscript, videoDescription, content, category } = body;

        if (!topicName || !content || !category) {
            return NextResponse.json(
                { success: false, error: '缺少必要欄位' },
                { status: 400 }
            );
        }

        const topic = await AcademyArticle.create({
            topicName,
            thumbnail: thumbnail || '/uploads/default-thumbnail.jpg',
            videoUrl,
            videoTranscript,
            videoDescription,
            content,
            category,
        });

        return NextResponse.json({
            success: true,
            data: topic,
        }, { status: 201 });
    } catch (error) {
        console.error('新增主題失敗:', error);
        return NextResponse.json(
            { success: false, error: '新增主題失敗' },
            { status: 500 }
        );
    }
}
