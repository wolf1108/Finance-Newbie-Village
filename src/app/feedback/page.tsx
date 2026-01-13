'use client';

import { useState, useRef, useEffect } from 'react';
import styles from './page.module.css';

export default function FeedbackPage() {
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        message: '',
    });
    const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const formRef = useRef<HTMLFormElement>(null);

    useEffect(() => {
        // Fetch current user info to pre-fill form
        fetch('/api/auth/me')
            .then(res => res.json())
            .then(data => {
                if (data.user) {
                    setFormData(prev => ({
                        ...prev,
                        name: data.user.username || '',
                        email: data.user.email || ''
                    }));
                }
            })
            .catch(() => { });
    }, []);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setStatus('loading');
        setErrorMessage('');

        try {
            const res = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.message || 'Something went wrong');
            }

            setStatus('success');
            setFormData({ name: '', email: '', message: '' });
            // Reset after 3 seconds
            setTimeout(() => setStatus('idle'), 5000);
        } catch (error: any) {
            console.error('Submission error:', error);
            setStatus('error');
            setErrorMessage(error.message);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.wrapper}>
                <div className={styles.card}>
                    <h1 className={styles.title}>意見回饋</h1>
                    <p className={styles.subtitle}>
                        您的建議是我們改進的動力，歡迎隨時告訴我們您的想法。
                    </p>

                    <form ref={formRef} className={styles.form} onSubmit={handleSubmit}>
                        <div className={styles.formGroup}>
                            <label htmlFor="name" className={styles.label}>
                                姓名
                            </label>
                            <input
                                type="text"
                                id="name"
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="請輸入您的姓名"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="email" className={styles.label}>
                                聯絡方式 (E-mail)
                            </label>
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="example@email.com"
                                required
                                className={styles.input}
                            />
                        </div>

                        <div className={styles.formGroup}>
                            <label htmlFor="message" className={styles.label}>
                                意見回饋留言處
                            </label>
                            <textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                placeholder="請在此輸入您的寶貴意見..."
                                required
                                className={styles.textarea}
                            />
                        </div>

                        <button
                            type="submit"
                            className={styles.submitBtn}
                            disabled={status === 'loading'}
                        >
                            {status === 'loading' ? '送出中...' : '送出'}
                        </button>

                        {status === 'success' && (
                            <div className={`${styles.message} ${styles.success}`}>
                                感謝您的回饋！我們已經收到您的訊息。
                            </div>
                        )}

                        {status === 'error' && (
                            <div className={`${styles.message} ${styles.error}`}>
                                發送失敗：{errorMessage}
                            </div>
                        )}
                    </form>
                </div>
            </div>
        </div>
    );
}
