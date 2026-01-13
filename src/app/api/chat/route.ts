import { NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';

export async function POST(req: Request) {
    try {
        if (!GEMINI_API_KEY) {
            return NextResponse.json(
                { error: 'API key not configured' },
                { status: 500 }
            );
        }

        // Check Auth for Role
        const cookieStore = await cookies();
        const token = cookieStore.get('auth_token');
        let isAdmin = false;

        if (token) {
            try {
                const decoded = jwt.verify(token.value, JWT_SECRET) as any;
                isAdmin = decoded.role === 'admin';
            } catch (e) {
                // Invalid token, treat as user
            }
        }

        const { messages } = await req.json();

        if (!messages || !Array.isArray(messages)) {
            return NextResponse.json(
                { error: 'Invalid messages format' },
                { status: 400 }
            );
        }

        const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
        // Fallback to gemini-pro which is the stable model for v1beta API
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

        // System instruction prompt
        let systemInstruction = '';

        if (isAdmin) {
            systemInstruction = `
你是一個全能的「管理小幫手」。
你的使用者是這個理財新手村的村長（管理員）。
你可以回答任何問題，包含但不限於金融、程式技術、管理建議、或是閒聊，**不限制主題**。
請以專業、親切且有幫助的語氣回答。
`;
        } else {
            systemInstruction = `
你是一個「金融專用問答系統（Finance-Only QA Bot）」。

【任務範圍（只允許）】
你只能回答「金融相關問題」，包含但不限於：
- 個人理財（儲蓄、預算、負債管理）
- 投資基礎（股票、ETF、債券、基金）
- 風險概念（波動、分散、報酬與風險）
- 金融常識（通膨、利率、複利、資產配置）
- 投資行為與心理（風險承受度、長期 vs 短期）
- 金融教育與入門知識（非即時交易建議）

【明確禁止回答】
以下情況「一律不回答實質內容」：
- 與金融無關的問題（如：程式、歷史、娛樂、醫療、感情、政治）
- 純技術問題（寫程式、Debug、API、架構）
- 要求即時股價、盤中資訊、內線、預測
- 要求明確「買賣指令」、「報明牌」、「保證獲利」
- 法律、稅務、醫療專業建議

【判斷規則（優先級最高）】
1. 先判斷「是否屬於金融範圍」
2. 若不屬於 → **不要回答問題內容**
3. 僅回覆以下固定提示語之一

【拒答固定回覆（只能選一）】
- 「此問題不屬於金融相關範圍，請改問金融或理財主題。」
- 「我只回覆金融相關問題，請重新提問。」
- 「此系統僅限金融問題，其他主題不提供回覆。」

【回答風格（若符合範圍）】
- 語氣：中立、教學導向
- 不提供即時投資建議
- 不預測市場
- 偏概念解釋與風險說明
- 適合新手理解

【輸出限制】
- 不解釋拒答原因
- 不延伸討論
- 不推薦外部平台
- 不加入免責聲明
`;
        }

        const chat = model.startChat({
            history: [
                {
                    role: 'user',
                    parts: [{ text: systemInstruction }],
                },
                {
                    role: 'model',
                    parts: [{ text: '收到，我將嚴格遵守上述規則，僅作為「金融專用問答系統」進行回覆。' }],
                },
                ...messages.slice(0, -1).map((msg: any) => ({
                    role: msg.role === 'user' ? 'user' : 'model',
                    parts: [{ text: msg.content }],
                })),
            ],
            generationConfig: {
                maxOutputTokens: 1000,
            },
        });

        const lastMessage = messages[messages.length - 1];
        const result = await chat.sendMessage(lastMessage.content);
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({ reply: text });

    } catch (error: any) {
        console.error('Chat API Error Full Details:', error);
        return NextResponse.json(
            { error: 'Failed to process chat request: ' + (error.message || 'Unknown error') },
            { status: 500 }
        );
    }
}
