'use client';
import { useState, useEffect } from 'react';
import styles from '../admin.module.css';

interface User {
    _id: string;
    username: string;
    email: string;
    password?: string;
    role: string;
    points: number;
    simulatedBalance: number;
    createdAt: string;
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [currentUser, setCurrentUser] = useState<Partial<User>>({});
    const [isEditing, setIsEditing] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const res = await fetch('/api/admin/users');
            if (res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('確定要刪除這位村民嗎？此操作無法復原。')) return;

        const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
        if (res.ok) {
            fetchUsers();
        } else {
            alert('刪除失敗');
        }
    };

    const handleEdit = (user: User) => {
        setCurrentUser(user);
        setIsEditing(true);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setCurrentUser({
            role: '村民',
            points: 0,
            simulatedBalance: 100000
        });
        setIsEditing(false);
        setIsModalOpen(true);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const url = isEditing ? `/api/admin/users/${currentUser._id}` : '/api/admin/users';
        const method = isEditing ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(currentUser)
        });

        if (res.ok) {
            setIsModalOpen(false);
            fetchUsers();
        } else {
            const data = await res.json();
            alert(data.message || '操作失敗');
        }
    };

    // Filter and Sort Logic
    const displayedUsers = users
        .filter(user =>
            user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
            user.email.toLowerCase().includes(searchTerm.toLowerCase())
        )
        .sort((a, b) => {
            // Admin (村長) always on top
            if (a.role === 'admin') return -1;
            if (b.role === 'admin') return 1;
            // Then sort by createdAt descending
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });

    if (loading) return <div className="p-8 text-center">載入中...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>村民管理</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <input
                        type="text"
                        placeholder="搜尋暱稱或信箱..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ padding: '0.5rem', borderRadius: '4px', border: '1px solid #ccc' }}
                    />
                    <button
                        className={`${styles.actionBtn} ${styles.editBtn}`}
                        onClick={handleCreate}
                    >
                        新增村民
                    </button>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>暱稱</th>
                            <th>信箱</th>
                            <th>身分</th>
                            <th>積分</th>
                            <th>模擬資金</th>
                            <th>加入時間</th>
                            <th>操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {displayedUsers.map(user => (
                            <tr key={user._id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>{user.role === 'admin' ? '村長' : '村民'}</td>
                                <td>{user.points}</td>
                                <td>${user.simulatedBalance?.toLocaleString()}</td>
                                <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                                <td className={styles.actions}>
                                    <button
                                        className={`${styles.actionBtn} ${styles.editBtn}`}
                                        onClick={() => handleEdit(user)}
                                    >
                                        編輯
                                    </button>
                                    <button
                                        className={`${styles.actionBtn} ${styles.deleteBtn}`}
                                        onClick={() => handleDelete(user._id)}
                                    >
                                        刪除
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {isModalOpen && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalContent}>
                        <h2 className="text-xl font-bold mb-4">{isEditing ? '編輯村民' : '新增村民'}</h2>
                        <form onSubmit={handleSubmit}>
                            <div className={styles.formGroup}>
                                <label>暱稱</label>
                                <input
                                    type="text"
                                    required
                                    value={currentUser.username || ''}
                                    onChange={e => setCurrentUser({ ...currentUser, username: e.target.value })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>信箱</label>
                                <input
                                    type="email"
                                    required
                                    value={currentUser.email || ''}
                                    onChange={e => setCurrentUser({ ...currentUser, email: e.target.value })}
                                />
                            </div>
                            {!isEditing && (
                                <div className={styles.formGroup}>
                                    <label>密碼</label>
                                    <input
                                        type="password"
                                        required
                                        onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                                    />
                                </div>
                            )}
                            {isEditing && (
                                <div className={styles.formGroup}>
                                    <label>重設密碼 (若不修改請留空)</label>
                                    <input
                                        type="password"
                                        onChange={e => setCurrentUser({ ...currentUser, password: e.target.value })}
                                    />
                                </div>
                            )}
                            <div className={styles.formGroup}>
                                <label>身分</label>
                                <select
                                    value={currentUser.role || '村民'}
                                    onChange={e => setCurrentUser({ ...currentUser, role: e.target.value })}
                                >
                                    <option value="村民">村民</option>
                                    <option value="admin">Admin (村長)</option>
                                </select>
                            </div>
                            <div className={styles.formGroup}>
                                <label>積分</label>
                                <input
                                    type="number"
                                    value={currentUser.points || 0}
                                    onChange={e => setCurrentUser({ ...currentUser, points: Number(e.target.value) })}
                                />
                            </div>
                            <div className={styles.formGroup}>
                                <label>模擬資金</label>
                                <input
                                    type="number"
                                    value={currentUser.simulatedBalance || 0}
                                    onChange={e => setCurrentUser({ ...currentUser, simulatedBalance: Number(e.target.value) })}
                                />
                            </div>
                            <div className={styles.modalActions}>
                                <button
                                    type="button"
                                    className="px-4 py-2 border rounded"
                                    onClick={() => setIsModalOpen(false)}
                                >
                                    取消
                                </button>
                                <button
                                    type="submit"
                                    className={`${styles.actionBtn} ${styles.editBtn}`}
                                >
                                    儲存
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
