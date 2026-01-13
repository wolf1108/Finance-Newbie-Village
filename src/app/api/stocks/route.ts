import { NextResponse } from 'next/server';
import { exec } from 'child_process';
import util from 'util';
import connectDB from '@/lib/mongodb';
import Stock from '@/models/Stock';
import path from 'path';

const execPromise = util.promisify(exec);

// 台股名稱對照表
const STOCK_NAMES: { [key: string]: string } = {
    '2330.TW': '台積電',
    '2317.TW': '鴻海',
    '2454.TW': '聯發科',
    '2308.TW': '台達電',
    '2303.TW': '聯電',
    '2412.TW': '中華電',
    '1303.TW': '南亞',
    '2881.TW': '富邦金',
    '2891.TW': '中信金',
    '2002.TW': '中鋼',
    '2886.TW': '兆豐金',
    '1216.TW': '統一',
};

// 預設關注的台股清單
const DEFAULT_STOCKS = Object.keys(STOCK_NAMES);

// Lazy Update 門檻: 1 分鐘
const UPDATE_THRESHOLD_MS = 60 * 1000;

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

        // Ensure UTF-8 decoding for Chinese characters
        const { stdout } = await execPromise(command, { encoding: 'utf8' });

        try {
            const data = JSON.parse(stdout);
            return Object.values(data) as StockData[];
        } catch (jsonError) {
            console.error('JSON Parse Error:', jsonError, 'Stdout:', stdout);
            return [];
        }
    } catch (error) {
        console.error('Failed to execute python script:', error);
        return [];
    }
}

function generateMockData(symbol: string) {
    // Generate a somewhat realistic price based on random walk or just random range
    // 台股常見價格區間 mock
    const basePrice = Math.random() * 500 + 50;
    const changePercent = (Math.random() - 0.5) * 5; // -2.5% to +2.5%
    const change = basePrice * (changePercent / 100);

    return {
        symbol,
        shortName: STOCK_NAMES[symbol] || symbol,
        regularMarketPrice: Number(basePrice.toFixed(2)),
        regularMarketChange: Number(change.toFixed(2)),
        regularMarketChangePercent: Number(changePercent.toFixed(2))
    };
}

export async function GET(req: Request) {
    try {
        await connectDB();

        const { searchParams } = new URL(req.url);
        const query = searchParams.get('query');

        let targetStocks = DEFAULT_STOCKS;
        let isSearch = false;

        if (query) {
            isSearch = true;
            let symbol = query.toUpperCase();
            if (!symbol.includes('.')) {
                if (/^\d+$/.test(symbol)) {
                    symbol += '.TW';
                }
            }
            targetStocks = [symbol];
        }

        let stocks = await Stock.find({ symbol: { $in: targetStocks } });
        const now = new Date();
        const stocksToUpdate: string[] = [];

        for (const symbol of targetStocks) {
            const stock = stocks.find((s) => s.symbol === symbol);
            if (!stock || (now.getTime() - new Date(stock.lastUpdated).getTime() > UPDATE_THRESHOLD_MS)) {
                if (!stocksToUpdate.includes(symbol)) stocksToUpdate.push(symbol);
            }
        }

        if (stocksToUpdate.length > 0) {
            console.log(`Fetching updates for: ${stocksToUpdate.join(', ')}`);
            const stockDataList = await fetchStockDataFromPython(stocksToUpdate);

            for (const data of stockDataList) {
                if (data.regularMarketPrice !== undefined) {
                    await Stock.findOneAndUpdate(
                        { symbol: data.symbol },
                        {
                            name: STOCK_NAMES[data.symbol] || data.shortName || data.symbol,
                            currentPrice: data.regularMarketPrice,
                            change: data.regularMarketChange || 0,
                            changePercent: data.regularMarketChangePercent || 0,
                            lastUpdated: now,
                        },
                        { upsert: true, new: true }
                    );
                }
            }
        }

        stocks = await Stock.find({ symbol: { $in: targetStocks } }).sort({ symbol: 1 });
        return NextResponse.json({ stocks });

    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch stock data' }, { status: 500 });
    }
}
