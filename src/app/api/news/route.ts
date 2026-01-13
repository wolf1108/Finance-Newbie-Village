import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// 完整備用新聞資料庫 (確保 API 失敗時仍有豐富內容)
const MOCK_NEWS_POOL = [
    {
        title: "聯準會暗示利率政策可能轉向，市場情緒高漲",
        summary: "隨著通膨數據逐漸降溫，聯準會主席在最新的談話中透露出暫停升息的可能性，帶動美股三大指數全面上揚。",
        image: "/images/news/fed.jpg",
        source: "財經日報",
        date: "2026-01-08",
        url: "https://www.cnyes.com/"
    },
    {
        title: "台積電法說會即將登場，外資預估營收將創新高",
        summary: "受惠於 AI 晶片需求強勁，市場普遍看好台積電本季營收表現，多家外資券商調高目標價。",
        image: "/images/news/tsmc.jpg",
        source: "科技新報",
        date: "2026-01-08",
        url: "https://technews.tw/"
    },
    {
        title: "電動車市場競爭白熱化，特斯拉宣佈新一輪降價",
        summary: "為了搶佔市佔率，特斯拉今日宣佈針對 Model 3 與 Model Y 進行降價，預計將對其他車廠造成壓力。",
        image: "/images/news/ev.jpg",
        source: "汽車週刊",
        date: "2026-01-08",
        url: "https://www.7car.tw/"
    },
    {
        title: "比特幣重返 4 萬美元大關，加密貨幣市場回暖",
        summary: "在比特幣現貨 ETF 通過預期的帶動下，加密貨幣市場迎來久違的漲勢，比特幣單日大漲 5%。",
        image: "/images/news/crypto.jpg",
        source: "區塊鏈視界",
        date: "2026-01-08",
        url: "https://www.blocktempo.com/"
    },
    {
        title: "油價受地緣政治影響震盪，分析師看好能源股",
        summary: "中東局勢緊張導致原油供應擔憂，布蘭特原油價格一度突破 90 美元，能源類股成為資金避風港。",
        image: "/images/news/oil.jpg",
        source: "全球能源",
        date: "2026-01-08",
        url: "https://www.moneydj.com/kmdj/news/newsviewer.aspx"
    },
    {
        title: "AI 應用持續發酵，科技巨頭競相投入研發",
        summary: "微軟、Google 等科技巨頭持續加碼 AI 投資，帶動相關供應鏈股價表現強勁。",
        image: "/images/news/ai.jpg",
        source: "數位時代",
        date: "2026-01-08",
        url: "https://www.bnext.com.tw/"
    }
];

export async function GET() {
    const API_TOKEN = process.env.MARKETAUX_API_TOKEN;
    console.log("Checking API Token:", API_TOKEN ? "Found (Length: " + API_TOKEN.length + ")" : "Missing");

    if (API_TOKEN) {
        try {
            // Marketaux 免費版限制 page offset 不能太大，限制 1-3 頁較安全
            const randomPage = Math.floor(Math.random() * 2) + 1;

            // 使用更廣泛的篩選條件，避免只選熱門股反而沒新聞
            // entities=true 確保是重要新聞
            const apiUrl = `https://api.marketaux.com/v1/news/all?language=en&filter_entities=true&limit=3&page=${randomPage}&api_token=${API_TOKEN}`;
            console.log("Fetching Marketaux:", apiUrl.replace(API_TOKEN, 'HIDDEN'));

            const response = await fetch(apiUrl, { cache: 'no-store' });

            if (response.ok) {
                const data = await response.json();
                console.log("Marketaux Response Count:", data.data?.length);

                if (data.data?.length > 0) {
                    const realNews = data.data.map((item: any) => ({
                        title: item.title,
                        summary: item.description || item.snippet || "點擊閱讀完整新聞內容...",
                        image: item.image_url || null,
                        source: item.source || "Global News",
                        date: item.published_at.split('T')[0],
                        url: item.url
                    }));
                    return NextResponse.json(realNews);
                } else {
                    console.log("Marketaux returned no data.");
                }
            } else {
                const errText = await response.text();
                console.warn("Marketaux API request failed:", response.status, errText);
            }
        } catch (error) {
            console.error("Failed to fetch from Marketaux:", error);
        }
    } else {
        console.log("Using Mock Data (No Token)");
    }

    // Fallback: Return 3 random items from Mock Pool
    const shuffled = [...MOCK_NEWS_POOL].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 3);

    return NextResponse.json(selected);
}
