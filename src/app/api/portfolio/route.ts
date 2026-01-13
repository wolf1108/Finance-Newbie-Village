import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Portfolio from '@/models/Portfolio';
import Transaction from '@/models/Transaction';
import Stock from '@/models/Stock';

export async function GET(req: Request) {
    try {
        await connectDB();
        const { searchParams } = new URL(req.url);
        const userId = searchParams.get('userId');

        if (!userId) {
            return NextResponse.json({ error: 'UserId is required' }, { status: 400 });
        }

        // 1. 取得庫存
        const portfolios = await Portfolio.find({ userId });

        // 2. 為了計算損益，獲取最新股價
        // (這裡可以選擇是否要即時 call Yahoo，或信任 Stock table。為了效能先信 Stock table，因為 /api/stocks 會更新)
        const symbols = portfolios.map(p => p.symbol);
        const stocks = await Stock.find({ symbol: { $in: symbols } });

        const portfolioWithPnL = portfolios.map(p => {
            const stock = stocks.find(s => s.symbol === p.symbol);
            const currentPrice = stock ? stock.currentPrice : p.avgCost; // 若無股價則經設為成本

            const marketValue = currentPrice * p.shares;
            const prevValue = p.avgCost * p.shares; // 原始成本總額

            // 未實現損益 = 市值 - 成本
            const profitLoss = Math.round(marketValue - prevValue);
            const profitLossPercent = prevValue > 0 ? (profitLoss / prevValue) * 100 : 0;

            return {
                ...p.toObject(),
                name: stock ? stock.name : p.symbol,
                currentPrice,
                marketValue,
                profitLoss,
                profitLossPercent: parseFloat(profitLossPercent.toFixed(2))
            };
        });

        // 計算總資產摘要
        const totalMarketValue = portfolioWithPnL.reduce((sum, item) => sum + item.marketValue, 0);
        const totalProfitLoss = portfolioWithPnL.reduce((sum, item) => sum + item.profitLoss, 0);

        // 3. 取得交易紀錄 (依時間倒序)
        // 3. 取得交易紀錄 (依時間倒序)
        const transactions = await Transaction.find({ userId }).sort({ timestamp: -1 });

        // 4. Get User Balance
        const User = (await import('@/models/User')).default;
        let user = await User.findById(userId);

        // Lazy initialization for demo purpose
        // Lazy initialization for demo purpose
        if (!user) {
            try {
                user = await User.create({
                    _id: userId,
                    username: '模擬使用者',
                    email: 'demo@example.com',
                    points: 0,
                    simulatedBalance: 100000,
                    role: 'user',
                });
            } catch (createError) {
                // Try finding again, maybe it was a timing issue or it actually exists
                user = await User.findById(userId);
            }
        }

        const userBalance = user ? user.simulatedBalance : 0;

        return NextResponse.json({
            portfolio: portfolioWithPnL,
            summary: {
                totalMarketValue,
                totalProfitLoss
            },
            transactions,
            userBalance
        });

    } catch (error) {
        console.error('Portfolio API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch portfolio' }, { status: 500 });
    }
}
