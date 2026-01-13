'use client';

import { useState } from 'react';
import styles from './page.module.css'; // Reuse or create new

// 簡單樣式覆寫，為了 TradeForm 特有樣式
const formStyles = {
    overlay: {
        position: 'fixed' as const,
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        backgroundColor: 'rgba(0, 0, 0, 0.7)', // 半透明遮罩
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(3px)',
    },
    container: {
        backgroundColor: '#2b1b1b', // 更深一點的背景，提升質感
        padding: '30px', // 增加內距
        borderRadius: '16px', // 更圓潤
        width: '95%',
        maxWidth: '520px', // 加寬，讓內容不擁擠，自然減少高度
        color: '#fff',
        boxShadow: '0 25px 60px rgba(0,0,0,0.9)', // 強烈陰影增加浮動感
        maxHeight: '95vh', // 爭取更多垂直空間
        overflowY: 'auto' as const, // 只有真的超出時才滾動
        border: '1px solid #5a2e2e',
        position: 'relative' as const,
    },
    header: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: '#fff',
        fontSize: '1.2rem',
        fontWeight: 'bold' as const,
        marginBottom: '1.5rem',
        borderBottom: '1px solid #4a2525',
        paddingBottom: '0.75rem',
    },
    closeIcon: {
        background: 'none',
        border: 'none',
        color: '#aaa',
        fontSize: '1.5rem',
        cursor: 'pointer',
        padding: '0 5px',
    },
    row: {
        display: 'flex',
        alignItems: 'center',
        marginBottom: '0.8rem', // 縮小間距
    },
    label: {
        width: '60px',
        color: '#d4bbb0', // 柔和一點的顏色
        fontWeight: 'bold' as const,
        fontSize: '0.9rem',
    },
    buttonGroup: {
        display: 'flex',
        flex: 1,
        gap: '6px',
    },
    optionBtn: {
        flex: 1,
        padding: '6px',
        backgroundColor: '#3b2525',
        color: '#bbb',
        border: '1px solid #4a3535',
        borderRadius: '6px',
        cursor: 'pointer',
        fontSize: '0.9rem',
        transition: 'all 0.2s',
    },
    activeOption: {
        backgroundColor: '#f0f0f0',
        color: '#2b1b1b', // 深色字
        border: '1px solid #fff',
        fontWeight: 'bold' as const,
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    buyBtn: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#d9534f', // 稍微柔和的紅
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    sellBtn: {
        flex: 1,
        padding: '8px',
        backgroundColor: '#5cb85c', // 稍微柔和的綠
        color: '#fff',
        border: 'none',
        borderRadius: '6px',
        fontSize: '1rem',
        fontWeight: 'bold' as const,
        cursor: 'pointer',
        boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
    },
    activeSell: {
        backgroundColor: '#4dff4d',
        color: '#000',
    },
    inputControl: {
        display: 'flex',
        flex: 1,
        backgroundColor: '#1f1212',
        borderRadius: '6px',
        border: '1px solid #4a3535',
        overflow: 'hidden',
    },
    controlBtn: {
        width: '36px',
        backgroundColor: '#3b2525',
        color: '#fff',
        border: 'none',
        fontSize: '1.2rem',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
    },
    input: {
        flex: 1,
        backgroundColor: 'transparent',
        border: 'none',
        color: '#fff',
        textAlign: 'center' as const,
        fontSize: '1rem',
        padding: '6px 0',
        width: '100%',
    },
    submitBtn: {
        width: '100%',
        padding: '12px',
        backgroundColor: '#ef6830',
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        fontSize: '1.1rem',
        fontWeight: 'bold' as const,
        marginTop: '1.2rem',
        cursor: 'pointer',
        boxShadow: '0 4px 10px rgba(239, 104, 48, 0.3)',
        transition: 'background 0.2s',
    },
    cancelBtn: {
        width: '100%',
        padding: '10px',
        backgroundColor: 'transparent',
        color: '#888',
        border: 'none',
        borderRadius: '8px',
        fontSize: '0.9rem',
        marginTop: '0.5rem',
        cursor: 'pointer',
    }
};

interface TradeFormProps {
    stock: any;
    userId: string;
    onClose: () => void;
    currentBalance: number;
    refreshBalance: () => void;
}

export default function TradeForm({ stock, userId, onClose, currentBalance, refreshBalance }: TradeFormProps) {
    const [side, setSide] = useState<'buy' | 'sell'>('buy');
    const [shares, setShares] = useState<number>(1); // Default 1 share for simplicity, or 1000
    const [price, setPrice] = useState<number>(stock.currentPrice);
    const [confirmModal, setConfirmModal] = useState(false);
    const [loading, setLoading] = useState(false);

    // Options (Visual only for now)
    const [orderType, setOrderType] = useState('整股');
    const [tradeType, setTradeType] = useState('現股');
    const [condition, setCondition] = useState('ROD');
    const [priceType, setPriceType] = useState('市價');

    const isOddLot = orderType === '零股';
    const multiplier = isOddLot ? 1 : 1000;
    const totalShares = shares * multiplier;

    const estimatedTotal = Math.floor(price * totalShares);
    const fee = Math.floor(estimatedTotal * 0.001425);
    const totalWithFee = side === 'buy' ? estimatedTotal + fee : estimatedTotal - fee;

    const handleSubmit = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/trade', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId,
                    symbol: stock.symbol,
                    side,
                    shares: totalShares, // Send converted shares count
                    price,
                    orderType,
                    tradeType,
                    condition
                }),
            });
            const data = await res.json();

            if (data.success) {
                alert('交易成功！');
                refreshBalance();
                onClose();
            } else {
                alert(`交易失敗: ${data.error}`);
            }
        } catch (error) {
            console.error(error);
            alert('系統錯誤');
        } finally {
            setLoading(false);
            setConfirmModal(false);
        }
    };

    if (confirmModal) {
        return (
            <div style={{ ...formStyles.overlay, backgroundColor: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ backgroundColor: '#2b1b1b', padding: '24px', borderRadius: '16px', width: '90%', maxWidth: '400px', border: `2px solid ${side === 'buy' ? '#ef6830' : '#4dff4d'}`, boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
                    <div style={{ backgroundColor: side === 'buy' ? '#ef6830' : '#4dff4d', color: side === 'buy' ? '#fff' : '#000', padding: '12px', textAlign: 'center', margin: '-24px -24px 24px -24px', borderRadius: '14px 14px 0 0' }}>
                        <h2 style={{ margin: 0, fontSize: '1.4rem' }}>{side === 'buy' ? '買進' : '賣出'}</h2>
                    </div>

                    <div style={{ textAlign: 'center', color: '#f7d58b', marginBottom: '24px' }}>
                        <h3 style={{ margin: 0, fontSize: '1.2rem' }}>{stock.name} ({stock.symbol})</h3>
                    </div>

                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>委託股數</span>
                        <span style={{ fontWeight: 'bold' }}>{totalShares.toLocaleString()} 股</span>
                    </div>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>委託價格</span>
                        <span style={{ fontWeight: 'bold' }}>{price}</span>
                    </div>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>預估金額</span>
                        <span>{estimatedTotal.toLocaleString()}</span>
                    </div>
                    <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: '#aaa' }}>手續費</span>
                        <span>{fee}</span>
                    </div>
                    <hr style={{ borderColor: '#4a3535', margin: '20px 0' }} />
                    <div style={{ marginBottom: '25px', display: 'flex', justifyContent: 'space-between', fontSize: '1.3rem', fontWeight: 'bold' }}>
                        <span>總金額</span>
                        <span>{totalWithFee.toLocaleString()}</span>
                    </div>

                    {/* Risk Warning */}
                    {side === 'buy' && totalWithFee > currentBalance && (
                        <div style={{ color: '#ff6b6b', backgroundColor: 'rgba(255,0,0,0.1)', border: '1px solid #ff6b6b', padding: '12px', margin: '15px 0', borderRadius: '8px', textAlign: 'center', fontSize: '0.9rem' }}>
                            ⚠️ 違約交割風險 (餘額不足)
                        </div>
                    )}

                    <button style={formStyles.submitBtn} onClick={handleSubmit} disabled={loading}>
                        {loading ? '處理中...' : '確認下單'}
                    </button>
                    <button style={formStyles.cancelBtn} onClick={() => setConfirmModal(false)}>
                        取消
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div style={formStyles.overlay}>
            <div style={formStyles.container}>
                <div style={formStyles.header}>
                    <span>{stock.name} ({stock.symbol})</span>
                    <button style={formStyles.closeIcon} onClick={onClose}>✕</button>
                </div>

                {/* Form Rows - Same as before but cleaner structure */}
                <div style={{ ...formStyles.row, alignItems: 'flex-start' }}>
                    <span style={{ ...formStyles.label, marginTop: '8px' }}>交易</span>
                    <div style={{ flex: 1 }}>
                        <div style={formStyles.buttonGroup}>
                            {['整股', '盤後', '零股'].map(opt => (
                                <button key={opt} style={{ ...formStyles.optionBtn, ...(orderType === opt ? formStyles.activeOption : {}) }} onClick={() => setOrderType(opt)}>{opt}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px', lineHeight: '1.4' }}>
                            {orderType === '整股' && '以張為最小交易單位，一張為1,000股'}
                            {orderType === '盤後' && '收盤之後的交易，成交價格為當日股票的收盤價'}
                            {orderType === '零股' && '以股為最小交易單位'}
                        </div>
                    </div>
                </div>

                <div style={{ ...formStyles.row, alignItems: 'flex-start' }}>
                    <span style={{ ...formStyles.label, marginTop: '8px' }}>種類</span>
                    <div style={{ flex: 1 }}>
                        <div style={formStyles.buttonGroup}>
                            {['現股', '融資', '融券'].map(opt => (
                                <button key={opt} style={{ ...formStyles.optionBtn, ...(tradeType === opt ? formStyles.activeOption : {}) }} onClick={() => setTradeType(opt)}>{opt}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px', lineHeight: '1.4' }}>
                            {tradeType === '現股' && '用自有資金買賣股票'}
                            {tradeType === '融資' && '向證券商借取資金買進股票'}
                            {tradeType === '融券' && '向證券商借取股票並賣出股票'}
                        </div>
                    </div>
                </div>

                <div style={{ ...formStyles.row, alignItems: 'flex-start' }}>
                    <span style={{ ...formStyles.label, marginTop: '8px' }}>條件</span>
                    <div style={{ flex: 1 }}>
                        <div style={formStyles.buttonGroup}>
                            {['ROD', 'IOC', 'FOK'].map(opt => (
                                <button key={opt} style={{ ...formStyles.optionBtn, ...(condition === opt ? formStyles.activeOption : {}) }} onClick={() => setCondition(opt)}>{opt}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px', lineHeight: '1.4' }}>
                            {condition === 'ROD' && '當日委託有效單'}
                            {condition === 'IOC' && '立即成交或取消'}
                            {condition === 'FOK' && '全部成交或取消'}
                        </div>
                    </div>
                </div>

                <div style={{ ...formStyles.row, alignItems: 'flex-start' }}>
                    <span style={{ ...formStyles.label, marginTop: '8px' }}>類別</span>
                    <div style={{ flex: 1 }}>
                        <div style={formStyles.buttonGroup}>
                            {['限價', '市價'].map(opt => (
                                <button key={opt} style={{ ...formStyles.optionBtn, ...(priceType === opt ? formStyles.activeOption : {}) }} onClick={() => {
                                    setPriceType(opt);
                                    if (opt === '市價') setPrice(stock.currentPrice);
                                }}>{opt}</button>
                            ))}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#aaa', marginTop: '6px', lineHeight: '1.4' }}>
                            {priceType === '限價' && '指定買賣價格'}
                            {priceType === '市價' && '不指定買賣價格，以當前的市場價格成交'}
                        </div>
                    </div>
                </div>

                <div style={{ ...formStyles.row, marginTop: '20px' }}>
                    <span style={formStyles.label}>買賣</span>
                    <div style={{ ...formStyles.buttonGroup, flex: 2 }}>
                        <button
                            style={{ ...formStyles.buyBtn, opacity: side === 'buy' ? 1 : 0.3 }}
                            onClick={() => setSide('buy')}
                        >
                            買進
                        </button>
                        <button
                            style={{ ...formStyles.sellBtn, ...(side === 'sell' ? formStyles.activeSell : {}), opacity: side === 'sell' ? 1 : 0.3 }}
                            onClick={() => setSide('sell')}
                        >
                            賣出
                        </button>
                    </div>
                    {/* Conversion Hint */}
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginLeft: '10px', fontSize: '0.8rem', color: '#aaa', minWidth: '60px' }}>
                        <span>1單位</span>
                        <span style={{ color: '#fff' }}>{multiplier}股</span>
                    </div>
                </div>

                <div style={{ ...formStyles.row, marginTop: '20px' }}>
                    <span style={formStyles.label}>單位</span>
                    <div style={formStyles.inputControl}>
                        <button style={formStyles.controlBtn} onClick={() => setShares(Math.max(1, shares - 1))}>-</button>
                        <input style={formStyles.input} type="number" value={shares} onChange={(e) => setShares(Number(e.target.value))} />
                        <button style={formStyles.controlBtn} onClick={() => setShares(shares + 1)}>+</button>
                    </div>
                </div>

                <div style={{ ...formStyles.row }}>
                    <span style={formStyles.label}>價格</span>
                    <div style={{ ...formStyles.inputControl, opacity: priceType === '市價' ? 0.5 : 1, pointerEvents: priceType === '市價' ? 'none' : 'auto' }}>
                        <button style={formStyles.controlBtn} onClick={() => setPrice(Math.round((price - 0.5) * 100) / 100)}>-</button>
                        <input
                            style={formStyles.input}
                            type="number"
                            value={price}
                            onChange={(e) => setPrice(Number(e.target.value))}
                            disabled={priceType === '市價'}
                        />
                        <button style={formStyles.controlBtn} onClick={() => setPrice(Math.round((price + 0.5) * 100) / 100)}>+</button>
                    </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '15px', color: '#888', fontSize: '0.9rem' }}>
                    {side === 'buy' ? '預估買進' : '預估賣出'}: <span style={{ color: '#fff', fontWeight: 'bold' }}>${(estimatedTotal).toLocaleString()}</span>
                </div>

                <button style={formStyles.submitBtn} onClick={() => setConfirmModal(true)}>
                    下單
                </button>
                {/* 移除底部的「返回」按鈕，因為右上角已有 X */}
            </div>
        </div>
    );
}
