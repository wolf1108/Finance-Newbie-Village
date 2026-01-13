import Link from 'next/link';
import ThemeToggle from './ThemeToggle';
import styles from './Navbar.module.css';

import { cookies } from 'next/headers';
import jwt from 'jsonwebtoken';
import LogoutButton from './LogoutButton';

export default async function Navbar() {
    const cookieStore = await cookies();
    const token = cookieStore.get('auth_token');
    let user = null;

    if (token) {
        try {
            const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-me';
            const decoded = jwt.verify(token.value, JWT_SECRET) as any;
            user = { username: decoded.username, role: decoded.role };
        } catch (e) {
            // Invalid token
        }
    }

    return (
        <nav className={styles.navbar}>
            <div className={styles.container}>
                {/* Left Side: Brand and Links */}
                <div className={styles.leftSide}>
                    <Link href="/" className={styles.brand}>
                        理財新手村
                    </Link>

                    <div className={styles.navLinks}>
                        <Link href="/academy" className={styles.navLink}>
                            小學堂
                        </Link>
                        <Link href="/trade" className={styles.navLink}>
                            模擬股市
                        </Link>
                        <Link href="/chat" className={styles.navLink}>
                            {user?.role === 'admin' ? '小助手' : '村長聊聊'}
                        </Link>
                        {user?.role === 'admin' && (
                            <Link href="/leaderboard" className={styles.navLink}>
                                排行榜
                            </Link>
                        )}
                        {user?.role !== 'admin' && (
                            <Link href="/feedback" className={styles.navLink}>
                                意見回饋
                            </Link>
                        )}
                    </div>
                </div>

                {/* Right Side: Leaderboard, Auth, Toggle */}
                <div className={styles.rightSide}>
                    {user?.role === 'admin' && (
                        <>
                            <Link href="/admin/quiz-history" className={styles.navLink}>歷史總答題記錄</Link>
                            <Link href="/admin/users" className={styles.navLink}>
                                村民管理
                            </Link>
                            <Link href="/admin/transactions" className={styles.navLink}>
                                歷史總交易紀錄
                            </Link>
                            <Link href="/admin/feedbacks" className={styles.navLink}>
                                意見箱
                            </Link>
                        </>
                    )}

                    <ThemeToggle />
                    {user ? (
                        <div className={styles.userSection}>
                            <Link href="/profile" className={styles.username}>
                                哈囉❤️{user.username}
                            </Link>
                            <LogoutButton />
                        </div>
                    ) : (
                        <Link
                            href="/login"
                            className={styles.authBtn}
                        >
                            登入/註冊
                        </Link>
                    )}
                </div>
            </div>
        </nav>
    );
}
