'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import styles from '../auth.module.css';

export default function ForgotPassword() {
    const router = useRouter();
    const [step, setStep] = useState<1 | 2>(1);

    // Step 1 Data
    const [identity, setIdentity] = useState({
        username: '',
        email: ''
    });

    // Step 2 Data
    const [passwords, setPasswords] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    // Verify Identity
    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(identity)
            });

            if (res.ok) {
                setStep(2);
            } else {
                const data = await res.json();
                setError(data.message || '驗證失敗');
            }
        } catch (err) {
            setError('發生錯誤，請稍後再試');
        } finally {
            setLoading(false);
        }
    };

    // Reset Password
    const handleReset = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('兩次密碼輸入不一致');
            return;
        }

        setLoading(true);

        try {
            const res = await fetch('/api/auth/reset-password', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username: identity.username,
                    email: identity.email,
                    newPassword: passwords.newPassword
                })
            });

            if (res.ok) {
                alert('密碼重設成功！請重新登入。');
                router.push('/login');
            } else {
                const data = await res.json();
                setError(data.message || '重設失敗');
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
                <h1 className={styles.title}>重設密碼</h1>
                {error && <div className={styles.error}>{error}</div>}

                {step === 1 ? (
                    <form onSubmit={handleVerify}>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>暱稱 (Username)</label>
                            <input
                                type="text"
                                required
                                className={styles.input}
                                value={identity.username}
                                onChange={e => setIdentity({ ...identity, username: e.target.value })}
                                placeholder="請輸入當初註冊的暱稱"
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>電子信箱 (Email)</label>
                            <input
                                type="email"
                                required
                                className={styles.input}
                                value={identity.email}
                                onChange={e => setIdentity({ ...identity, email: e.target.value })}
                                placeholder="請輸入當初註冊的信箱"
                            />
                        </div>
                        <button type="submit" disabled={loading} className={styles.button}>
                            {loading ? '驗證中...' : '下一步'}
                        </button>
                    </form>
                ) : (
                    <form onSubmit={handleReset}>
                        <div className={styles.description}>
                            請為 {identity.username} 設定新的密碼
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>新密碼</label>
                            <input
                                type="password"
                                required
                                className={styles.input}
                                value={passwords.newPassword}
                                onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })}
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label}>確認新密碼</label>
                            <input
                                type="password"
                                required
                                className={styles.input}
                                value={passwords.confirmPassword}
                                onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            />
                        </div>
                        <button type="submit" disabled={loading} className={styles.button}>
                            {loading ? '處理中...' : '確認重設'}
                        </button>
                    </form>
                )}

                <div className={styles.footer}>
                    想起密碼了嗎？ <Link href="/login" className={styles.link}>回到登入</Link>
                </div>
            </div>
        </div>
    );
}
