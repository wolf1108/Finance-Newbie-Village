'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Tooltip } from 'recharts';
import styles from './profile.module.css';

interface UserProfile {
    username: string;
    email: string;
    points: number;
    simulatedBalance: number;
}

interface CategoryScore {
    category: string;
    avgScore: number;
    quizCount: number;
}

export default function ProfilePage() {
    const router = useRouter();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [categoryScores, setCategoryScores] = useState<CategoryScore[]>([]);
    const [aiAnalysis, setAiAnalysis] = useState<string>('');
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
    });
    const [showPasswordSection, setShowPasswordSection] = useState(false);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    useEffect(() => {
        fetchProfile();
        fetchLearningData();
    }, []);

    const fetchProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setProfile(data.user);
                setFormData(prev => ({
                    ...prev,
                    username: data.user.username,
                    email: data.user.email
                }));
            } else {
                router.push('/login');
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchLearningData = async (regenerate = false) => {
        try {
            const url = regenerate
                ? '/api/user/learning-stats?regenerate=true'
                : '/api/user/learning-stats';
            const res = await fetch(url);
            if (res.ok) {
                const data = await res.json();
                setCategoryScores(data.categoryScores);
                setAiAnalysis(data.aiAnalysis);
            }
        } catch (error) {
            console.error('Failed to fetch learning data:', error);
        }
    };

    const handleRegenerate = async () => {
        setRegenerating(true);
        setAiAnalysis('正在重新生成分析...');
        await fetchLearningData(true);
        setRegenerating(false);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage({ type: '', text: '' });

        if (showPasswordSection && formData.newPassword && formData.newPassword !== formData.confirmPassword) {
            setMessage({ type: 'error', text: '新密碼與確認密碼不符' });
            return;
        }

        setSaving(true);

        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: formData.username,
                    email: formData.email,
                    currentPassword: showPasswordSection ? formData.currentPassword : undefined,
                    newPassword: showPasswordSection ? formData.newPassword : undefined
                })
            });

            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: '修改成功！' });
                setProfile(prev => prev ? { ...prev, username: formData.username, email: formData.email } : null);
                setFormData(prev => ({
                    ...prev,
                    currentPassword: '',
                    newPassword: '',
                    confirmPassword: ''
                }));
                setShowPasswordSection(false);
            } else {
                setMessage({ type: 'error', text: data.error || '修改失敗' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: '發生錯誤，請稍後再試' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>載入中...</p>
            </div>
        );
    }

    // 準備雷達圖資料
    const radarData = categoryScores.map(item => ({
        category: item.category,
        score: item.avgScore
    }));

    const hasQuizData = categoryScores.length > 0;

    return (
        <div className={styles.container}>
            <div className={styles.profileCard}>
                <h1 className={styles.title}>個人資料</h1>

                {/* 積分與資產顯示 */}
                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>目前積分</span>
                        <span className={styles.statValue}>{profile?.points || 0} 分</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>總資產</span>
                        <span className={styles.statValue}>${(profile?.simulatedBalance || 0).toLocaleString()}</span>
                    </div>
                </div>

                {message.text && (
                    <div className={`${styles.message} ${styles[message.type]}`}>
                        {message.text}
                    </div>
                )}

                {/* 基本資料表單 */}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="username">使用者名稱</label>
                        <input
                            type="text"
                            id="username"
                            value={formData.username}
                            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                            required
                            className={styles.input}
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="email">電子信箱</label>
                        <input
                            type="email"
                            id="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            className={styles.input}
                        />
                    </div>

                    {/* 修改密碼按鈕 */}
                    {!showPasswordSection && (
                        <button
                            type="button"
                            onClick={() => setShowPasswordSection(true)}
                            className={styles.togglePasswordBtn}
                        >
                            修改密碼
                        </button>
                    )}

                    {/* 密碼修改區域 */}
                    {showPasswordSection && (
                        <div className={styles.passwordSection}>
                            <div className={styles.formGroup}>
                                <label htmlFor="currentPassword">目前密碼</label>
                                <input
                                    type="password"
                                    id="currentPassword"
                                    value={formData.currentPassword}
                                    onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="newPassword">新密碼</label>
                                <input
                                    type="password"
                                    id="newPassword"
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className={styles.input}
                                    placeholder="至少 6 個字元"
                                    required
                                />
                            </div>

                            <div className={styles.formGroup}>
                                <label htmlFor="confirmPassword">確認新密碼</label>
                                <input
                                    type="password"
                                    id="confirmPassword"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className={styles.input}
                                    required
                                />
                            </div>

                            <button
                                type="button"
                                onClick={() => {
                                    setShowPasswordSection(false);
                                    setFormData(prev => ({
                                        ...prev,
                                        currentPassword: '',
                                        newPassword: '',
                                        confirmPassword: ''
                                    }));
                                }}
                                className={styles.cancelBtn}
                            >
                                取消修改密碼
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        className={styles.submitBtn}
                        disabled={saving}
                    >
                        {saving ? '儲存中...' : '儲存'}
                    </button>
                </form>

                {/* 學習分析區域 */}
                <div className={styles.analysisSection}>
                    <h2 className={styles.sectionTitle}>學習分析</h2>

                    <div className={styles.analysisGrid}>
                        {/* 左側：雷達圖 */}
                        <div className={styles.radarCard}>
                            <h3>各分類測驗表現</h3>
                            {hasQuizData ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <RadarChart data={radarData}>
                                        <PolarGrid stroke="#e5e7eb" />
                                        <PolarAngleAxis
                                            dataKey="category"
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <PolarRadiusAxis
                                            angle={90}
                                            domain={[0, 100]}
                                            tick={{ fill: '#64748b', fontSize: 12 }}
                                        />
                                        <Radar
                                            name="平均分數"
                                            dataKey="score"
                                            stroke="#3b82f6"
                                            fill="#3b82f6"
                                            fillOpacity={0.6}
                                        />
                                        <Tooltip />
                                    </RadarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className={styles.noData}>
                                    <p>還未測驗</p>
                                    <Link href="/academy" className={styles.academyBtn}>
                                        前往小學堂
                                    </Link>
                                </div>
                            )}
                        </div>

                        {/* 右側：AI 分析 */}
                        <div className={styles.aiCard}>
                            <div className={styles.aiHeader}>
                                <h3>🤖 AI 學習教練分析</h3>
                                <button
                                    onClick={handleRegenerate}
                                    disabled={regenerating}
                                    className={styles.regenerateBtn}
                                >
                                    {regenerating ? '分析中...' : '🔄 重新分析'}
                                </button>
                            </div>
                            <div className={styles.aiContent}>
                                {aiAnalysis ? (
                                    <p>{aiAnalysis}</p>
                                ) : (
                                    <p className={styles.loadingText}>正在生成個人化分析...</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
