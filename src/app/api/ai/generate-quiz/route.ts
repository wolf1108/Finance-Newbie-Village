import { NextRequest, NextResponse } from 'next/server';
import generateQuizQuestions from '@/lib/gemini';

// POST /api/ai/generate-quiz - 使用 AI 生成測驗題目
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { videoTranscript, videoDescription, numQuestions } = body;

        if (!videoTranscript && !videoDescription) {
            return NextResponse.json(
                { success: false, error: '必須提供 videoTranscript 或 videoDescription' },
                { status: 400 }
            );
        }

        const result = await generateQuizQuestions({
            videoTranscript,
            videoDescription,
            numQuestions: numQuestions || 5,
        });

        return NextResponse.json({
            success: true,
            data: result,
        });
    } catch (error) {
        console.error('生成測驗題目失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '生成測驗題目失敗';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
