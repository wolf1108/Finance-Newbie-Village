'use client';

import { useEffect, useState } from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import styles from './AdminDashboard.module.css';

interface DashboardStats {
    cards: {
        totalUsers: number;
        todayRegistrations: number;
        totalQuizzes: number;
        todayQuizzes: number;
    };
    charts: {
        dailyRegistrations: Array<{ date: string; count: number }>;
        categoryStats: Array<{ category: string; count: number }>;
    };
}

export default function AdminDashboard() {
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await fetch('/api/admin/dashboard-stats');
                if (res.ok) {
                    const data = await res.json();
                    setStats(data);
                }
            } catch (error) {
                console.error('Failed to fetch dashboard stats:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchStats();
    }, []);

    if (loading) {
        return (
            <div className={styles.loading}>
                <div className={styles.spinner}></div>
                <p>載入統計資料中...</p>
            </div>
        );
    }

    if (!stats) {
        return <div className={styles.error}>無法載入統計資料</div>;
    }

    return (
        <div className={styles.dashboard}>
            <h1 className={styles.title}>村長儀表板</h1>

            {/* 統計卡片區 */}
            <div className={styles.cardsGrid}>
                <div className={styles.card}>
                    <div className={styles.cardIcon}>👥</div>
                    <div className={styles.cardContent}>
                        <h3>總使用者數</h3>
                        <p className={styles.cardValue}>{stats.cards.totalUsers}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>✨</div>
                    <div className={styles.cardContent}>
                        <h3>今日註冊人數</h3>
                        <p className={styles.cardValue}>{stats.cards.todayRegistrations}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>📝</div>
                    <div className={styles.cardContent}>
                        <h3>答題總數</h3>
                        <p className={styles.cardValue}>{stats.cards.totalQuizzes}</p>
                    </div>
                </div>

                <div className={styles.card}>
                    <div className={styles.cardIcon}>🎯</div>
                    <div className={styles.cardContent}>
                        <h3>今日答題總數</h3>
                        <p className={styles.cardValue}>{stats.cards.todayQuizzes}</p>
                    </div>
                </div>
            </div>

            {/* 圖表區 */}
            <div className={styles.chartsGrid}>
                {/* 折線圖：每日新進使用者 */}
                <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>每日新進使用者趨勢</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <LineChart data={stats.charts.dailyRegistrations}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                dataKey="date"
                                stroke="#64748b"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                stroke="#64748b"
                                tick={{ fontSize: 12 }}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Line
                                type="monotone"
                                dataKey="count"
                                name="新進使用者"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ fill: '#3b82f6', r: 4 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>

                {/* 橫向長條圖：各分類測驗次數 */}
                <div className={styles.chartCard}>
                    <h2 className={styles.chartTitle}>各文章分類測驗次數</h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart
                            data={stats.charts.categoryStats}
                            layout="vertical"
                            margin={{ left: 80 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                            <XAxis
                                type="number"
                                stroke="#64748b"
                                tick={{ fontSize: 12 }}
                            />
                            <YAxis
                                type="category"
                                dataKey="category"
                                stroke="#64748b"
                                tick={{ fontSize: 12 }}
                                width={70}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: 'white',
                                    border: '1px solid #e5e7eb',
                                    borderRadius: '8px'
                                }}
                            />
                            <Legend />
                            <Bar
                                dataKey="count"
                                name="測驗次數"
                                fill="#3b82f6"
                                radius={[0, 8, 8, 0]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>
        </div>
    );
}
