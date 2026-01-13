import connectDB from '@/lib/mongodb';
import User, { IUser } from '@/models/User';

// 積分轉換比例：10 分 = 1,000 元模擬資金
const POINTS_TO_BALANCE_RATIO = 100; // 每 1 分 = 100 元

export interface UpdateBalanceResult {
    user: IUser;
    pointsEarned: number;
    balanceAdded: number;
}

/**
 * 測驗完成後更新使用者餘額
 * 將測驗得分按比例轉換為模擬資金
 * 
 * 轉換規則: 10 分 = 1,000 元模擬資金 (即每分 100 元)
 * 
 * @param userId - 使用者 ID
 * @param score - 測驗得分 (答對題數)
 * @param totalQuestions - 總題數
 * @returns 更新後的使用者資料與獲得的積分/資金
 */
export async function updateUserBalance(
    userId: string,
    score: number,
    totalQuestions: number
): Promise<UpdateBalanceResult> {
    await connectDB();

    // 計算獲得的積分 (每答對一題得 10 分)
    const pointsEarned = score * 10;

    // 計算增加的模擬資金 (10 分 = 1,000 元)
    const balanceAdded = pointsEarned * POINTS_TO_BALANCE_RATIO;

    // 更新使用者資料
    let user = await User.findByIdAndUpdate(
        userId,
        {
            $inc: {
                points: pointsEarned,
                simulatedBalance: balanceAdded,
            },
        },
        { new: true }
    );

    // 如果使用者不存在，自動建立一個模擬使用者
    if (!user) {
        user = await User.create({
            _id: userId,
            username: '模擬使用者',
            email: 'demo@example.com',
            points: pointsEarned,
            simulatedBalance: 100000 + balanceAdded, // 初始 10 萬 + 獲得的資金
            role: '村民',
        });
    }

    return {
        user,
        pointsEarned,
        balanceAdded,
    };
}

/**
 * 取得使用者目前的積分與餘額
 * @param userId - 使用者 ID
 * @returns 使用者資料
 */
export async function getUserBalance(userId: string): Promise<IUser | null> {
    await connectDB();
    return User.findById(userId).select('username points simulatedBalance');
}

export default updateUserBalance;
