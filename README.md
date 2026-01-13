# Finance-Newbie-Village
理財新手村

# 理財新手村 - 專案與功能介紹

本專案是一個結合 **Next.js**、**MongoDB** 與 **Google Gemini AI** 的全全方位理財學習平台。

## 1. 專案功能概覽

### 核心功能
*   **AI 金融問答機器人 (`/chat`)**：
    *   整合 Google Gemini 模型。
    *   **專業限制**：系統設定為僅回答「金融理財」相關問題，並具備角色扮演功能（管理員 vs 一般用戶）。
*   **互動學習中心 (`/academy`)**：
    *   整合 YouTube 影片教學。
    *   **AI 自動出題**：後端會自動抓取影片字幕，利用 AI 生成相關的選擇題測驗。
*   **模擬股市交易 (`/trade`)**：
    *   提供模擬台股交易介面。
    *   即時（或模擬）股價數據更新。
*   **個人資產與排行榜 (`/profile`, `/leaderboard`)**：
    *   追蹤用戶虛擬資產與投資績效排名。
*   **後台管理系統 (`/admin`)**：
    *   管理員可查看用戶數據、交易紀錄與系統回饋。

---

## 2. 核心檔案與目錄說明

簡單介紹專案中各個重要檔案與目錄的作用：

### 根目錄設定檔
*   **`package.json`**：專案設定檔，包含專案依賴（如 `next`, `mongoose`, `@google/generative-ai`）與執行指令。
*   **`.env.local`**：**（機密）** 環境變數設定檔。用於存放 API Key 與資料庫連線字串，**請勿外流**。
*   **`next.config.ts`**：Next.js 的系統設定。

### 原始碼目錄 (`src/`)
*   **`src/app/`**：應用程式的主要頁面路由（Page Router）。
    *   `page.tsx`：首頁。
    *   `api/chat/route.ts`：處理 AI 對話 API，包含 Prompt 設定。
    *   `api/stocks/route.ts`：處理股票資訊 API。
*   **`src/lib/gemini.ts`**：**核心 AI 邏輯**。負責呼叫 Gemini API 進行測驗題目生成 (`generateQuizQuestions`) 與錯誤解析 (`generateExplanations`)。
*   **`src/models/`**：MongoDB 資料庫模型定義（Schema），例如 `User.ts` (使用者), `Stock.ts` (股票), `QuizLog.ts` (測驗紀錄)。
*   **`src/components/`**：共用的前端元件（Navbar, Footer 等）。

### 腳本目錄 (`scripts/`)
那些用於輔助開發或抓取資料的工具：
*   **`fetch_stocks.py`**：Python 腳本。使用 `yfinance` 與 `twstock` 抓取即時股價。
*   **`fetch_transcript.py`**：Python 腳本。用於抓取 YouTube 字幕，供 AI 出題使用。
*   **`seed-*.js`**：一系列初始化資料庫的腳本（如建立假使用者、假文章）。

---

## 3. 簡單安裝與執行教學

請依照以下步驟在您的電腦上執行此專案。

### 步驟 1：安裝必要工具
請確保您的環境已安裝：
1.  **Node.js** (建議 v18 LTS 以上)
2.  **Python** (建議 3.9 以上，用於數據抓取)
3.  **MongoDB** (請安裝 MongoDB Community Server 並啟動，或準備雲端 URI)

### 步驟 2：安裝依賴套件

開啟終端機 (Terminal)，在專案根目錄執行：

**安裝前端/後端套件 (Node.js)**
```bash
npm install
```

**安裝 Python 依賴 (用於股票與字幕功能)**
```bash
pip install yfinance twstock youtube-transcript-api
```

### 步驟 3：設定環境變數 (隱藏真實 Key)

為了安全起見，我們**不會**將真實的 API Key 寫在程式碼中，而是使用環境變數。

1.  複製範本檔案：
    ```bash
    cp .env.example .env.local
    ```
    *(Windows 用戶可直接複製檔案並重新命名)*

2.  編輯 `.env.local`，填入您的真實資料：
    ```properties
    # MongoDB 資料庫連線位址
    MONGODB_URI=mongodb://localhost:27017/finance-rookie-village

    # Google Gemini API Key (請至 Google AI Studio 申請)
    GEMINI_API_KEY=這裡填入您的真實API_KEY
    
    # JWT 簽章密鑰 (建議隨意修改亂碼以增強安全性)
    JWT_SECRET=my_secure_random_secret_key

    # Marketaux News API Token（用於財經新聞）
    MARKETAUX_API_TOKEN=your-marketaux-api-token-here

    
    ```

### 步驟 4：啟動專案

確認 MongoDB 已在背景執行後，執行以下指令啟動開發伺服器：

```bash
npm run dev
```

開啟瀏覽器前往 [http://localhost:3000](http://localhost:3000) 即可開始使用！


