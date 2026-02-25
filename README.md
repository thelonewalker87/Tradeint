# Tradient Dashboard

A comprehensive trading analytics dashboard designed to help traders track performance, analyze patterns, and improve their trading discipline through data-driven insights.

## 🚀 Features

### 📊 Performance Analytics
- **Real-time P&L Tracking** - Monitor total profit/loss, win rate, and expectancy
- **Equity Curve Visualization** - Track account growth over time with interactive charts
- **Risk-Reward Analysis** - Analyze average risk-reward ratios and position sizing
- **Win/Loss Patterns** - Monthly breakdown of winning vs losing trades

### 🧠 Behavioral Insights
- **Trading Psychology Analysis** - Identify emotional trading patterns and biases
- **Discipline Scoring** - Track adherence to trading rules and strategies
- **Performance Heatmaps** - Visualize trading performance by time of day and day of week
- **Behavioral Alerts** - Get notified about recurring trading mistakes

### 📝 Trade Journal
- **Comprehensive Trade Logging** - Record entry/exit points, position sizes, and outcomes
- **Rule Violation Tracking** - Monitor breaches of your trading plan
- **Trade Replay** - Review past trades with detailed analysis
- **Performance Metrics** - Detailed statistics for individual trades

### 📰 Economic Calendar
- **High-Impact News Events** - Track major economic announcements
- **Market Impact Analysis** - See how news events affect your trading performance
- **Currency-Specific Events** - Filter news by traded currency pairs

### 🎨 Modern UI/UX
- **Dark/Light Mode** - Toggle between themes for comfortable viewing
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile
- **Interactive Charts** - Built with Recharts for smooth data visualization
- **Real-time Updates** - Live data refresh with React Query

## 🛠️ Technology Stack

### Frontend Framework
- **React 18** - Modern, component-based UI framework
- **TypeScript** - Type-safe JavaScript development
- **Vite** - Fast build tool and development server

### UI & Styling
- **Tailwind CSS** - Utility-first CSS framework
- **Radix UI** - Accessible, unstyled UI components
- **shadcn/ui** - Beautiful, customizable component library
- **Framer Motion** - Smooth animations and transitions
- **Lucide React** - Comprehensive icon library

### Data & State Management
- **TanStack React Query** - Server state management
- **React Hook Form** - Form state management
- **Zod** - Schema validation
- **React Router** - Client-side routing

### Charts & Visualization
- **Recharts** - Declarative charting library
- **Custom Analytics** - Tailored trading-specific visualizations

### Development Tools
- **ESLint** - Code linting and formatting
- **Vitest** - Unit testing framework
- **Testing Library** - Component testing utilities
- **PostCSS** - CSS processing and optimization

## 📦 Installation

### Prerequisites
- **Node.js** (v18 or higher)
- **npm** or **yarn** package manager

### Quick Start

1. **Clone the repository**
   ```bash
   git clone https://github.com/bhatayush684/Tradeint.git
   cd tradient-dashboard
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open your browser**
   Navigate to `http://localhost:8080`

## 🚀 Available Scripts

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run tests
npm run test

# Run tests in watch mode
npm run test:watch

# Lint code
npm run lint

# Build for development mode
npm run build:dev
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # Base UI components (buttons, forms, etc.)
│   ├── DashboardLayout.tsx
│   ├── PerformanceCards.tsx
│   ├── PerformanceCharts.tsx
│   ├── TradeJournalTable.tsx
│   └── ...
├── pages/              # Page components
│   ├── DashboardPage.tsx
│   ├── AnalyticsPage.tsx
│   ├── JournalPage.tsx
│   ├── NewsPage.tsx
│   └── SettingsPage.tsx
├── contexts/           # React contexts
│   └── AuthContext.tsx
├── data/               # Mock data and types
│   └── mockData.ts
├── hooks/              # Custom React hooks
├── lib/                # Utility functions
└── test/               # Test files
```

## 🔧 Configuration

### Environment Variables
Currently, the application uses mock data for demonstration. For production use, you would typically need:

```env
# API Configuration
VITE_API_BASE_URL=https://your-api-endpoint.com
VITE_API_KEY=your-api-key

# Authentication
VITE_AUTH_PROVIDER=auth0|firebase|custom
VITE_AUTH_CLIENT_ID=your-client-id

# Trading Data
VITE_TRADING_API_KEY=your-trading-api-key
VITE_REAL_TIME_FEED_URL=wss://your-realtime-feed.com
```

## 🧪 Testing

The project includes a comprehensive testing setup:

```bash
# Run all tests
npm run test

# Run tests in watch mode for development
npm run test:watch

# Generate coverage report
npm run test:coverage
```

## 🚀 Deployment

### Build for Production
```bash
npm run build
```

### Deployment Options
- **Vercel** - Recommended for React applications
- **Netlify** - Static site hosting with CI/CD
- **AWS Amplify** - Full-stack hosting
- **Docker** - Containerized deployment

### Environment Setup
Ensure your hosting platform supports:
- Node.js 18+
- Static file serving
- Environment variables
- SPA routing (for React Router)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues or have questions:

1. Check the [Issues](https://github.com/bhatayush684/Tradeint/issues) page
2. Create a new issue with detailed information
3. Join our community discussions

## 🔮 Roadmap

### Upcoming Features
- [ ] Real-time trading data integration
- [ ] Multiple broker API support
- [ ] Advanced backtesting engine
- [ ] Mobile app (React Native)
- [ ] AI-powered trading insights
- [ ] Social trading features
- [ ] Custom alert system
- [ ] Portfolio management tools

### Technical Improvements
- [ ] TypeScript strict mode
- [ ] End-to-end testing with Playwright
- [ ] Performance optimization
- [ ] Offline support
- [ ] Progressive Web App (PWA)

## 📊 Current Status

**Version**: 1.0.0  
**Status**: Development/Prototype  
**Data Source**: Mock data (demo purposes)  
**Authentication**: Local storage (demo)  

---

**Built with ❤️ for the trading community**
