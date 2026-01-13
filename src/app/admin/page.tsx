'use client';

import Link from 'next/link';

export default function AdminPage() {
    return (
        <div style={styles.container}>
            <header style={styles.header}>
                <h1 style={styles.title}>⚙️ 管理後台</h1>
                <p style={styles.subtitle}>Finance Rookie Village 後台管理系統</p>
            </header>

            <div style={styles.grid}>
                <Link href="/admin/topics" style={styles.card}>
                    <span style={styles.cardIcon}>📚</span>
                    <h3 style={styles.cardTitle}>主題管理</h3>
                    <p style={styles.cardDesc}>管理小學堂的課程主題，包含新增、編輯、刪除主題</p>
                </Link>

                <div style={{ ...styles.card, opacity: 0.5 }}>
                    <span style={styles.cardIcon}>👥</span>
                    <h3 style={styles.cardTitle}>使用者管理</h3>
                    <p style={styles.cardDesc}>管理使用者帳號與權限 (開發中)</p>
                </div>

                <div style={{ ...styles.card, opacity: 0.5 }}>
                    <span style={styles.cardIcon}>📊</span>
                    <h3 style={styles.cardTitle}>數據統計</h3>
                    <p style={styles.cardDesc}>查看學習數據與測驗統計 (開發中)</p>
                </div>
            </div>
        </div>
    );
}

const styles: { [key: string]: React.CSSProperties } = {
    container: {
        minHeight: '100vh',
        background: '#f8fafc',
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    },
    header: {
        textAlign: 'center',
        marginBottom: '50px',
    },
    title: {
        fontSize: '36px',
        fontWeight: '800',
        color: '#1a1a2e',
        margin: '0 0 12px 0',
    },
    subtitle: {
        fontSize: '16px',
        color: '#64748b',
        margin: 0,
    },
    grid: {
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: '24px',
        maxWidth: '900px',
        margin: '0 auto',
    },
    card: {
        background: 'white',
        borderRadius: '20px',
        padding: '30px',
        textDecoration: 'none',
        color: 'inherit',
        boxShadow: '0 4px 20px rgba(0,0,0,0.06)',
        transition: 'transform 0.3s ease, box-shadow 0.3s ease',
        cursor: 'pointer',
    },
    cardIcon: {
        fontSize: '40px',
        display: 'block',
        marginBottom: '16px',
    },
    cardTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: '#1a1a2e',
        margin: '0 0 8px 0',
    },
    cardDesc: {
        fontSize: '14px',
        color: '#64748b',
        margin: 0,
        lineHeight: '1.6',
    },
};
