# Tradient – AI Trading Discipline Engine

> **Live Demo:** [https://tradeint.vercel.app/dashboard](https://tradeint.vercel.app/dashboard)

Tradient is a comprehensive, AI-powered trading analytics dashboard built for active Forex traders. It helps you track performance, uncover behavioral patterns, score your discipline, and make data-driven improvements — all in one sleek interface.

---

## 🚀 Features

### 📊 Trading Dashboard
- Real-time **P&L tracking** — total profit/loss, win rate, and expectancy at a glance
- **Trade Journal Table** — paginated, searchable, filterable history of all your trades
- **Trade Replay Modal** — review past trades with a simulated price-action chart and AI recommendations
- Upload your own **CSV trade data** for instant analysis

### 📈 Advanced Analytics
- **Equity Curve** — track account growth over time with an interactive area chart
- **Monthly Performance** — wins vs. losses and win rate trend over time (bar + line combo)
- **Trading Activity Heatmap** — visualize P&L performance by hour of day and day of week
- **Symbol Performance** — pie chart + ranked table for your most/least traded pairs
- **Long vs Short Analysis** — compare directional bias

### 🧠 AI Behavioral Insights
- Automatically detects patterns like **revenge trading**, **overtrading**, **position escalation**, and **holding losers**
- Each insight includes affected trade count, estimated dollar impact, and an actionable recommendation
- Severity levels: Critical / High / Medium / Low

### 🎯 Discipline Score
- Weighted score (0–100) across four pillars: **Risk Management**, **Rule Adherence**, **Emotional Control**, and **Consistency**
- Visual breakdown with progress bars and per-category factor tags
- Personalized improvement recommendations based on your actual trading data

### 📰 News & Economic Calendar
- Displays upcoming high-impact news events (FOMC, NFP, ECB, etc.)
- Filterable by currency and impact level
- Helps you correlate trade decisions with market events

### 📝 Trade Journal
- Manual trade entry with **full-featured Add Trade Modal** (4-tab form: Basic → Advanced → Psychology → Review)
- Fields include: pair, session, direction, entry/exit, position size, R:R, setup type, emotional state, confidence level, rule violations, and notes
- Real-time pip/result/R:R calculation as you fill in prices

### ⚙️ Settings
- Dark / Light / System theme toggle
- Persistent sidebar collapse state

---

## 🛠️ Technology Stack

| Category | Technology |
|---|---|
| Framework | React 18 + TypeScript |
| Build Tool | Vite |
| Styling | Tailwind CSS + shadcn/ui |
| UI Components | Radix UI primitives |
| Charts | Recharts |
| Animations | Framer Motion |
| Icons | Lucide React |
| State | React Query + React Hook Form |
| Routing | React Router v6 |
| CSV Parsing | PapaParse |
| Deployment | Vercel |
| Testing | Vitest + Testing Library |

---

## 📦 Getting Started

### Prerequisites
- **Node.js** v18+
- **npm**

### Installation

```bash
# Clone the repo
git clone https://github.com/bhatayush684/Tradeint.git
cd Tradeint

# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open [http://localhost:8080](http://localhost:8080) in your browser.

### Available Scripts

```bash
npm run dev          # Start development server (port 8080)
npm run build        # Production build
npm run preview      # Preview the production build locally
npm run test         # Run unit tests
npm run test:watch   # Run tests in watch mode
npm run lint         # Lint source files
```

---

## 📁 Project Structure

```
src/
├── components/
│   ├── ui/                    # Base shadcn/ui components
│   ├── upload/                # CSV upload components
│   │   └── EnhancedCSVUpload.tsx
│   ├── charts/                # Recharts wrappers & tooltips
│   ├── AppSidebar.tsx         # Main navigation sidebar
│   ├── DashboardLayout.tsx    # App shell with responsive sidebar
│   ├── TradeJournalTable.tsx  # Paginated trade history table
│   ├── TradeReplayModal.tsx   # Per-trade replay + AI recommendation
│   ├── BehavioralInsights.tsx # AI pattern detection widget
│   └── DisciplineScoreWidget.tsx
├── pages/
│   ├── DashboardPage.tsx      # Main dashboard
│   ├── AnalyticsPage.tsx      # Advanced analytics charts
│   ├── JournalPage.tsx        # Full trade journal
│   ├── NewsPage.tsx           # Economic calendar
│   └── SettingsPage.tsx
├── contexts/
│   ├── AuthContext.tsx        # Authentication state
│   └── theme-context.tsx      # Dark/light theme
├── lib/
│   ├── analytics/             # Equity curve, monthly, symbol calcs
│   ├── behavioral/            # Pattern detection algorithms
│   └── scoring/               # Discipline score calculation
├── data/
│   ├── mockData.ts            # Sample trades for demo
│   └── types.ts               # Shared TypeScript interfaces
└── csvManager.ts              # CSV ↔ JSON localStorage manager
```

---

## 📤 CSV Upload Format

Upload your trade history as a `.csv` file. The required column headers are:

| Column | Type | Example |
|---|---|---|
| `id` | string | `TR-001` |
| `date` | YYYY-MM-DD | `2025-03-15` |
| `pair` | string | `EUR/USD` |
| `direction` | `long` / `short` | `long` |
| `entry` | number | `1.08567` |
| `exit` | number | `1.08923` |
| `positionSize` | number (lots) | `0.10` |
| `result` | number (USD) | `35.60` |
| `rr` | number | `1.8` |
| `ruleViolation` | string / empty | `Late Entry` |
| `notes` | string / empty | `Breakout trade` |

A sample file is included at [`public/sample-trading-data.csv`](public/sample-trading-data.csv).

---

## 🚀 Deployment

The app is deployed to **Vercel** with automatic deployments on every push to `main`.

**Live URL:** [https://tradeint.vercel.app/dashboard](https://tradeint.vercel.app/dashboard)

To deploy your own fork:

1. Push to GitHub
2. Import the repo at [vercel.com/new](https://vercel.com/new)
3. Framework preset: **Vite**
4. No environment variables required for the demo version

---

## 🧪 Testing

```bash
npm run test
```

Tests are written with **Vitest** and **@testing-library/react**, configured in `vitest.config.ts`.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/my-feature`)
3. Commit your changes (`git commit -m 'feat: add my feature'`)
4. Push to the branch (`git push origin feature/my-feature`)
5. Open a Pull Request

---

## 📝 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 📊 Project Status

| Item | Status |
|---|---|
| Version | 1.0.0 |
| Deployment | ✅ Live on Vercel |
| Data Source | CSV upload + mock data |
| Authentication | Local storage (demo) |
| Mobile Support | ✅ Responsive |

---

**Built with ❤️ for the trading community**
