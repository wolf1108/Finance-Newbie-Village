'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface Feedback {
    _id: string;
    name: string;
    email: string;
    message: string;
    status: 'pending' | 'processed';
    createdAt: string;
}

export default function AdminFeedbacksPage() {
    const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'processed'>('pending');

    useEffect(() => {
        fetchFeedbacks();
    }, []);

    const fetchFeedbacks = async () => {
        try {
            const res = await fetch('/api/admin/feedbacks');
            if (res.ok) {
                const data = await res.json();
                setFeedbacks(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async (feedback: Feedback) => {
        const newStatus = feedback.status === 'pending' ? 'processed' : 'pending';

        const res = await fetch(`/api/admin/feedbacks/${feedback._id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: newStatus })
        });

        if (res.ok) {
            fetchFeedbacks();
        } else {
            alert('更新失敗');
        }
    };

    const filteredFeedbacks = feedbacks
        .filter(item => item.status === activeTab)
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (loading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>意見箱</h1>
            </div>

            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'pending' ? styles.active : ''}`}
                    onClick={() => setActiveTab('pending')}
                >
                    處理中 ({feedbacks.filter(f => f.status === 'pending').length})
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'processed' ? styles.active : ''}`}
                    onClick={() => setActiveTab('processed')}
                >
                    已處理 ({feedbacks.filter(f => f.status === 'processed').length})
                </button>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>狀態</th>
                            <th>姓名</th>
                            <th>信箱</th>
                            <th>內容</th>
                            <th>時間</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredFeedbacks.map(item => (
                            <tr key={item._id}>
                                <td>
                                    <span className={item.status === 'processed' ? styles.statusProcessed : styles.statusPending}>
                                        {item.status === 'processed' ? '已處理' : '處理中'}
                                    </span>
                                </td>
                                <td>{item.name}</td>
                                <td>{item.email}</td>
                                <td style={{ maxWidth: '400px' }}>{item.message}</td>
                                <td>{new Date(item.createdAt).toLocaleString()}</td>
                                <td>
                                    <button
                                        className={`${styles.actionBtn} ${item.status === 'pending' ? styles.editBtn : styles.deleteBtn}`}
                                        style={{ backgroundColor: item.status === 'pending' ? '#10b981' : '#f59e0b' }}
                                        onClick={() => toggleStatus(item)}
                                    >
                                        {item.status === 'pending' ? '標示為已處理' : '標示為未處理'}
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
