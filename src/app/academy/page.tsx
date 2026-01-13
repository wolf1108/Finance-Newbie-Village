'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

interface Topic {
    _id: string;
    topicName: string;
    thumbnail: string;
    category: string;
    progress?: {
        bestScore: number;
        quizCount: number;
        lastQuizAt: string;
    };
}

export default function AcademyPage() {
    const [topics, setTopics] = useState<Topic[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedCategory, setSelectedCategory] = useState<string>('all');

    useEffect(() => {
        fetchTopics();
    }, []);

    const mockUserId = '507f1f77bcf86cd799439011';

    const fetchTopics = async () => {
        try {
            const res = await fetch(`/api/academy/topics?userId=${mockUserId}`);
            const data = await res.json();
            if (data.success) {
                setTopics(data.data);
            }
        } catch (err) {
            console.error('載入失敗:', err);
        } finally {
            setLoading(false);
        }
    };

    const categories = ['all', ...new Set(topics.map((t) => t.category))];
    const filteredTopics =
        selectedCategory === 'all'
            ? topics
            : topics.filter((t) => t.category === selectedCategory);

    return (
        <div style={styles.container}>
            <div style={styles.hero}>
                <h1 style={styles.heroTitle}>🎓 小學堂</h1>
                <p style={styles.heroSubtitle}>
                    學習金融知識，完成測驗賺取模擬資金！
                </p>
                <Link href="/academy/history" style={styles.historyLink}>
                    📚 查看歷史作答紀錄
                </Link>
            </div>

            <div style={styles.categories}>
                {categories.map((cat) => (
                    <button
                        key={cat}
                        onClick={() => setSelectedCategory(cat)}
                        style={{
                            ...styles.categoryButton,
                            ...(selectedCategory === cat ? styles.categoryButtonActive : {}),
                        }}
                    >
                        {cat === 'all' ? '全部' : cat}
                    </button>
                ))}
            </div>

            {loading ? (
                <div style={styles.loading}>載入中...</div>
            ) : (
                <div style={styles.grid}>
                    {filteredTopics.map((topic) => (
                        <Link
                            key={topic._id}
                            href={`/academy/${topic._id}`}
                            style={styles.card}
                        >
                            <div style={styles.cardImageWrapper}>
                                <img
                                    src={topic.thumbnail || '/uploads/default-thumbnail.jpg'}
                                    alt={topic.topicName}
                                    style={styles.cardImage}
                                />
                                <span style={styles.cardBadge}>{topic.category}</span>
                            </div>
                            <div style={styles.cardContent}>
                                <h3 style={styles.cardTitle}>{topic.topicName}</h3>
                                <div style={styles.cardFooter}>
                                    <span style={styles.cardAction}>開始學習 →</span>
                                </div>
                                {topic.progress && (
                                    <div style={styles.progressFooter}>
                                        <div style={styles.progressInfo}>
                                            <span style={{
                                                ...styles.statusBadge,
                                                background: topic.progress.bestScore >= 80 ? '#f0fdf4' : '#fff7ed',
                                                color: topic.progress.bestScore >= 80 ? '#166534' : '#c2410c',
                                            }}>
                                                {topic.progress.bestScore >= 80 ? '✅ 已通過' : '📖 需複習'}
                                            </span>
                                            <span style={styles.scoreText}>
                                                最佳: {topic.progress.bestScore}分
                                            </span>
                                        </div>
                                    </div>
                                )}
                                {!topic.progress && (
                                    <div style={styles.progressFooter}>
                                        <span style={{ ...styles.statusBadge, background: '#f1f5f9', color: '#64748b' }}>
                                            🆕 尚未學習
                                        </span>
                                    </div>
                                )}
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {!loading && filteredTopics.length === 0 && (
                <div style={styles.empty}>目前沒有相關課程</div>
            )}
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    hero: {
        textAlign: 'center',
        marginBottom: '40px',
    },
    heroTitle: {
        fontSize: '48px',
        fontWeight: '800',
        color: 'white',
        margin: '0 0 16px 0',
        textShadow: '0 4px 20px rgba(0,0,0,0.2)',
    },
    heroSubtitle: {
        fontSize: '20px',
        color: 'rgba(255,255,255,0.9)',
        margin: '0 0 20px 0',
    },
    historyLink: {
        display: 'inline-block',
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '30px',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '600',
        backdropFilter: 'blur(10px)',
        transition: 'all 0.3s ease',
    },
    categories: {
        display: 'flex',
        justifyContent: 'center',
        gap: '12px',
        marginBottom: '40px',
        flexWrap: 'wrap',
    },
    categoryButton: {
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        border: '2px solid rgba(255,255,255,0.3)',
        padding: '10px 24px',
        borderRadius: '30px',
        fontSize: '14px',
        fontWeight: '600',
        cursor: 'pointer',
        transition: 'all 0.3s ease',
        backdropFilter: 'blur(10px)',
    },
    categoryButtonActive: {
        background: 'white',
        color: '#764ba2',
        border: '2px solid white',
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '24px',
        maxWidth: '1200px',
        margin: '0 auto',
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
    },
    cardImageWrapper: {
        position: 'relative',
        height: '180px',
        overflow: 'hidden',
    },
    cardImage: {
        width: '100%',
        height: '100%',
        objectFit: 'cover',
    },
    cardBadge: {
        position: 'absolute',
        top: '12px',
        left: '12px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '6px 14px',
        borderRadius: '20px',
        fontSize: '12px',
        fontWeight: '600',
    },
    cardContent: {
        padding: '20px',
    },
    cardTitle: {
        fontSize: '18px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '0 0 16px 0',
    },
    cardFooter: {
        marginTop: 'auto',
        paddingTop: '12px',
        borderTop: '1px solid #e2e8f0',
        display: 'flex',
        justifyContent: 'flex-end',
    },
    progressFooter: {
        marginTop: '8px',
        paddingTop: '8px',
        borderTop: '1px solid #f1f5f9',
    },
    progressInfo: {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    statusBadge: {
        fontSize: '11px',
        fontWeight: '600',
        padding: '2px 8px',
        borderRadius: '12px',
    },
    scoreText: {
        fontSize: '11px',
        color: '#64748b',
        fontWeight: '500',
    },
    cardAction: {
        fontSize: '14px',
        color: '#4f46e5',
        fontWeight: '600',
    },
    loading: {
        textAlign: 'center',
        padding: '60px',
        color: 'rgba(255,255,255,0.8)',
        fontSize: '18px',
    },
    empty: {
        textAlign: 'center' as const,
        padding: '40px',
        color: '#64748b',
        fontSize: '16px',
    },
};
