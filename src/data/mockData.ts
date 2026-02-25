// Mock trading data for Tradient dashboard

export const performanceMetrics = {
  totalPnL: 12847.32,
  winRate: 68.5,
  avgRiskReward: 2.34,
  expectancy: 1.87,
  disciplineScore: 82,
};

export const equityCurveData = [
  { date: 'Jan', equity: 10000 },
  { date: 'Feb', equity: 10450 },
  { date: 'Mar', equity: 9800 },
  { date: 'Apr', equity: 11200 },
  { date: 'May', equity: 11800 },
  { date: 'Jun', equity: 11300 },
  { date: 'Jul', equity: 12100 },
  { date: 'Aug', equity: 12600 },
  { date: 'Sep', equity: 12200 },
  { date: 'Oct', equity: 13100 },
  { date: 'Nov', equity: 12700 },
  { date: 'Dec', equity: 12847 },
];

export const winLossData = [
  { month: 'Jan', wins: 12, losses: 5 },
  { month: 'Feb', wins: 15, losses: 7 },
  { month: 'Mar', wins: 8, losses: 10 },
  { month: 'Apr', wins: 18, losses: 6 },
  { month: 'May', wins: 14, losses: 8 },
  { month: 'Jun', wins: 11, losses: 9 },
  { month: 'Jul', wins: 16, losses: 5 },
  { month: 'Aug', wins: 13, losses: 7 },
  { month: 'Sep', wins: 10, losses: 8 },
  { month: 'Oct', wins: 17, losses: 4 },
  { month: 'Nov', wins: 14, losses: 6 },
  { month: 'Dec', wins: 12, losses: 5 },
];

export const heatmapData = [
  { hour: '06:00', mon: 2.1, tue: -0.5, wed: 1.8, thu: 0.3, fri: -1.2 },
  { hour: '08:00', mon: 3.4, tue: 1.2, wed: -0.8, thu: 2.1, fri: 0.9 },
  { hour: '10:00', mon: 1.5, tue: 2.8, wed: 3.2, thu: -0.4, fri: 1.7 },
  { hour: '12:00', mon: -0.3, tue: 0.7, wed: 1.1, thu: 1.9, fri: -0.6 },
  { hour: '14:00', mon: 2.2, tue: -1.1, wed: 0.5, thu: 3.1, fri: 2.4 },
  { hour: '16:00', mon: -1.8, tue: 0.3, wed: -0.2, thu: 1.4, fri: 0.8 },
];

export const disciplineTrendData = [
  { week: 'W1', score: 75 },
  { week: 'W2', score: 78 },
  { week: 'W3', score: 72 },
  { week: 'W4', score: 80 },
  { week: 'W5', score: 77 },
  { week: 'W6', score: 83 },
  { week: 'W7', score: 79 },
  { week: 'W8', score: 85 },
  { week: 'W9', score: 82 },
  { week: 'W10', score: 88 },
  { week: 'W11', score: 84 },
  { week: 'W12', score: 82 },
];

export const behavioralInsights = [
  {
    id: 1,
    message: 'You underperform after 2 consecutive losses. Consider taking a break after back-to-back losing trades.',
    severity: 'high' as const,
    category: 'Psychology',
  },
  {
    id: 2,
    message: 'Position size increases by 35% after drawdowns. This revenge-trading pattern costs you an average of $420/month.',
    severity: 'high' as const,
    category: 'Risk Management',
  },
  {
    id: 3,
    message: 'Win rate drops to 42% during high-impact news sessions. Avoid trading 15 minutes before and after major releases.',
    severity: 'medium' as const,
    category: 'Timing',
  },
  {
    id: 4,
    message: 'Your best performance window is 10:00–12:00 EST with a 78% win rate. Consider focusing trades during this period.',
    severity: 'low' as const,
    category: 'Timing',
  },
  {
    id: 5,
    message: 'Trades held longer than 45 minutes have a 23% lower win rate. Review your exit timing strategy.',
    severity: 'medium' as const,
    category: 'Execution',
  },
];

export const newsItems = [
  { id: 1, title: 'FOMC Interest Rate Decision', time: '14:00 EST', impact: 'high' as const, currency: 'USD' },
  { id: 2, title: 'Non-Farm Payrolls', time: '08:30 EST', impact: 'high' as const, currency: 'USD' },
  { id: 3, title: 'ECB Press Conference', time: '08:45 EST', impact: 'high' as const, currency: 'EUR' },
  { id: 4, title: 'UK GDP m/m', time: '02:00 EST', impact: 'medium' as const, currency: 'GBP' },
  { id: 5, title: 'AUD Employment Change', time: '19:30 EST', impact: 'medium' as const, currency: 'AUD' },
  { id: 6, title: 'JPY Trade Balance', time: '18:50 EST', impact: 'low' as const, currency: 'JPY' },
  { id: 7, title: 'CAD Building Permits', time: '08:30 EST', impact: 'low' as const, currency: 'CAD' },
];

export interface Trade {
  id: string;
  pair: string;
  entry: number;
  exit: number;
  positionSize: number;
  result: number;
  rr: number;
  ruleViolation: string | null;
  date: string;
  direction: 'long' | 'short';
  outcome: 'win' | 'loss';
}

export const tradeJournal: Trade[] = [
  { id: 'TR-001', pair: 'EUR/USD', entry: 1.0842, exit: 1.0891, positionSize: 1.5, result: 367.50, rr: 2.1, ruleViolation: null, date: '2025-02-20', direction: 'long', outcome: 'win' },
  { id: 'TR-002', pair: 'GBP/USD', entry: 1.2654, exit: 1.2612, positionSize: 1.0, result: -420.00, rr: -1.2, ruleViolation: 'Oversized Position', date: '2025-02-19', direction: 'long', outcome: 'loss' },
  { id: 'TR-003', pair: 'USD/JPY', entry: 150.42, exit: 149.88, positionSize: 2.0, result: 720.00, rr: 3.1, ruleViolation: null, date: '2025-02-18', direction: 'short', outcome: 'win' },
  { id: 'TR-004', pair: 'AUD/USD', entry: 0.6543, exit: 0.6578, positionSize: 1.0, result: 350.00, rr: 1.8, ruleViolation: null, date: '2025-02-17', direction: 'long', outcome: 'win' },
  { id: 'TR-005', pair: 'EUR/GBP', entry: 0.8567, exit: 0.8534, positionSize: 0.5, result: -165.00, rr: -0.8, ruleViolation: 'Traded During News', date: '2025-02-16', direction: 'long', outcome: 'loss' },
  { id: 'TR-006', pair: 'USD/CAD', entry: 1.3521, exit: 1.3478, positionSize: 1.5, result: 477.00, rr: 2.4, ruleViolation: null, date: '2025-02-15', direction: 'short', outcome: 'win' },
  { id: 'TR-007', pair: 'NZD/USD', entry: 0.6198, exit: 0.6231, positionSize: 1.0, result: 330.00, rr: 1.6, ruleViolation: null, date: '2025-02-14', direction: 'long', outcome: 'win' },
  { id: 'TR-008', pair: 'GBP/JPY', entry: 190.54, exit: 191.12, positionSize: 0.8, result: -464.00, rr: -1.5, ruleViolation: 'No Stop Loss', date: '2025-02-13', direction: 'short', outcome: 'loss' },
  { id: 'TR-009', pair: 'EUR/USD', entry: 1.0765, exit: 1.0812, positionSize: 2.0, result: 940.00, rr: 2.8, ruleViolation: null, date: '2025-02-12', direction: 'long', outcome: 'win' },
  { id: 'TR-010', pair: 'USD/CHF', entry: 0.8821, exit: 0.8789, positionSize: 1.0, result: 362.00, rr: 1.9, ruleViolation: null, date: '2025-02-11', direction: 'short', outcome: 'win' },
  { id: 'TR-011', pair: 'AUD/JPY', entry: 98.45, exit: 97.88, positionSize: 1.2, result: -684.00, rr: -2.1, ruleViolation: 'Revenge Trade', date: '2025-02-10', direction: 'long', outcome: 'loss' },
  { id: 'TR-012', pair: 'EUR/USD', entry: 1.0901, exit: 1.0948, positionSize: 1.0, result: 470.00, rr: 2.5, ruleViolation: null, date: '2025-02-09', direction: 'long', outcome: 'win' },
];

export const newsPerformanceMetrics = {
  totalPnL: -2340.00,
  winRate: 42.0,
  avgRiskReward: 1.12,
  expectancy: -0.45,
  disciplineScore: 58,
};
