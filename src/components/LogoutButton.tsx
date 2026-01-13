'use client';
import styles from './Navbar.module.css';

export default function LogoutButton() {
    const handleLogout = async () => {
        await fetch('/api/auth/logout', { method: 'POST' });
        window.location.href = '/login';
    };

    return (
        <button
            onClick={handleLogout}
            className={styles.authBtn}
            style={{ marginLeft: '10px', background: 'transparent', border: '1px solid var(--border)', color: 'var(--foreground)' }}
        >
            登出
        </button>
    );
}
