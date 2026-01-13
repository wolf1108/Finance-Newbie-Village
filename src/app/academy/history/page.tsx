'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface QuizQuestion {
    question: string;
    options: string[];
    correctAnswer: number;
    userAnswer: number;
    explanation?: string;
}

interface QuizHistory {
    _id: string;
    articleId: string;
    topicName: string;
    thumbnailUrl: string;
    score: number;
    totalQuestions: number;
    pointsEarned: number;
    balanceAdded: number;
    completedAt: string;
    questions: QuizQuestion[];
}

export default function HistoryPage() {
    const [history, setHistory] = useState<QuizHistory[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // 模擬使用者 ID
    const mockUserId = '507f1f77bcf86cd799439011';

    useEffect(() => {
        fetchHistory();
    }, []);

    const fetchHistory = async () => {
        try {
            const res = await fetch(`/api/academy/history?userId=${mockUserId}`);
            const data = await res.json();
            if (data.success) {
                setHistory(data.data);
            } else {
                setError(data.error || '載入失敗');
            }
        } catch (err) {
            setError('載入歷史紀錄失敗');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const toggleExpand = (id: string) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) {
        return (
            <div style={styles.loadingContainer}>
                <div style={styles.spinner} />
                <p>載入中...</p>
                <style>{`
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                    .spinner {
                        width: 40px;
                        height: 40px;
                        border: 3px solid rgba(255,255,255,0.1);
                        border-top-color: #667eea;
                        border-radius: 50%;
                        animation: spin 1s linear infinite;
                        margin-bottom: 16px;
                    }
                `}</style>
                <div className="spinner" />
            </div>
        );
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link href="/academy" style={styles.backButton}>
                    ← 返回課程列表
                </Link>
                <h1 style={styles.title}>📚 歷史作答紀錄</h1>
                <p style={styles.subtitle}>
                    共 {history.length} 筆測驗紀錄
                </p>
            </div>

            {error && (
                <div style={styles.errorBox}>
                    {error}
                </div>
            )}

            {history.length === 0 && !error && (
                <div style={styles.emptyState}>
                    <div style={styles.emptyIcon}>📝</div>
                    <h2>尚無作答紀錄</h2>
                    <p>完成課程測驗後，紀錄會顯示在這裡</p>
                    <Link href="/academy" style={styles.startButton}>
                        開始學習
                    </Link>
                </div>
            )}

            <div style={styles.historyList}>
                {history.map((item) => (
                    <div key={item._id} style={styles.historyCard}>
                        <div style={styles.cardHeader}>
                            {item.thumbnailUrl && (
                                <img
                                    src={item.thumbnailUrl}
                                    alt={item.topicName}
                                    style={styles.thumbnail}
                                />
                            )}
                            <div style={styles.cardInfo}>
                                <h3 style={styles.topicName}>{item.topicName}</h3>
                                <p style={styles.dateText}>
                                    {formatDate(item.completedAt)}
                                </p>
                            </div>
                            <div style={styles.scoreSection}>
                                <div style={{
                                    ...styles.scoreBadge,
                                    background: item.score === item.totalQuestions
                                        ? 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)'
                                        : item.score >= item.totalQuestions * 0.6
                                            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                                            : 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                                }}>
                                    {item.score}/{item.totalQuestions}
                                </div>
                                <p style={styles.scoreLabel}>
                                    {item.score === item.totalQuestions ? '滿分!' :
                                        item.score >= item.totalQuestions * 0.6 ? '及格' : '需複習'}
                                </p>
                            </div>
                        </div>

                        <div style={styles.rewardsRow}>
                            <span style={styles.rewardTag}>
                                ⭐ +{item.pointsEarned} 積分
                            </span>
                            <span style={styles.rewardTag}>
                                💰 +${item.balanceAdded.toLocaleString()}
                            </span>
                        </div>

                        <button
                            onClick={() => toggleExpand(item._id)}
                            style={styles.expandButton}
                        >
                            {expandedId === item._id ? '收起詳情 ▲' : '查看詳情 ▼'}
                        </button>

                        {expandedId === item._id && (
                            <div style={styles.questionsSection}>
                                {item.questions.map((q, idx) => {
                                    const isCorrect = q.userAnswer === q.correctAnswer;
                                    return (
                                        <div
                                            key={idx}
                                            style={{
                                                ...styles.questionItem,
                                                ...(isCorrect ? styles.questionCorrect : styles.questionWrong),
                                            }}
                                        >
                                            <div style={styles.questionHeader}>
                                                <span style={styles.questionIndex}>
                                                    第 {idx + 1} 題
                                                </span>
                                                <span style={isCorrect ? styles.correctBadge : styles.wrongBadge}>
                                                    {isCorrect ? '✓ 正確' : '✗ 錯誤'}
                                                </span>
                                            </div>
                                            <p style={styles.questionText}>{q.question}</p>
                                            <div style={styles.optionsList}>
                                                {q.options.map((opt, optIdx) => (
                                                    <div
                                                        key={optIdx}
                                                        style={{
                                                            ...styles.optionItem,
                                                            ...(optIdx === q.correctAnswer ? styles.optionCorrect : {}),
                                                            ...(optIdx === q.userAnswer && !isCorrect ? styles.optionWrong : {}),
                                                        }}
                                                    >
                                                        <span style={styles.optionLetter}>
                                                            {String.fromCharCode(65 + optIdx)}
                                                        </span>
                                                        {opt}
                                                        {optIdx === q.correctAnswer && (
                                                            <span style={styles.answerLabel}>正確答案</span>
                                                        )}
                                                        {optIdx === q.userAnswer && optIdx !== q.correctAnswer && (
                                                            <span style={styles.yourLabel}>你的答案</span>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            {!isCorrect && q.explanation && (
                                                <div style={styles.explanationBox}>
                                                    <div style={styles.explanationHeader}>💡 AI 解析</div>
                                                    <p style={styles.explanationText}>{q.explanation}</p>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        padding: '30px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    loadingContainer: {
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
    },
    spinner: {
        width: '40px',
        height: '40px',
        border: '3px solid rgba(255,255,255,0.1)',
        borderTopColor: '#667eea',
        borderRadius: '50%',
        marginBottom: '16px',
    },
    header: {
        maxWidth: '900px',
        margin: '0 auto 30px',
    },
    backButton: {
        display: 'inline-block',
        color: 'rgba(255,255,255,0.7)',
        textDecoration: 'none',
        fontSize: '14px',
        marginBottom: '16px',
    },
    title: {
        fontSize: '32px',
        fontWeight: '800',
        color: 'white',
        margin: '0 0 8px 0',
    },
    subtitle: {
        fontSize: '16px',
        color: 'rgba(255,255,255,0.6)',
        margin: 0,
    },
    errorBox: {
        maxWidth: '900px',
        margin: '0 auto 20px',
        padding: '16px',
        background: 'rgba(239, 68, 68, 0.2)',
        borderRadius: '12px',
        color: '#ef4444',
        textAlign: 'center',
    },
    emptyState: {
        maxWidth: '400px',
        margin: '100px auto',
        textAlign: 'center',
        color: 'white',
    },
    emptyIcon: {
        fontSize: '64px',
        marginBottom: '16px',
    },
    startButton: {
        display: 'inline-block',
        marginTop: '20px',
        padding: '14px 32px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '30px',
        textDecoration: 'none',
        fontWeight: '600',
    },
    historyList: {
        maxWidth: '900px',
        margin: '0 auto',
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
    },
    historyCard: {
        background: 'white',
        borderRadius: '20px',
        padding: '24px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    },
    cardHeader: {
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        marginBottom: '16px',
    },
    thumbnail: {
        width: '80px',
        height: '45px',
        objectFit: 'cover',
        borderRadius: '8px',
    },
    cardInfo: {
        flex: 1,
    },
    topicName: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '0 0 4px 0',
    },
    dateText: {
        fontSize: '13px',
        color: '#64748b',
        margin: 0,
    },
    scoreSection: {
        textAlign: 'center',
    },
    scoreBadge: {
        padding: '10px 20px',
        borderRadius: '30px',
        color: 'white',
        fontSize: '18px',
        fontWeight: '800',
    },
    scoreLabel: {
        fontSize: '12px',
        color: '#64748b',
        marginTop: '4px',
    },
    rewardsRow: {
        display: 'flex',
        gap: '12px',
        marginBottom: '16px',
    },
    rewardTag: {
        fontSize: '13px',
        padding: '6px 12px',
        background: '#f8fafc',
        borderRadius: '20px',
        color: '#475569',
    },
    expandButton: {
        width: '100%',
        padding: '12px',
        background: 'transparent',
        border: '2px solid #e2e8f0',
        borderRadius: '10px',
        fontSize: '14px',
        fontWeight: '600',
        color: '#64748b',
        cursor: 'pointer',
    },
    questionsSection: {
        marginTop: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
    },
    questionItem: {
        padding: '16px',
        borderRadius: '12px',
        borderWidth: '2px',
        borderStyle: 'solid',
    },
    questionCorrect: {
        background: '#f0fdf4',
        borderColor: '#22c55e',
    },
    questionWrong: {
        background: '#fef2f2',
        borderColor: '#ef4444',
    },
    questionHeader: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '8px',
    },
    questionIndex: {
        fontSize: '12px',
        fontWeight: '600',
        color: '#64748b',
    },
    correctBadge: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#22c55e',
        background: 'rgba(34, 197, 94, 0.1)',
        padding: '4px 10px',
        borderRadius: '20px',
    },
    wrongBadge: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#ef4444',
        background: 'rgba(239, 68, 68, 0.1)',
        padding: '4px 10px',
        borderRadius: '20px',
    },
    questionText: {
        fontSize: '14px',
        fontWeight: '600',
        color: '#1a1a2e',
        marginBottom: '12px',
        lineHeight: '1.5',
    },
    optionsList: {
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
    },
    optionItem: {
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        fontSize: '13px',
        color: '#475569',
        padding: '8px 12px',
        borderRadius: '8px',
        background: 'rgba(0,0,0,0.02)',
    },
    optionCorrect: {
        background: 'rgba(34, 197, 94, 0.15)',
        color: '#166534',
        fontWeight: '600',
    },
    optionWrong: {
        background: 'rgba(239, 68, 68, 0.15)',
        color: '#dc2626',
        textDecoration: 'line-through',
    },
    optionLetter: {
        width: '20px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.05)',
        borderRadius: '50%',
        fontSize: '11px',
        fontWeight: '700',
    },
    answerLabel: {
        marginLeft: 'auto',
        fontSize: '11px',
        fontWeight: '600',
        color: '#22c55e',
    },
    yourLabel: {
        marginLeft: 'auto',
        fontSize: '11px',
        fontWeight: '600',
        color: '#ef4444',
    },
    explanationBox: {
        marginTop: '12px',
        padding: '12px',
        background: 'rgba(102, 126, 234, 0.1)',
        borderRadius: '8px',
        borderLeft: '3px solid #667eea',
    },
    explanationHeader: {
        fontSize: '12px',
        fontWeight: '700',
        color: '#667eea',
        marginBottom: '6px',
    },
    explanationText: {
        fontSize: '13px',
        color: '#475569',
        lineHeight: '1.6',
        margin: 0,
    },
};
