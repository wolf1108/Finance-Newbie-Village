'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface Transaction {
    _id: string;
    userId: {
        username: string;
        email: string;
    } | null;
    symbol: string;
    side: 'buy' | 'sell';
    shares: number;
    price: number;
    fee: number;
    totalAmount: number;
    orderType: string;
    tradeType: string;
    condition: string;
    priceType: string;
    timestamp: string;
}

export default function AdminTransactionsPage() {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchTransactions();
    }, []);

    const fetchTransactions = async () => {
        try {
            const res = await fetch('/api/admin/transactions');
            if (res.ok) {
                const data = await res.json();
                setTransactions(data);
            }
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>歷史總交易紀錄</h1>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>時間</th>
                            <th>村民</th>
                            <th>股票代號</th>
                            <th>買/賣</th>
                            <th>股數</th>
                            <th>成交單價</th>
                            <th>手續費</th>
                            <th>總金額</th>
                            <th>交易類型</th>
                        </tr>
                    </thead>
                    <tbody>
                        {transactions.map(Tx => (
                            <tr key={Tx._id}>
                                <td>{new Date(Tx.timestamp).toLocaleString()}</td>
                                <td>
                                    {Tx.userId ? (
                                        <div>
                                            <div className="font-bold">{Tx.userId.username}</div>
                                            <div className="text-sm text-gray-500">{Tx.userId.email}</div>
                                        </div>
                                    ) : (
                                        <span className="text-gray-400">未知用戶</span>
                                    )}
                                </td>
                                <td>{Tx.symbol}</td>
                                <td>
                                    <span style={{
                                        color: Tx.side === 'buy' ? '#ef4444' : '#10b981',
                                        fontWeight: 'bold'
                                    }}>
                                        {Tx.side === 'buy' ? '買進' : '賣出'}
                                    </span>
                                </td>
                                <td>{Tx.shares}</td>
                                <td>{Tx.price}</td>
                                <td>{Tx.fee}</td>
                                <td>{Tx.totalAmount}</td>
                                <td>
                                    <span className="text-sm bg-gray-100 px-2 py-1 rounded">
                                        {Tx.tradeType} / {Tx.orderType} / {Tx.priceType}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
