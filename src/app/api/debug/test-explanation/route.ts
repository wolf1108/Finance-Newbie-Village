import { NextResponse } from 'next/server';
import { generateExplanations } from '@/lib/gemini';

// GET /api/debug/test-explanation - 測試 AI 解析生成功能
export async function GET() {
    try {
        // 模擬一個答錯的題目
        const testWrongAnswer = {
            question: '在金融投資中，所謂的「複利」效應是指什麼？',
            options: [
                '僅根據原始投入的本金計算利息',
                '利息不再投入，每年提取現金',
                '將產生的利息併入本金，繼續產生新的利息',
                '銀行收取的帳戶管理費',
            ],
            userAnswer: 0,
            correctAnswer: 2,
        };

        console.log('開始測試 generateExplanations...');
        const explanations = await generateExplanations([testWrongAnswer]);
        console.log('測試完成，結果:', explanations);

        return NextResponse.json({
            success: true,
            data: {
                explanations,
                explanationLength: explanations.length,
                firstExplanation: explanations[0],
            },
        });
    } catch (error) {
        console.error('測試失敗:', error);
        return NextResponse.json({
            success: false,
            error: String(error),
            stack: error instanceof Error ? error.stack : undefined,
        });
    }
}
