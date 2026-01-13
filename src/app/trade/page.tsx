'use client';

import { useState, useEffect } from 'react';
import TradeForm from './TradeForm';
import styles from './page.module.css';

// 定義資料介面
interface Stock {
    _id: string;
    symbol: string;
    name: string;
    currentPrice: number;
    change: number;
    changePercent: number;
    lastUpdated: string;
}

interface Transaction {
    _id: string;
    timestamp: string;
    symbol: string;
    side: 'buy' | 'sell';
    shares: number;
    price: number;
    totalAmount: number;
}

interface PortfolioItem {
    symbol: string;
    name: string;
    shares: number;
    avgCost: number;
    currentPrice: number;
    marketValue: number;
    profitLoss: number;
    profitLossPercent: number;
}

interface PortfolioSummary {
    totalMarketValue: number;
    totalProfitLoss: number;
}

export default function TradePage() {
    const [activeTab, setActiveTab] = useState<'market' | 'history' | 'portfolio'>('market');
    const [stocks, setStocks] = useState<Stock[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [portfolio, setPortfolio] = useState<PortfolioItem[]>([]);
    const [summary, setSummary] = useState<PortfolioSummary>({ totalMarketValue: 0, totalProfitLoss: 0 });
    const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
    const [userBalance, setUserBalance] = useState<number>(0);

    const userId = '507f1f77bcf86cd799439011';

    useEffect(() => {
        // Initial balance fetch if needed
    }, []);

    const fetchStocks = async (query = '') => {
        try {
            const url = query ? `/api/stocks?query=${query}` : '/api/stocks';
            const res = await fetch(url);
            const data = await res.json();
            if (data.stocks) setStocks(data.stocks);
        } catch (error) {
            console.error('Error fetching stocks:', error);
        }
    };

    const fetchPortfolio = async () => {
        try {
            const res = await fetch(`/api/portfolio?userId=${userId}`);
            const data = await res.json();
            if (data.portfolio) setPortfolio(data.portfolio);
            if (data.summary) setSummary(data.summary);
            if (data.transactions) setTransactions(data.transactions);
            if (data.userBalance !== undefined) setUserBalance(data.userBalance);
        } catch (error) {
            console.error('Error fetching portfolio:', error);
        }
    };

    useEffect(() => {
        if (activeTab === 'market') fetchStocks();
        if (activeTab === 'history' || activeTab === 'portfolio') fetchPortfolio();
    }, [activeTab]);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const input = (document.getElementById('stockSearch') as HTMLInputElement).value;
        if (input) {
            fetchStocks(input);
        } else {
            fetchStocks();
        }
    };

    const handleResetSearch = () => {
        const input = document.getElementById('stockSearch') as HTMLInputElement;
        if (input) input.value = '';
        fetchStocks();
    };

    const handleStockClick = (stock: Stock) => {
        setSelectedStock(stock);
    };

    const handleCloseTradeForm = () => {
        setSelectedStock(null);
        // Refresh data after trade
        fetchStocks();
        fetchPortfolio();
    };

    return (
        <div className={styles.container}>
            {/* Conditional Rendering based on Tab */}
            {selectedStock ? (
                <TradeForm
                    stock={selectedStock}
                    userId={userId}
                    onClose={handleCloseTradeForm}
                    currentBalance={userBalance}
                    refreshBalance={() => { }}
                />
            ) : (
                <>
                    {/* Market View */}
                    {activeTab === 'market' && (
                        <div className={styles.viewContainer}>
                            <h2 className={styles.header}>股票列表</h2>

                            {/* Search Bar */}
                            <form className={styles.searchContainer} onSubmit={handleSearch}>
                                <input
                                    id="stockSearch"
                                    type="text"
                                    placeholder="輸入代碼 (預設台股, 如 2330)"
                                    className={styles.searchInput}
                                />
                                <button type="submit" className={styles.searchBtn}>搜尋</button>
                                <button type="button" className={styles.resetBtn} onClick={handleResetSearch}>✕</button>
                            </form>

                            <div className={styles.tableHeader}>
                                <span>股票名稱</span>
                                <span>成交</span>
                                <span>漲跌</span>
                                <span>幅度</span>
                            </div>
                            <div className={styles.stockList}>
                                {stocks.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '20px', color: '#aaa' }}>資料查詢中...</div>
                                ) : (
                                    stocks.map((stock) => (
                                        <div
                                            key={stock._id}
                                            className={styles.stockItem}
                                            onClick={() => handleStockClick(stock)}
                                        >
                                            <span className={styles.stockName}>{stock.symbol} {stock.name}</span>
                                            <span className={stock.change > 0 ? styles.up : stock.change < 0 ? styles.down : ''}>
                                                {stock.currentPrice.toFixed(2)}
                                            </span>
                                            <span className={stock.change > 0 ? styles.up : stock.change < 0 ? styles.down : ''}>
                                                {stock.change.toFixed(2)}
                                            </span>
                                            <span className={stock.change > 0 ? styles.up : stock.change < 0 ? styles.down : ''}>
                                                {stock.changePercent.toFixed(2)}%
                                            </span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    )}

                    {/* History View */}
                    {activeTab === 'history' && (
                        <div className={styles.viewContainer}>
                            <div className={styles.historyHeader}>
                                <h2>交易紀錄</h2>
                            </div>

                            <div className={styles.balanceSection}>
                                <div className={styles.balanceLabel}>
                                    <div className={styles.coinIcon}>$</div>
                                    <span>宅宅幣</span>
                                </div>
                                <div className={styles.balanceAmount}>
                                    {userBalance.toLocaleString()}
                                </div>
                            </div>

                            <div className={styles.tableHeader}>
                                <span>交易日期</span>
                                <span>股票名稱</span>
                                <span>買/賣</span>
                                <span>股數</span>
                                <span>成交金額</span>
                            </div>
                            <div className={styles.list}>
                                {transactions.map((tx) => (
                                    <div key={tx._id} className={styles.item}>
                                        <span>{new Date(tx.timestamp).toLocaleDateString()}</span>
                                        <span>{tx.symbol}</span>
                                        <span className={tx.side === 'buy' ? styles.up : styles.down}>
                                            {tx.side === 'buy' ? '買進' : '賣出'}
                                        </span>
                                        <span>{tx.shares}</span>
                                        <span>{tx.totalAmount.toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Portfolio View */}
                    {activeTab === 'portfolio' && (
                        <div className={styles.viewContainer}>
                            <div className={styles.portfolioHeader}>
                                <h2>庫存損益</h2>
                            </div>
                            <div className={styles.tableHeader}>
                                <span>股票名稱</span>
                                <span>股數</span>
                                <span>損益</span>
                            </div>
                            <div className={styles.list}>
                                {portfolio.map((p) => (
                                    <div key={p.symbol} className={styles.item}>
                                        <span>{p.name}</span>
                                        <span>{p.shares}</span>
                                        <span className={p.profitLoss > 0 ? styles.up : p.profitLoss < 0 ? styles.down : ''}>
                                            {p.profitLoss.toLocaleString()}
                                        </span>
                                    </div>
                                ))}
                                <div className={styles.summaryFooter}>
                                    <span>總損益</span>
                                    <span className={summary.totalProfitLoss > 0 ? styles.up : summary.totalProfitLoss < 0 ? styles.down : ''}>
                                        {summary.totalProfitLoss.toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Bottom Navigation */}
                    <div className={styles.bottomNav}>
                        <button
                            className={activeTab === 'market' ? styles.active : ''}
                            onClick={() => setActiveTab('market')}
                        >
                            股票列表
                        </button>
                        <button
                            className={activeTab === 'history' ? styles.active : ''}
                            onClick={() => setActiveTab('history')}
                        >
                            交易紀錄
                        </button>
                        <button
                            className={activeTab === 'portfolio' ? styles.active : ''}
                            onClick={() => setActiveTab('portfolio')}
                        >
                            庫存損益
                        </button>
                    </div>
                </>
            )}
        </div>
    );
}
