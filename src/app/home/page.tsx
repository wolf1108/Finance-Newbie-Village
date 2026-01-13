'use client';

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import styles from "./page.module.css";
import AdminDashboard from "@/components/AdminDashboard";

interface NewsItem {
  title: string;
  summary: string;
  image: string;
  source: string;
  date: string;
  url: string;
}

interface UserInfo {
  role: string;
  username: string;
}

export default function Home() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 檢查使用者角色
    const checkUser = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          // API 回傳的是 { user: { role, username, ... } }
          setUserInfo(data.user);
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
      } finally {
        setLoading(false);
      }
    };

    // 抓取新聞（僅村民需要）
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/news');
        if (res.ok) {
          const data = await res.json();
          setNews(data);
        }
      } catch (error) {
        console.error("Failed to fetch news", error);
      }
    };

    checkUser();
    fetchNews();
  }, []);

  // Helper for gradients
  const getGradient = (index: number) => {
    const gradients = [
      'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      'linear-gradient(135deg, #6B73FF 0%, #000DFF 100%)',
      'linear-gradient(135deg, #FF9A9E 0%, #FECFEF 99%, #FECFEF 100%)',
      'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
      'linear-gradient(135deg, #fad0c4 0%, #ffd1ff 100%)',
    ];
    return gradients[index % gradients.length];
  };

  // 如果是村長，顯示 Admin Dashboard
  if (userInfo?.role === 'admin') {
    return <AdminDashboard />;
  }

  // 村民首頁
  return (
    <main className={styles.main}>
      <div className={styles.container}>

        {/* 1. Hero Section */}
        <div className={styles.heroSection}>
          <div className={styles.heroText}>
            <h1 className={styles.heroTitle}>模擬股市</h1>
            <p className={styles.heroDesc}>
              為每個人打造的交易平台。從 $100,000 虛擬貨幣開始，看看你在市場上的表現如何。價格是隨機生成的，不反映真實世界的股票表現。
            </p>
            <div className={styles.heroActions}>
              <Link href="/trade" className={styles.btnPrimary}>
                瀏覽市場
              </Link>
              <Link href="/academy" className={styles.btnSecondary}>
                立即開始
              </Link>
            </div>
          </div>
          <div className={styles.heroImageWrapper}>
            <Image
              src="/hero-illustration.png"
              alt="Stock Market Illustration"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>

        {/* 2. Info Section */}
        <div className={styles.infoSection}>
          <h2 className={styles.infoTitle}>甚麼是模擬股市？</h2>
          <p className={styles.infoDesc}>
            模擬股市是一個具有即時報價和投資監控功能的交易平台模擬器。這不反映真實股票市場的運作方式，此處的價格不反映真實世界的情況。
          </p>
        </div>

        {/* 3. News Section */}
        <div className={styles.newsSection}>
          <div className={styles.sectionHeader}>
            <h2 className={styles.sectionTitle}>今日精選</h2>
          </div>
          <div className={styles.newsGrid}>
            {news.map((item, index) => (
              <a
                key={index}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.newsCard}
                style={{ textDecoration: 'none', color: 'inherit' }}
              >
                <div className={styles.newsImagePlaceholder} style={{ background: getGradient(index) }}>
                  <span>{item.source.substring(0, 2)}</span>
                </div>
                <div className={styles.newsContent}>
                  <div className={styles.newsTitle}>{item.title}</div>
                  <div className={styles.newsSummary}>
                    {item.summary.length > 45 ? item.summary.substring(0, 45) + '...' : item.summary}
                  </div>
                  <div className={styles.newsMeta}>
                    <span>{item.source}</span>
                    <span>{item.date}</span>
                  </div>
                </div>
              </a>
            ))}
            {news.length === 0 && [1, 2, 3].map(i => (
              <div key={i} className={styles.newsCard} style={{ opacity: 0.6 }}>
                <div className={styles.newsImagePlaceholder} style={{ background: '#f3f4f6' }}></div>
                <div className={styles.newsContent}>
                  <div style={{ height: '20px', background: '#e5e7eb', marginBottom: '8px' }}></div>
                  <div style={{ height: '40px', background: '#f3f4f6' }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 4. Features Section */}
        <div className={styles.featuresSection}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>📉</div>
            <div className={styles.featureTitle}>真實模擬</div>
            <div className={styles.featureDesc}>
              模擬真實市場開盤與波動機制，讓您在零風險的環境下體驗投資的刺激與挑戰。
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>⚡</div>
            <div className={styles.featureTitle}>即時數據</div>
            <div className={styles.featureDesc}>
              掌握即時報價與市場脈動，訓練您對數字的敏感度與盤勢判斷能力。
            </div>
          </div>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>🎓</div>
            <div className={styles.featureTitle}>學習成長</div>
            <div className={styles.featureDesc}>
              從錯誤中學習，累積實戰經驗，成為自信且理性的投資決策者。
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
