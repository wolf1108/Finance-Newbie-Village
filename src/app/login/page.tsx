'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function Login() {
    const router = useRouter();
    const [redirect, setRedirect] = useState('/');
    const [formData, setFormData] = useState({
        identifier: '',
        password: ''
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        // 在客戶端讀取 URL 參數
        const params = new URLSearchParams(window.location.search);
        const redirectParam = params.get('redirect');
        if (redirectParam) {
            setRedirect(redirectParam);
        }
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await res.json();

            if (res.ok) {
                // Success Alert
                if (data.user?.role === 'admin') {
                    alert('歡迎村長回村');
                } else {
                    alert(`歡迎${data.user?.username}回村`);
                }
                // 重定向到原本想訪問的頁面
                window.location.href = redirect;
            } else {
                setError(data.message || '登入失敗');
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.card}>
                <h1 className={styles.title}>登入</h1>
                {error && <div className={styles.error}>{error}</div>}
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="identifier">帳號或信箱</label>
                        <input
                            type="text"
                            id="identifier"
                            value={formData.identifier}
                            onChange={(e) => setFormData({ ...formData, identifier: e.target.value })}
                            required
                            className={styles.input}
                        />
                    </div>
                    <div className={styles.formGroup}>
                        <label htmlFor="password">密碼</label>
                        <input
                            type="password"
                            id="password"
                            value={formData.password}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            required
                            className={styles.input}
                        />
                        <div style={{ textAlign: 'right', marginTop: '0.5rem' }}>
                            <Link href="/forgot-password" className={styles.link} style={{ fontSize: '0.875rem' }}>
                                忘記密碼？
                            </Link>
                        </div>
                    </div>
                    <button type="submit" disabled={loading} className={styles.button}>
                        {loading ? '登入中...' : '登入'}
                    </button>
                </form>
                <p className={styles.footer}>
                    還沒有帳號？ <Link href="/register" className={styles.link}>註冊</Link>
                </p>
            </div>
        </div>
    );
}
