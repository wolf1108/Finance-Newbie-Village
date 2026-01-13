import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import QuizLog from '@/models/QuizLog';
import AcademyArticle from '@/models/AcademyArticle';
import { updateUserBalance } from '@/utils/updateUserBalance';
import generateQuizQuestions, { generateExplanations } from '@/lib/gemini';

// POST /api/academy/quiz - 開始測驗 (生成題目)
export async function POST(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { articleId } = body;

        if (!articleId) {
            return NextResponse.json(
                { success: false, error: '缺少文章 ID' },
                { status: 400 }
            );
        }

        // 取得文章資料
        const article = await AcademyArticle.findById(articleId);

        if (!article) {
            return NextResponse.json(
                { success: false, error: '找不到文章' },
                { status: 404 }
            );
        }

        // 使用 AI 生成題目
        const quizData = await generateQuizQuestions({
            videoTranscript: article.videoTranscript,
            videoDescription: article.videoDescription || article.content,
        });

        return NextResponse.json({
            success: true,
            data: {
                articleId: article._id,
                topicName: article.topicName,
                questions: quizData.questions,
            },
        });
    } catch (error) {
        console.error('生成測驗失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '生成測驗失敗';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}

// PUT /api/academy/quiz - 提交測驗結果
export async function PUT(request: NextRequest) {
    try {
        await connectDB();

        const body = await request.json();
        const { userId, articleId, questions, answers } = body;

        if (!userId || !articleId || !questions || !answers) {
            return NextResponse.json(
                { success: false, error: '缺少必要參數' },
                { status: 400 }
            );
        }

        // 計算得分並標記每題結果
        let score = 0;
        const wrongAnswers: { question: string; options: string[]; userAnswer: number; correctAnswer: number; index: number }[] = [];

        const questionsWithResults = questions.map((q: { question: string; options: string[]; correctAnswer: number }, index: number) => {
            const userAnswer = answers[index];
            const isCorrect = userAnswer === q.correctAnswer;
            if (isCorrect) {
                score++;
            } else {
                wrongAnswers.push({
                    question: q.question,
                    options: q.options,
                    userAnswer,
                    correctAnswer: q.correctAnswer,
                    index,
                });
            }

            return {
                question: q.question,
                options: q.options,
                correctAnswer: q.correctAnswer,
                userAnswer,
                isCorrect,
                explanation: undefined as string | undefined,
            };
        });

        // 為答錯的題目生成 AI 解析
        console.log('答錯題目數量:', wrongAnswers.length);
        if (wrongAnswers.length > 0) {
            try {
                console.log('開始生成 AI 解析...');
                const explanations = await generateExplanations(wrongAnswers);
                console.log('解析生成完成，數量:', explanations.length);
                wrongAnswers.forEach((wa, i) => {
                    if (questionsWithResults[wa.index]) {
                        questionsWithResults[wa.index].explanation = explanations[i];
                        console.log(`題目 ${wa.index + 1} 解析:`, explanations[i]?.substring(0, 50) + '...');
                    }
                });
            } catch (err) {
                console.error('生成解析失敗:', err);
                // 解析失敗不影響主流程，使用預設訊息
                wrongAnswers.forEach((wa) => {
                    if (questionsWithResults[wa.index]) {
                        questionsWithResults[wa.index].explanation = '抱歉，解析暫時無法取得。';
                    }
                });
            }
        }

        const totalQuestions = questions.length;

        // 更新使用者餘額 (模組接口)
        const balanceResult = await updateUserBalance(userId, score, totalQuestions);

        // 記錄測驗結果 (包含 AI 解析)
        const questionsForDB = questionsWithResults.map((q: { question: string; options: string[]; correctAnswer: number; userAnswer: number; isCorrect: boolean; explanation?: string }) => ({
            question: q.question,
            options: q.options,
            correctAnswer: q.correctAnswer,
            userAnswer: q.userAnswer,
            explanation: q.explanation,
        }));

        // 除錯：檢查儲存前的資料
        const withExplanation = questionsForDB.filter((q: { explanation?: string }) => q.explanation);
        console.log('準備儲存到 DB，有解析的題數:', withExplanation.length);
        if (withExplanation.length > 0) {
            console.log('第一題解析範例:', withExplanation[0].explanation?.substring(0, 100));
        }

        const quizLog = await QuizLog.create({
            userId,
            articleId,
            questions: questionsForDB,
            score,
            totalQuestions,
            pointsEarned: balanceResult.pointsEarned,
            balanceAdded: balanceResult.balanceAdded,
        });

        return NextResponse.json({
            success: true,
            data: {
                quizLogId: quizLog._id,
                score,
                totalQuestions,
                pointsEarned: balanceResult.pointsEarned,
                balanceAdded: balanceResult.balanceAdded,
                newBalance: balanceResult.user.simulatedBalance,
                newPoints: balanceResult.user.points,
                questionsWithResults,
            },
        });
    } catch (error) {
        console.error('提交測驗失敗:', error);
        const errorMessage = error instanceof Error ? error.message : '提交測驗失敗';
        return NextResponse.json(
            { success: false, error: errorMessage },
            { status: 500 }
        );
    }
}
