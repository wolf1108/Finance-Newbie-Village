'use client';

import { useState } from 'react';
import styles from './page.module.css';

interface UserData {
    _id: string;
    username: string;
    simulatedBalance: number;
    points: number;
}

interface Props {
    users: UserData[];
    currentUserId?: string; // Optional ID to verify "Me"
}

export default function LeaderboardContent({ users, currentUserId }: Props) {
    const [activeTab, setActiveTab] = useState<'assets' | 'points'>('assets');

    // Use currentUserId if available
    const myId = currentUserId;

    // Sort users based on active tab
    const sortedUsers = [...users].sort((a, b) => {
        if (activeTab === 'assets') {
            return b.simulatedBalance - a.simulatedBalance;
        } else {
            return b.points - a.points;
        }
    });

    // Find my rank and data
    const myRankIndex = sortedUsers.findIndex(u => u._id === myId);
    const myData = sortedUsers[myRankIndex];

    const formatValue = (value: number, type: 'assets' | 'points') => {
        if (type === 'assets') return `$${value.toLocaleString()}`;
        return `${value.toLocaleString()} VP`; // VP = Village Points
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>財富英雄榜</h1>
                <p className={styles.subtitle}>看看誰是新手村的大富翁！</p>
            </div>

            {/* Toggle Tabs */}
            <div className={styles.tabs}>
                <button
                    className={`${styles.tab} ${activeTab === 'assets' ? styles.active : ''}`}
                    onClick={() => setActiveTab('assets')}
                >
                    總資產
                </button>
                <button
                    className={`${styles.tab} ${activeTab === 'points' ? styles.active : ''}`}
                    onClick={() => setActiveTab('points')}
                >
                    總積分
                </button>
            </div>

            {/* List */}
            <div className={styles.list}>
                {sortedUsers.slice(0, 50).map((user, index) => (
                    <div key={user._id} className={styles.card} style={user._id === myId ? { borderColor: 'var(--primary)', borderWidth: 2 } : {}}>
                        <div className={styles.rankSection}>
                            <div className={`${styles.rank} ${index === 0 ? styles.top1 : index === 1 ? styles.top2 : index === 2 ? styles.top3 : ''}`}>
                                {index === 0 ? '👑' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                            </div>
                            <div className={styles.userInfo}>
                                <span className={styles.username}>
                                    {user.username}
                                    {user._id === myId && <span style={{ fontSize: '0.8em', color: 'var(--primary)', marginLeft: 6 }}>(我)</span>}
                                </span>
                            </div>
                        </div>
                        <div className={styles.valueSection}>
                            <div className={styles.value}>{formatValue(activeTab === 'assets' ? user.simulatedBalance : user.points, activeTab)}</div>
                            <div className={styles.label}>{activeTab === 'assets' ? '總資產' : '總積分'}</div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sticky User Footer */}
            {myData && (
                <div className={styles.userFooter}>
                    <div className={styles.footerInfo}>
                        <div className={styles.footerRank}>No. {myRankIndex + 1}</div>
                        <div className={styles.username}>{myData.username}</div>
                    </div>
                    <div className={styles.footerValue}>
                        <div className={styles.footerAmount}>{formatValue(activeTab === 'assets' ? myData.simulatedBalance : myData.points, activeTab)}</div>
                        {/* <div className={styles.footerLabel}>{activeTab === 'assets' ? '目前資產' : '目前積分'}</div> */}
                    </div>
                </div>
            )}
        </div>
    );
}
