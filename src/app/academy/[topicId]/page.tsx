'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';

interface Topic {
    _id: string;
    topicName: string;
    thumbnail: string;
    category: string;
    content: string;
    videoUrl?: string;
}

// 轉換 YouTube URL 為嵌入格式
function getEmbedUrl(url: string): string {
    // 擷取影片 ID
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
        /youtube\.com\/shorts\/([^&\n?#]+)/,
    ];

    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) {
            return `https://www.youtube.com/embed/${match[1]}`;
        }
    }

    return url;
}

export default function TopicDetailPage() {
    const params = useParams();
    const topicId = params.topicId as string;
    const [topic, setTopic] = useState<Topic | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (topicId) {
            fetchTopic();
        }
    }, [topicId]);

    const fetchTopic = async () => {
        try {
            const res = await fetch(`/api/academy/topics/${topicId}`);
            const data = await res.json();
            if (data.success) {
                setTopic(data.data);
            }
        } catch (err) {
            console.error('載入失敗:', err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div style={styles.loading}>載入中...</div>;
    }

    if (!topic) {
        return <div style={styles.error}>找不到此課程</div>;
    }

    return (
        <div style={styles.container}>
            <div style={styles.header}>
                <Link href="/academy" style={styles.backLink}>
                    ← 返回課程列表
                </Link>
                <span style={styles.badge}>{topic.category}</span>
            </div>

            <div style={styles.content}>
                <div style={styles.imageWrapper}>
                    <img
                        src={topic.thumbnail || '/uploads/default-thumbnail.jpg'}
                        alt={topic.topicName}
                        style={styles.image}
                    />
                </div>

                <h1 style={styles.title}>{topic.topicName}</h1>

                {topic.videoUrl && (
                    <div style={styles.videoSection}>
                        <h2 style={styles.sectionTitle}>📺 課程影片</h2>
                        <div style={styles.videoWrapper}>
                            <iframe
                                src={getEmbedUrl(topic.videoUrl)}
                                style={styles.video}
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                            />
                        </div>
                    </div>
                )}

                <div style={styles.articleSection}>
                    <h2 style={styles.sectionTitle}>📖 課程內容</h2>
                    <div style={styles.article}>
                        {topic.content.split('\n').map((paragraph, index) => (
                            <p key={index} style={styles.paragraph}>
                                {paragraph}
                            </p>
                        ))}
                    </div>
                </div>

                <div style={styles.quizSection}>
                    <div style={styles.quizCard}>
                        <div style={styles.quizIcon}>🎯</div>
                        <h3 style={styles.quizTitle}>準備好測驗了嗎？</h3>
                        <p style={styles.quizDesc}>
                            完成測驗可獲得積分和模擬資金獎勵！
                            <br />
                            <strong>10 分 = 1,000 元模擬資金</strong>
                        </p>
                        <Link href={`/academy/${topicId}/quiz`} style={styles.quizButton}>
                            開始測驗 →
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: '#f8fafc',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        padding: '20px 40px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    backLink: {
        color: 'white',
        textDecoration: 'none',
        fontSize: '14px',
        fontWeight: '500',
    },
    badge: {
        background: 'rgba(255,255,255,0.2)',
        color: 'white',
        padding: '8px 16px',
        borderRadius: '20px',
        fontSize: '13px',
        fontWeight: '600',
    },
    content: {
        maxWidth: '900px',
        margin: '0 auto',
        padding: '40px 20px',
    },
    imageWrapper: {
        borderRadius: '20px',
        overflow: 'hidden',
        marginBottom: '30px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
    },
    image: {
        width: '100%',
        height: '400px',
        objectFit: 'cover',
    },
    title: {
        fontSize: '36px',
        fontWeight: '800',
        color: '#1a1a2e',
        margin: '0 0 30px 0',
    },
    videoSection: {
        marginBottom: '40px',
    },
    sectionTitle: {
        fontSize: '22px',
        fontWeight: '700',
        color: '#333',
        marginBottom: '20px',
    },
    videoWrapper: {
        position: 'relative',
        paddingBottom: '56.25%',
        height: 0,
        borderRadius: '16px',
        overflow: 'hidden',
        boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
    },
    video: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        border: 'none',
    },
    articleSection: {
        marginBottom: '40px',
    },
    article: {
        background: 'white',
        padding: '30px',
        borderRadius: '16px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
    },
    paragraph: {
        fontSize: '16px',
        lineHeight: '1.8',
        color: '#444',
        marginBottom: '16px',
    },
    quizSection: {
        marginTop: '50px',
    },
    quizCard: {
        background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
        borderRadius: '20px',
        padding: '40px',
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(17, 153, 142, 0.3)',
    },
    quizIcon: {
        fontSize: '48px',
        marginBottom: '16px',
    },
    quizTitle: {
        fontSize: '24px',
        fontWeight: '700',
        color: 'white',
        margin: '0 0 12px 0',
    },
    quizDesc: {
        fontSize: '16px',
        color: 'rgba(255,255,255,0.9)',
        marginBottom: '24px',
    },
    quizButton: {
        display: 'inline-block',
        background: 'white',
        color: '#11998e',
        padding: '14px 36px',
        borderRadius: '30px',
        fontSize: '16px',
        fontWeight: '700',
        textDecoration: 'none',
        boxShadow: '0 4px 15px rgba(0,0,0,0.15)',
    },
    loading: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#666',
    },
    error: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        fontSize: '18px',
        color: '#dc2626',
    },
};
