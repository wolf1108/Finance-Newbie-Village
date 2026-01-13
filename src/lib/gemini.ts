import { GoogleGenerativeAI } from '@google/generative-ai';

const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
}

interface GenerateQuizParams {
    videoTranscript?: string;
    videoDescription?: string;
    numQuestions?: number;
}

interface GenerateQuizResult {
    questions: QuizQuestion[];
}

/**
 * 使用 Gemini API 生成測驗題目
 * @param params - 包含影片字幕或描述的參數
 * @returns 生成的測驗題目
 */
export async function generateQuizQuestions(
    params: GenerateQuizParams
): Promise<GenerateQuizResult> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY 環境變數未設定');
    }

    const { videoTranscript, videoDescription, numQuestions = 10 } = params;

    if (!videoTranscript && !videoDescription) {
        throw new Error('必須提供 videoTranscript 或 videoDescription');
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    const content = videoTranscript || videoDescription;

    const prompt = `
你是一位專業的金融教育出題老師。根據以下內容，生成 ${numQuestions} 道選擇題來測試學習者的理解程度。

內容：
${content}

要求：
1. 每題必須有 4 個選項
2. 題目應涵蓋內容的核心概念
3. 選項應具有辨識度，避免過於相似
4. 題目難度適中，適合金融新手

請以 JSON 格式回傳，格式如下：
{
  "questions": [
    {
      "question": "題目內容",
      "options": ["選項A", "選項B", "選項C", "選項D"],
      "correctAnswer": 0
    }
  ]
}

其中 correctAnswer 為正確答案的索引 (0-3)。只回傳 JSON，不要有其他文字。
`;

    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();

    // 清理回傳的文字，移除 markdown 標記
    const cleanedText = text
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .trim();

    try {
        const parsed = JSON.parse(cleanedText) as GenerateQuizResult;

        // 驗證格式
        if (!parsed.questions || !Array.isArray(parsed.questions)) {
            throw new Error('回傳格式錯誤：缺少 questions 陣列');
        }

        for (const q of parsed.questions) {
            if (
                !q.question ||
                !q.options ||
                q.options.length !== 4 ||
                typeof q.correctAnswer !== 'number' ||
                q.correctAnswer < 0 ||
                q.correctAnswer > 3
            ) {
                throw new Error('題目格式錯誤');
            }
        }

        return parsed;
    } catch (e) {
        console.error('解析 Gemini 回傳失敗:', e);
        console.error('原始回傳:', text);
        throw new Error('AI 回傳格式解析失敗');
    }
}

/**
 * 答錯題目的資訊
 */
interface WrongAnswer {
    question: string;
    options: string[];
    userAnswer: number;
    correctAnswer: number;
    index: number; // 原始題目索引 (0-based)
}

/**
 * 使用 Gemini API 為答錯的題目生成解析
 * @param wrongAnswers - 答錯的題目清單
 * @returns 每題的解析說明陣列
 */
export async function generateExplanations(
    wrongAnswers: WrongAnswer[]
): Promise<string[]> {
    if (!GEMINI_API_KEY) {
        throw new Error('GEMINI_API_KEY 環境變數未設定');
    }

    if (wrongAnswers.length === 0) {
        return [];
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });

    // 組合所有錯誤題目的資訊
    const questionsInfo = wrongAnswers.map((q) => {
        const userChoice = q.options[q.userAnswer];
        const correctChoice = q.options[q.correctAnswer];
        // 使用原始題目編號 (q.index + 1)，確保 AI 知道這是第幾題
        return `
題目 ${q.index + 1}：${q.question}
選項：
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
使用者選擇：${String.fromCharCode(65 + q.userAnswer)}. ${userChoice}
正確答案：${String.fromCharCode(65 + q.correctAnswer)}. ${correctChoice}
`;
    }).join('\n---\n');

    const prompt = `
你是一位專業的金融教育老師。以下是學生答錯的題目。請針對每一題，務必依循下列結構撰寫解析：

1. **正確解答**：明確指出正確選項是哪個（例如 A、B、C 或 D），並解釋為什麼它是對的。
2. **錯誤分析**：針對「使用者選擇」的該錯誤選項進行具體分析，說明為何該選項不適合或哪裡觀念錯誤。

請以 JSON 格式回傳，例如：
{
  "explanations": [
    "正確答案是 B。因為長期持有能享受複利效應...。而你選擇的 A (頻繁進出) 容易被手續費吃掉獲利，且難以預測短期波動。",
    "正確答案是 C。..."
  ]
}


要求：
- 每則解析約 80-150 字。
- 語氣親切但專業。
- 務必包含「正確答案原因」與「使用者錯誤原因」兩個部分。
- 按照題目順序依序回傳解析。
- 只回傳 JSON，不要有其他文字。
`;

    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = response.text();

        const cleanedText = text
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        const parsed = JSON.parse(cleanedText) as { explanations: string[] };

        if (!parsed.explanations || !Array.isArray(parsed.explanations)) {
            throw new Error('解析格式錯誤');
        }

        // 確保解析數量與題目數量一致
        while (parsed.explanations.length < wrongAnswers.length) {
            parsed.explanations.push('抱歉，此題解析暫時無法取得。');
        }

        return parsed.explanations;
    } catch (e) {
        console.error('生成解析失敗:', e);
        // 如果失敗，返回預設解析
        return wrongAnswers.map(() => '抱歉，此題解析暫時無法取得。請參考正確答案學習。');
    }
}

export default generateQuizQuestions;

