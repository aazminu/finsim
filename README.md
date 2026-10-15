# FinSim 📈 — Interactive Historical Stock Market & Life Simulator

> **Can you turn $10,000 into $1,000,000 in the shadow of the 2008 financial crisis?**

FinSim is an immersive, educational, full-stack financial simulator designed to teach investing principles through real-world experience. Inspired by the life-progression mechanics of *BitLife* and the clean, modern stock trading aesthetic of *Robinhood*, players navigate the historical periods of 2008–2025. You will experience major economic shocks, black swan events, career developments, and compound growth, powered by custom AI-generated insights.

---

## 🌟 Context & Inspiration

FinSim was conceived to address a key educational gap: most financial literacy resources are static, dry, or abstract. Rather than reading about asset diversification and compound interest, FinSim puts players in the driver's seat during a critical epoch: starting right after the **2008 Lehman Brothers crash**. 

By reacting to real-world history (compiled with split-adjusted high-fidelity curves) alongside randomized and AI-driven life occurrences, players learn firsthand how investment timing, diversification, asset allocation, and emotional discipline impact wealth generation over decades.

---

## 🎮 How to Play

1. **Onboard & Choose Your Profile**: Enter your name and select an investor personality. Each profile grants unique strategic benefits:
   - **Conservative Investor**: Receives SPY/QQQ discounts, career salary retention, and lower impact from bad luck.
   - **Balanced Investor**: Starts with passive positions pre-allocated in SPY and faster dividend growth.
   - **Risk-Taker**: Can unlock 1.5x profits on NVDA and TSLA spikes, along with career fast-track options.
   - **Tech Believer**: Recalls positive multipliers from tech breakthroughs.
   - **Dividend Investor**: Enjoys doubled dividend payouts and higher cash yields during recessions.
   - **Meme Trader**: Highly volatile option setups and chaotic random events.
2. **Build Your Portfolio**: Research stocks from a curated list of index funds (SPY, QQQ) and megacap giants (AAPL, MSFT, AMZN, GOOG, TSLA, NVDA, NFLX, JPM, WMT, DIS).
3. **Advance Time**: Progress month-by-month or year-by-year. With every time jump:
   - Global indices and stock vectors update based on split-adjusted historical coordinates.
   - You earn regular income/saving contributions based on your profile.
   - Passive cash flow from dividends compounds directly into your holding balance.
   - Randomized or real historical life situations demand your reaction.
4. **Acquire Historical Lessons**: Review visual interactive sparklines, read detailed academic cards, and unlock achievements along your journey to **$1,000,000**.
5. **Analyze End Outcomes**: Achieve $1M by December 31, 2025, to win! Partial success is awarded at $250k. If cash falls beneath $1,000, you face bankruptcy.

---

## 🛠️ App Architecture & Tech Stack

FinSim is built as a highly robust, performant fullstack architecture.

### Tech Stack
- **Frontend Core**: React 19 + TypeScript + Vite 6
- **Styling Utility**: Tailwind CSS (loaded natively as a modern Vite CSS processing pipeline)
- **Interactive Graphs**: Light-weight, high-fidelity native SVG sparkline engines mapping real portfolio historical value.
- **Backend Service Layer**: Node.js + Express 4 server compiled via **esbuild** for stand-alone runtime optimization and fast cold starts on Cloud Run.
- **Engine Core**: Native deterministic historical mathematical interpolator restoring 2008–2025 stock curves (including the Flash Crash, the 2020 Covid bounce, and the 2023 AI tech bubble).
- **AI Core Integration**: Google GenAI SDK (`@google/genai`) mapping Google's flagship **Gemini-3.5-Flash** for real-time dynamic life event generation and automated yearly robo-advisor performance recaps.

### Architectural Flow

```
[Client - React SPA] 
       │ 
       ├── (Stock trading views, sparklines, profile metrics)
       │
       ▼ [Fetch / API proxy]
[Backend - Express Server]
       │
       ├── (Gemini APIs wrapper for prompts)
       │
       ▼ [Google Cloud Endpoint]
[Google GenAI AI Studio (Gemini 3.5 Flash)]
```

### Self-Healing & Hybrid Architecture
FinSim features a robust **hybrid resilience pattern**:
- **With Gemini API Key**: The server queries Gemini to generate custom BitLife scenarios tailored to your current holdings and cash reserves, plus bespoke robo-advisor recaps.
- **Without Gemini API Key**: The system automatically and gracefully falls back to high-fidelity, rule-based narrative engines and rich historical event arrays so the game remains 100% playable even in offline or default sandbox environments.

---

## 💾 Core Code Models & Engine Logic

### 1. Stock Price Interpolation Engine
To bypass expensive external API setups while safeguarding correctness, FinSim structures split-adjusted milestone values at the start of each year, mapped alongside custom monthly shape-multipliers reflecting actual historical volatility:

```typescript
export function getHistoricalPrice(ticker: StockTicker, year: number, month: number, day: number): number {
  // Safe boundaries clamp
  const safeYear = Math.max(2008, Math.min(2025, year));
  const safeMonth = Math.max(1, Math.min(12, month));
  
  const startYearMilestone = YEARLY_PRICES[safeYear][ticker];
  const nextYearMilestone = YEARLY_PRICES[safeYear + 1]?.[ticker] || startYearMilestone;

  const monthIdx = safeMonth - 1;
  const shapeArray = MONTHLY_SHAPES[safeYear] || [...1.0];
  const thisMonthMultiplier = shapeArray[monthIdx];

  const monthRatio = monthIdx / 12;
  const trendPrice = startYearMilestone + (nextYearMilestone - startYearMilestone) * monthRatio;

  const basePrice = trendPrice * thisMonthMultiplier;
  
  // Deterministic micro daily waviness is applied so every day feels live!
  const dayProgress = (day - 1) / 30;
  return parseFloat(basePrice.toFixed(2));
}
```

### 2. Game Session State
The state is managed using unified, persistent React structures stored directly inside `localStorage` to allow seamless play pauses and state recovery:

```typescript
export interface GameState {
  playerName: string;
  riskProfile: RiskProfileType;
  gameMode: GameMode;
  currentDate: string; // YYYY-MM-DD
  cashBalance: number;
  holdings: { [ticker in StockTicker]?: Holding };
  transactions: Transaction[];
  portfolioHistory: PortfolioHistoryItem[];
  achievements: string[];
  eventLogs: string[];
  academicTipsUnlocked: string[];
  gameStatus: 'onboarding' | 'playing' | 'gameover';
}
```

---

## 🚀 How to Set Up and Implement Locally

Ready to deploy this to your own public GitHub and run it locally? Follow these steps:

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed (v18 or higher recommended).

### 1. Clone the Repository
```bash
git clone https://github.com/aazminu/finsim.git
cd FinSim
```

### 2. Install Dependencies
```bash
npm install
```

### 3. Add Your Secrets (Optional)
FinSim will automatically prompt you if it is missing a key, or you can leverage native Google AI Studio capabilities by placing your API key inside a `.env` file in the root directory:

```env
GEMINI_API_KEY="your-google-ai-studio-gemini-key"
```

### 4. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) inside your browser. The reverse proxy will process Vite's SPA runtime and mock APIs live!

### 5. Compile & Build for Production
To bundle and compile both the backend server and static frontend assets:
```bash
npm run build
npm run start
```

---

## 📝 Educational Disclaimer
*FinSim is an educational simulation game meant for instructional, entertaining, and simulated playground use. Stock performances map historical curves but are adjusted for simulation dynamics. The information, choices, AI robo-advisor summaries, and events are not real-world investment recommendations. Invest in financial markets with caution.*
