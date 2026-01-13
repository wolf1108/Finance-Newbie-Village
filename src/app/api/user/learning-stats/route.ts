import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import QuizLog from '@/models/QuizLog';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;

async function generateAIAnalysis(learningData: string): Promise<string> {
    if (!GEMINI_API_KEY) {
        return learningData.includes('尚未完成任何測驗')
            ? '歡迎來到理財新手村！這裡沒有壓力，只有陪伴。建議你可以先從「股票基礎」開始，了解基本概念後再慢慢探索其他主題。記得，學習不用急，一步一步來就好。'
            : '你已經開始學習了！繼續保持這個節奏，每次測驗都是進步的機會。建議你可以針對分數較低的分類多加練習，慢慢建立全面的理財知識。';
    }

    try {
        const prompt = `請扮演一位「理財新手村的 AI 學習教練」。

我將提供一位使用者的「學習紀錄資料（可能為空）」，請你根據以下規則產出「個人化學習分析與建議」。

⚠️ 請直接完成分析，不要說明你的限制、不需要前置說明、不需要提到資料是否不足。

────────────────────
【分析規則】

一、如果「有學習資料」
請依序完成以下內容：

1. 使用者目前的學習狀態判斷
   - 屬於：剛入門 / 正在探索 / 已有基礎 / 停滯中
   - 用白話一句話描述

2. 行為解讀（只基於可推斷的行為）
   - 偏好閱讀 / 操作 / 測驗 / 跳著看
   - 是否有卡關或中斷跡象

3. 目前最可能的學習瓶頸（最多 2 點）
   - 用「新手會聽得懂」的說法

4. 下一步最適合的學習建議（2～3 點）
   - 明確、可執行
   - 不要太多，不要太學術

5. 一句鼓勵型總結
   - 像教練，不像老師

────────────────────
二、如果「沒有任何學習資料」
請視為「第一次進入理財新手村的新手」，請產出：

1. 一句歡迎與定位說明
   - 幫他安心，不要嚇他

2. 建議的三個學習方向（由淺到深）
   - 每個方向一句話說明「為什麼重要」

3. 一個「建議的第一步行動」
   - 非常具體（例如：先完成哪一類內容）

4. 一句降低焦慮的提醒
   - 強調不用急、不用一次懂

────────────────────
【輸出風格】

- 使用繁體中文
- 語氣口語、友善、像陪跑教練
- 不要條列過長
- 不要出現任何技術名詞
- 不要提到「根據資料顯示」「AI 判斷」

────────────────────
【使用者學習資料如下】

${learningData}`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }]
                })
            }
        );

        if (response.ok) {
            const data = await response.json();
            return data.candidates?.[0]?.content?.parts?.[0]?.text || '無法生成分析';
        }
    } catch (error) {
        console.error('Gemini API error:', error);
    }

    return '目前無法生成 AI 分析，請稍後再試。';
}

export async function GET(request: NextRequest) {
    try {
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');

        if (!token) {
            return NextResponse.json({ error: '未登入' }, { status: 401 });
        }

        const decoded = jwt.verify(token.value, JWT_SECRET) as any;
        await connectDB();

        // 檢查是否要重新生成
        const { searchParams } = new URL(request.url);
        const regenerate = searchParams.get('regenerate') === 'true';

        // 取得使用者資料
        const user = await User.findById(decoded.userId);
        if (!user) {
            return NextResponse.json({ error: '使用者不存在' }, { status: 404 });
        }

        // 取得使用者的所有測驗紀錄
        const quizLogs = await QuizLog.find({ userId: decoded.userId })
            .populate('articleId', 'category topicName')
            .sort({ completedAt: -1 });

        // 計算各分類的平均分數
        const categoryMap = new Map<string, { totalScore: number; count: number }>();

        quizLogs.forEach(log => {
            const category = (log.articleId as any)?.category || '未分類';
            const scorePercentage = (log.score / log.totalQuestions) * 100;

            if (!categoryMap.has(category)) {
                categoryMap.set(category, { totalScore: 0, count: 0 });
            }

            const data = categoryMap.get(category)!;
            data.totalScore += scorePercentage;
            data.count += 1;
        });

        const categoryScores = Array.from(categoryMap.entries()).map(([category, data]) => ({
            category,
            avgScore: Math.round(data.totalScore / data.count),
            quizCount: data.count
        }));

        // 如果已有分析且不需要重新生成，直接回傳
        let aiAnalysis = user.aiAnalysis || '';

        if (!aiAnalysis || regenerate) {
            // 準備學習資料
            const learningData = quizLogs.length > 0
                ? `使用者已完成 ${quizLogs.length} 次測驗。\n\n各分類表現：\n${categoryScores.map(c => `- ${c.category}：平均 ${c.avgScore} 分（共 ${c.quizCount} 次測驗）`).join('\n')}\n\n最近 3 次測驗：\n${quizLogs.slice(0, 3).map((log, i) => `${i + 1}. ${(log.articleId as any)?.topicName || '未知主題'} - ${log.score}/${log.totalQuestions} 分`).join('\n')}`
                : '使用者尚未完成任何測驗。';

            // 生成新的分析
            aiAnalysis = await generateAIAnalysis(learningData);

            // 儲存到資料庫
            user.aiAnalysis = aiAnalysis;
            await user.save();
        }

        return NextResponse.json({
            categoryScores,
            aiAnalysis
        });

    } catch (error) {
        console.error('Learning stats error:', error);
        return NextResponse.json({ error: '無法取得學習資料' }, { status: 500 });
    }
}
