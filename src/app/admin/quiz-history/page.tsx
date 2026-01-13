'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer?: number;
    explanation?: string;
}

interface QuizLog {
    _id: string;
    userId: { username: string; email: string };
    articleId: { topicName: string; category: string };
    questions: QuizQuestion[];
    score: number;
    totalQuestions: number;
    pointsEarned: number;
    completedAt: string;
}

export default function QuizHistoryPage() {
    const [logs, setLogs] = useState<QuizLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedLog, setSelectedLog] = useState<QuizLog | null>(null);
    const [activeCategory, setActiveCategory] = useState<string>('all');

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch('/api/admin/quiz-history');
            if (res.ok) {
                const data = await res.json();
                setLogs(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const getCategoryColor = (category: string) => {
        const colors: Record<string, { bg: string, text: string }> = {
            '股票基礎': { bg: '#dbeafe', text: '#1e40af' }, // Blue
            '技術分析': { bg: '#e0e7ff', text: '#3730a3' }, // Indigo
            '理財規劃': { bg: '#f3e8ff', text: '#6b21a8' }, // Purple
            'ETF投資': { bg: '#ffedd5', text: '#9a3412' }, // Orange
            '基金投資': { bg: '#d1fae5', text: '#065f46' }, // Green
        };
        return colors[category] || { bg: '#f3f4f6', text: '#374151' }; // Default Gray
    };

    const uniqueCategories = Array.from(new Set(logs.map(log => log.articleId?.category).filter(Boolean)));

    const displayedLogs = logs.filter(log => {
        const matchesSearch =
            log.userId?.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            log.articleId?.topicName.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesCategory = activeCategory === 'all' || log.articleId?.category === activeCategory;

        return matchesSearch && matchesCategory;
    });

    if (loading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>歷史總答題記錄</h1>
                <input
                    type="text"
                    placeholder="搜尋玩家或題目..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc', width: '300px' }}
                />
            </div>

            {/* Category Tabs */}
            <div className={styles.tabs} style={{ marginBottom: '1.5rem', borderBottom: '1px solid #eee', display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                <button
                    className={`${styles.tab} ${activeCategory === 'all' ? styles.active : ''}`}
                    onClick={() => setActiveCategory('all')}
                    style={{
                        padding: '0.5rem 1rem',
                        border: 'none',
                        background: 'none',
                        borderBottom: activeCategory === 'all' ? '2px solid #3b82f6' : '2px solid transparent',
                        color: activeCategory === 'all' ? '#3b82f6' : '#6b7280',
                        fontWeight: 600,
                        cursor: 'pointer'
                    }}
                >
                    全部 ({logs.length})
                </button>
                {uniqueCategories.map(cat => (
                    <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        style={{
                            padding: '0.5rem 1rem',
                            border: 'none',
                            background: 'none',
                            borderBottom: activeCategory === cat ? '2px solid #3b82f6' : '2px solid transparent',
                            color: activeCategory === cat ? '#3b82f6' : '#6b7280',
                            fontWeight: 600,
                            cursor: 'pointer',
                            whiteSpace: 'nowrap'
                        }}
                    >
                        {cat} ({logs.filter(l => l.articleId?.category === cat).length})
                    </button>
                ))}
            </div>

            {/* Main Table: Quiz Sessions */}
            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>時間</th>
                            <th>答題人</th>
                            <th>文章類別</th>
                            <th>文章標題</th>
                            <th>得分 (答對/總題數)</th>
                            <th>獲得積分</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedLogs.map(log => {
                            const catStyle = getCategoryColor(log.articleId?.category);
                            return (
                                <tr key={log._id}>
                                    <td style={{ whiteSpace: 'nowrap' }}>{new Date(log.completedAt).toLocaleString()}</td>
                                    <td>{log.userId?.username || '未知用戶'}</td>
                                    <td>
                                        <span style={{
                                            backgroundColor: catStyle.bg,
                                            color: catStyle.text,
                                            padding: '4px 8px',
                                            borderRadius: '4px',
                                            fontSize: '0.9em',
                                            fontWeight: 'bold'
                                        }}>
                                            {log.articleId?.category || '未分類'}
                                        </span>
                                    </td>
                                    <td>{log.articleId?.topicName || '未知文章'}</td>
                                    <td>{log.score} / {log.totalQuestions} ({Math.round(log.score / log.totalQuestions * 100)}%)</td>
                                    <td>{log.pointsEarned}</td>
                                    <td>
                                        <button
                                            className={`${styles.actionBtn} ${styles.editBtn}`}
                                            onClick={() => setSelectedLog(log)}
                                        >
                                            查看詳情
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>

            {/* Detail Modal */}
            {selectedLog && (
                <div className={styles.modalOverlay} onClick={() => setSelectedLog(null)}>
                    <div className={styles.modalContent} style={{ width: '900px', maxWidth: '95%' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid #eee', paddingBottom: '1rem' }}>
                            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', margin: 0 }}>
                                答題詳情
                            </h2>
                            <button
                                onClick={() => setSelectedLog(null)}
                                style={{
                                    background: 'none',
                                    border: 'none',
                                    fontSize: '1.5rem',
                                    cursor: 'pointer',
                                    color: '#6b7280',
                                    padding: '0.5rem'
                                }}
                            >
                                ✕
                            </button>
                        </div>
                        <div style={{ marginBottom: '1rem', color: '#4b5563', fontSize: '1.1rem' }}>
                            <div style={{ marginBottom: '0.5rem' }}>
                                <span style={{ marginRight: '1rem' }}>👤 玩家：<strong>{selectedLog.userId?.username}</strong></span>
                                <span style={{ marginRight: '1rem' }}>
                                    文章類別 : <span style={{ color: getCategoryColor(selectedLog.articleId?.category).text, fontWeight: 'bold' }}>"{selectedLog.articleId?.category}"</span>
                                </span>
                            </div>
                            <div>
                                <span>📚 文章：<strong>{selectedLog.articleId?.topicName}</strong></span>
                            </div>
                        </div>

                        <div style={{ maxHeight: '70vh', overflowY: 'auto' }}>
                            {selectedLog.questions.map((q, qIndex) => {
                                const isCorrect = q.userAnswer === q.correctAnswer;
                                const letters = ['A', 'B', 'C', 'D'];

                                return (
                                    <div key={qIndex} style={{
                                        padding: '1.5rem',
                                        marginBottom: '1.5rem',
                                        border: `1px solid ${isCorrect ? '#10b981' : '#ef4444'}`,
                                        borderRadius: '12px',
                                        backgroundColor: '#fff',
                                        position: 'relative'
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem' }}>
                                            <span style={{ fontWeight: 600, color: '#666' }}>第 {qIndex + 1} 題</span>
                                            <span style={{
                                                backgroundColor: isCorrect ? '#d1fae5' : '#fee2e2',
                                                color: isCorrect ? '#059669' : '#b91c1c',
                                                padding: '4px 12px',
                                                borderRadius: '20px',
                                                fontSize: '0.9em',
                                                fontWeight: 'bold'
                                            }}>
                                                {isCorrect ? '✔ 正確' : '✘ 錯誤'}
                                            </span>
                                        </div>

                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 'bold', marginBottom: '1.5rem', color: '#1f2937' }}>
                                            {q.question}
                                        </h3>

                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                                            {q.options.map((opt, optIndex) => {
                                                const isThisCorrect = optIndex === q.correctAnswer;
                                                const isThisUserSelection = optIndex === q.userAnswer;
                                                let bgColor = '#f3f4f6'; // default gray
                                                let textColor = '#374151';
                                                let tag = null;

                                                if (isThisCorrect) {
                                                    bgColor = '#dcfce7'; // green
                                                    textColor = '#166534';
                                                    tag = <span style={{ float: 'right', fontSize: '0.8em', fontWeight: 'bold' }}>正確答案</span>;
                                                } else if (isThisUserSelection && !isCorrect) {
                                                    bgColor = '#fee2e2'; // red
                                                    textColor = '#991b1b';
                                                    tag = <span style={{ float: 'right', fontSize: '0.8em', fontWeight: 'bold' }}>你的答案</span>;
                                                }

                                                return (
                                                    <div key={optIndex} style={{
                                                        padding: '1rem',
                                                        borderRadius: '8px',
                                                        backgroundColor: bgColor,
                                                        color: textColor,
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        fontWeight: (isThisCorrect || isThisUserSelection) ? 600 : 400,
                                                        textDecoration: (isThisUserSelection && !isCorrect) ? 'line-through' : 'none'
                                                    }}>
                                                        <span style={{
                                                            display: 'inline-flex',
                                                            width: '24px',
                                                            height: '24px',
                                                            backgroundColor: 'rgba(0,0,0,0.1)',
                                                            borderRadius: '50%',
                                                            justifyContent: 'center',
                                                            alignItems: 'center',
                                                            marginRight: '10px',
                                                            fontSize: '0.9em'
                                                        }}>
                                                            {letters[optIndex]}
                                                        </span>
                                                        <span style={{ flex: 1 }}>{opt}</span>
                                                        {tag}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        <div style={{
                                            marginTop: '1.5rem',
                                            padding: '1rem',
                                            backgroundColor: '#f0f9ff',
                                            borderRadius: '8px',
                                            borderLeft: '4px solid #3b82f6'
                                        }}>
                                            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '0.5rem', color: '#1d4ed8', fontWeight: 'bold' }}>
                                                🤖 AI 戰情室解析
                                            </div>
                                            <p style={{ margin: 0, fontSize: '0.95em', color: '#1e3a8a', lineHeight: 1.6 }}>
                                                {q.explanation || '抱歉，此題解析暫時無法取得。'}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className={styles.modalActions}>
                            <button
                                className={`${styles.actionBtn} ${styles.editBtn}`}
                                onClick={() => setSelectedLog(null)}
                            >
                                關閉
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
