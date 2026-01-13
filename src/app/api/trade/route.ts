import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import path from 'path';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Stock from '@/models/Stock';
import Transaction from '@/models/Transaction';
import Portfolio from '@/models/Portfolio';

const execPromise = util.promisify(exec);

interface StockData {
    symbol: string;
    shortName: string;
    regularMarketPrice: number;
    regularMarketChange: number;
    regularMarketChangePercent: number;
}

async function fetchStockDataFromPython(symbols: string[]): Promise<StockData[]> {
    try {
        const scriptPath = path.join(process.cwd(), 'scripts', 'fetch_stocks.py');
        const command = `python "${scriptPath}" ${symbols.join(' ')}`;
        const { stdout } = await execPromise(command);
        const data = JSON.parse(stdout);
        return Object.values(data) as StockData[];
    } catch (error) {
        console.error('Failed to execute python script:', error);
        return [];
    }
}

export async function POST(req: Request) {
    try {
        await connectDB();
        const { userId, symbol, side, shares, orderType, tradeType, condition, priceType, price: requestPrice } = await req.json();

        // 1. 驗證基本參數
        if (!userId || !symbol || !side || !shares) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        const user = await User.findById(userId);
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // 2. 獲取並更新最新股價 (Security Check)
        let stock = await Stock.findOne({ symbol });
        if (!stock) {
            const stockDataList = await fetchStockDataFromPython([symbol]);
            if (stockDataList.length > 0 && stockDataList[0].regularMarketPrice !== undefined) {
                const data = stockDataList[0];
                stock = await Stock.create({
                    symbol,
                    name: data.shortName || symbol,
                    currentPrice: data.regularMarketPrice,
                    change: data.regularMarketChange || 0,
                    changePercent: data.regularMarketChangePercent || 0,
                });
            } else {
                return NextResponse.json({ error: 'Stock not found' }, { status: 404 });
            }
        }

        let executionPrice = requestPrice;
        // 再次確認最新價
        const stockDataList = await fetchStockDataFromPython([symbol]);
        let currentMarketPrice = stock.currentPrice;

        if (stockDataList.length > 0 && stockDataList[0].regularMarketPrice !== undefined) {
            const quote = stockDataList[0];
            currentMarketPrice = quote.regularMarketPrice;

            // 更新 DB 價格
            stock.currentPrice = quote.regularMarketPrice;
            stock.change = quote.regularMarketChange || 0;
            stock.changePercent = quote.regularMarketChangePercent || 0;
            stock.lastUpdated = new Date();
            await stock.save();
        }

        // --- Trading Logic Implementation ---

        // 1. 市價單 (Market Order): Always execute at current market price
        if (priceType === '市價') {
            executionPrice = currentMarketPrice;
        }

        // 2. 限價單 (Limit Order): Validate price
        else if (priceType === '限價') {
            // Buy: User wants to buy at Limit or lower. If Market > Limit, cannot fill immediately.
            if (side === 'buy' && currentMarketPrice > requestPrice) {
                return NextResponse.json({
                    error: `限價單無法成交: 目前市價 (${currentMarketPrice}) 高於您的出價 (${requestPrice})`
                }, { status: 400 });
            }
            // Sell: User wants to sell at Limit or higher. If Market < Limit, cannot fill immediately.
            if (side === 'sell' && currentMarketPrice < requestPrice) {
                return NextResponse.json({
                    error: `限價單無法成交: 目前市價 (${currentMarketPrice}) 低於您的出價 (${requestPrice})`
                }, { status: 400 });
            }

            // If valid, usually fill at Market Price (Better Execution Rule) or Limit Price?
            // Simpler for users: fill at Market Price (it's the real transaction price)
            // However, strictly speaking if Limit > Market (Buy), you buy at Market.
            executionPrice = currentMarketPrice;
        }

        // 3. 盤後 (After-hours): Logic usually requires fixed price (Close price).
        // For this sim, we assume currentMarketPrice IS the close price if it's after hours. 
        // We accept the order if valid.

        // ------------------------------------

        if (!executionPrice) {
            return NextResponse.json({ error: 'Unable to determine execution price' }, { status: 400 });
        }


        // 3. 計算金額與手續費
        const rawAmount = executionPrice * shares;
        const fee = Math.floor(rawAmount * 0.001425);
        const finalAmount = side === 'buy' ? rawAmount + fee : rawAmount - fee;

        // 4. 執行交易檢查與更新
        // ... (existing balance checks) ...
        if (side === 'buy') {
            if (user.simulatedBalance < finalAmount) {
                return NextResponse.json({ error: 'Insufficient funds (違約交割風險)' }, { status: 400 });
            }

            let portfolio = await Portfolio.findOne({ userId, symbol });
            const currentShares = portfolio ? portfolio.shares : 0;
            const currentAvgCost = portfolio ? portfolio.avgCost : 0;

            const newShares = currentShares + shares;
            const newAvgCost = ((currentShares * currentAvgCost) + (shares * executionPrice)) / newShares;

            // Update User
            await User.findByIdAndUpdate(userId, { $inc: { simulatedBalance: -finalAmount } });

            // Update Portfolio
            await Portfolio.findOneAndUpdate(
                { userId, symbol },
                {
                    shares: newShares,
                    avgCost: newAvgCost
                },
                { upsert: true }
            );

        } else if (side === 'sell') {
            const portfolio = await Portfolio.findOne({ userId, symbol });
            if (!portfolio || portfolio.shares < shares) {
                return NextResponse.json({ error: 'Insufficient shares' }, { status: 400 });
            }

            // Update User
            await User.findByIdAndUpdate(userId, { $inc: { simulatedBalance: finalAmount } });

            // Update Portfolio
            const newShares = portfolio.shares - shares;
            if (newShares > 0) {
                await Portfolio.findOneAndUpdate(
                    { userId, symbol },
                    { shares: newShares }
                );
            } else {
                await Portfolio.findOneAndDelete({ userId, symbol });
            }
        }

        // 5. 建立交易紀錄
        const transaction = await Transaction.create({
            userId,
            symbol,
            side,
            shares,
            price: executionPrice,
            fee,
            totalAmount: finalAmount,
            orderType: orderType || '整股',
            tradeType: tradeType || '現股',
            condition: condition || 'ROD',
            priceType: priceType || '限價',
            timestamp: new Date()
        });

        const updatedUser = await User.findById(userId).select('simulatedBalance');

        return NextResponse.json({
            success: true,
            transaction,
            userBalance: updatedUser?.simulatedBalance
        });

    } catch (error) {
        console.error('Trade API Error:', error);
        return NextResponse.json({ error: 'Trade failed' }, { status: 500 });
    }
}
