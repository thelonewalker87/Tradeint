import { motion } from 'framer-motion';
import { TrendingUp, Brain, Calendar, Target, Activity, DollarSign, Award, AlertCircle, BarChart3 } from 'lucide-react';
import CSVManager from '@/csvManager';
import { CSVTradeData } from '@/csvManager';
import PerformanceCards from '@/components/PerformanceCards';
import PerformanceCharts from '@/components/PerformanceCharts';
import BehavioralInsights from '@/components/BehavioralInsights';
import NewsSection from '@/components/news/NewsSection';
import TradeJournalTable from '@/components/TradeJournalTable';
import DisciplineScoreWidget from '@/components/DisciplineScoreWidget';
import EnhancedCSVUpload from '@/components/upload/EnhancedCSVUpload';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useState, useEffect, useMemo, useCallback } from 'react';

export default function DashboardPage() {
  const [currentTrades, setCurrentTrades] = useState<CSVTradeData[]>([]);

  const loadTrades = useCallback(() => {
    try {
      const csvTrades = CSVManager.loadFromLocalStorage();
      
      if (csvTrades.length === 0) {
        // Initialize with sample trades
        const sampleTrades = getSampleTrades();
        CSVManager.saveToLocalStorage(sampleTrades);
        setCurrentTrades(sampleTrades);
      } else {
        setCurrentTrades(csvTrades);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setCurrentTrades([]);
    }
  }, []);

  // Load CSV data on mount and listen for updates
  useEffect(() => {
    loadTrades();

    const handleTradesUpdate = () => loadTrades();
    window.addEventListener('tradesUpdated', handleTradesUpdate);

    return () => {
      window.removeEventListener('tradesUpdated', handleTradesUpdate);
    };
  }, [loadTrades]);

  /** Extracted sample trades to a function to keep the component body clean */
  function getSampleTrades(): CSVTradeData[] {
    return [
      { id: 'TR-001', date: '2025-03-15', pair: 'EUR/USD', direction: 'long', entry: 1.0842, exit: 1.0891, positionSize: 1.5, result: 367.50, rr: 2.1, ruleViolation: null, notes: 'Good breakout setup with strong momentum' },
      { id: 'TR-002', date: '2025-03-14', pair: 'GBP/USD', direction: 'long', entry: 1.2654, exit: 1.2612, positionSize: 1.0, result: -420.00, rr: -1.2, ruleViolation: 'Oversized Position', notes: 'Violated position sizing rules' },
      { id: 'TR-003', date: '2025-03-13', pair: 'USD/JPY', direction: 'short', entry: 150.42, exit: 149.88, positionSize: 2.0, result: 720.00, rr: 3.1, ruleViolation: null, notes: 'Perfect risk/reward setup' },
      { id: 'TR-004', date: '2025-03-12', pair: 'AUD/USD', direction: 'long', entry: 0.6543, exit: 0.6578, positionSize: 1.0, result: 350.00, rr: 1.8, ruleViolation: null, notes: 'Clean reversal trade' },
      { id: 'TR-005', date: '2025-03-11', pair: 'EUR/GBP', direction: 'short', entry: 0.8567, exit: 0.8534, positionSize: 0.5, result: -165.00, rr: -0.8, ruleViolation: 'Traded During News', notes: 'Got caught in news volatility' },
      { id: 'TR-006', date: '2025-03-10', pair: 'USD/CAD', direction: 'short', entry: 1.3521, exit: 1.3478, positionSize: 1.5, result: 477.00, rr: 2.4, ruleViolation: null, notes: 'Trend continuation trade worked perfectly' },
      { id: 'TR-007', date: '2025-03-09', pair: 'NZD/USD', direction: 'long', entry: 0.6198, exit: 0.6231, positionSize: 1.0, result: 330.00, rr: 1.6, ruleViolation: null, notes: 'Good risk management' },
      { id: 'TR-008', date: '2025-03-08', pair: 'GBP/JPY', direction: 'short', entry: 190.54, exit: 191.12, positionSize: 0.8, result: -464.00, rr: -1.5, ruleViolation: 'No Stop Loss', notes: 'Forgot to set stop loss' },
      { id: 'TR-009', date: '2025-03-07', pair: 'EUR/USD', direction: 'long', entry: 1.0765, exit: 1.0812, positionSize: 2.0, result: 940.00, rr: 2.8, ruleViolation: null, notes: 'Breakout trade with excellent momentum' },
      { id: 'TR-010', date: '2025-03-06', pair: 'USD/CHF', direction: 'short', entry: 0.8821, exit: 0.8789, positionSize: 1.0, result: 362.00, rr: 1.9, ruleViolation: null, notes: 'Safe haven trade' },
      { id: 'TR-011', date: '2025-03-05', pair: 'AUD/JPY', direction: 'long', entry: 98.45, exit: 97.88, positionSize: 1.2, result: -684.00, rr: -2.1, ruleViolation: 'Revenge Trade', notes: 'Revenge trading after loss' },
      { id: 'TR-012', date: '2025-03-04', pair: 'EUR/USD', direction: 'long', entry: 1.0901, exit: 1.0948, positionSize: 1.0, result: 470.00, rr: 2.5, ruleViolation: null, notes: 'Technical analysis paid off' },
      { id: 'TR-013', date: '2025-03-03', pair: 'USD/CAD', direction: 'long', entry: 1.3456, exit: 1.3512, positionSize: 0.8, result: 448.00, rr: 2.2, ruleViolation: null, notes: 'Oil price rally helped' },
      { id: 'TR-014', date: '2025-03-02', pair: 'GBP/USD', direction: 'short', entry: 1.2789, exit: 1.2745, positionSize: 1.5, result: 660.00, rr: 3.0, ruleViolation: null, notes: 'Perfect short setup at resistance' },
      { id: 'TR-015', date: '2025-03-01', pair: 'EUR/JPY', direction: 'long', entry: 162.34, exit: 161.89, positionSize: 1.0, result: -450.00, rr: -1.8, ruleViolation: 'Early Entry', notes: 'Entered too early' },
      { id: 'TR-016', date: '2025-02-28', pair: 'AUD/USD', direction: 'short', entry: 0.6621, exit: 0.6587, positionSize: 1.2, result: 408.00, rr: 2.0, ruleViolation: null, notes: 'Risk sentiment shift' },
      { id: 'TR-017', date: '2025-02-27', pair: 'USD/CHF', direction: 'long', entry: 0.8756, exit: 0.8723, positionSize: 0.5, result: -165.00, rr: -0.9, ruleViolation: 'Overtrading', notes: 'Too many trades today' },
      { id: 'TR-018', date: '2025-02-26', pair: 'EUR/GBP', direction: 'long', entry: 0.8423, exit: 0.8467, positionSize: 1.0, result: 440.00, rr: 2.2, ruleViolation: null, notes: 'Cross currency pair worked well' },
      { id: 'TR-019', date: '2025-02-25', pair: 'GBP/JPY', direction: 'long', entry: 189.67, exit: 190.45, positionSize: 0.8, result: 624.00, rr: 2.8, ruleViolation: null, notes: 'Yen weakness boosted GBPJPY' },
      { id: 'TR-020', date: '2025-02-24', pair: 'NZD/USD', direction: 'short', entry: 0.6289, exit: 0.6324, positionSize: 1.0, result: -350.00, rr: -1.4, ruleViolation: 'Against Trend', notes: 'Fighting the uptrend' },
      { id: 'TR-021', date: '2025-02-23', pair: 'USD/JPY', direction: 'long', entry: 149.78, exit: 150.34, positionSize: 1.5, result: 840.00, rr: 3.5, ruleViolation: null, notes: 'Fed minutes boosted USD' },
      { id: 'TR-022', date: '2025-02-22', pair: 'EUR/USD', direction: 'short', entry: 1.0987, exit: 1.0943, positionSize: 1.0, result: 440.00, rr: 2.0, ruleViolation: null, notes: 'ECB comments weakened euro' },
      { id: 'TR-023', date: '2025-02-21', pair: 'AUD/CAD', direction: 'long', entry: 0.8856, exit: 0.8891, positionSize: 0.8, result: 280.00, rr: 1.6, ruleViolation: null, notes: 'Commodity correlation worked' },
      { id: 'TR-024', date: '2025-02-20', pair: 'GBP/USD', direction: 'short', entry: 1.2876, exit: 1.2912, positionSize: 1.2, result: -432.00, rr: -1.6, ruleViolation: 'Late Entry', notes: 'Missed the best entry' },
      { id: 'TR-025', date: '2025-02-19', pair: 'USD/CHF', direction: 'short', entry: 0.8898, exit: 0.8854, positionSize: 1.0, result: 440.00, rr: 2.2, ruleViolation: null, notes: 'Swiss franc strength' }
    ];
  }

  // Memoize metrics so they don't recalculate on every render
  const metrics = useMemo(() => {
    if (currentTrades.length === 0) {
      return {
        totalTrades: 0, winRate: 0, totalProfitLoss: 0, expectancy: 0,
        averageWin: 0, averageLoss: 0, profitFactor: 0,
        maxDrawdown: 0, sharpeRatio: 0, totalCommission: 0, totalSwap: 0
      };
    }

    const winningTrades = currentTrades.filter(t => t.result > 0);
    const losingTrades = currentTrades.filter(t => t.result <= 0);
    
    const totalProfitLoss = currentTrades.reduce((sum, t) => sum + t.result, 0);
    const totalWins = winningTrades.reduce((sum, t) => sum + t.result, 0);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.result, 0));
    
    const averageWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const averageLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 0;
    
    const winRate = (winningTrades.length / currentTrades.length) * 100;
    const expectancy = (winRate * averageWin - (100 - winRate) * averageLoss) / 100;
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? Infinity : 0;

    return {
      totalTrades: currentTrades.length, winRate, totalProfitLoss, expectancy,
      averageWin, averageLoss, profitFactor,
      maxDrawdown: 0, sharpeRatio: 0, totalCommission: 0, totalSwap: 0
    };
  }, [currentTrades]);

  const statsCards = [
    {
      title: 'Win Rate',
      value: `${metrics.winRate.toFixed(1)}%`,
      icon: Target,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20',
      trend: '+2.3%',
      trendUp: true
    },
    {
      title: 'Total P&L',
      value: `$${metrics.totalProfitLoss.toFixed(0)}`,
      icon: DollarSign,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      trend: '+12.5%',
      trendUp: true
    },
    {
      title: 'Expectancy',
      value: `$${metrics.expectancy.toFixed(2)}`,
      icon: Brain,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20',
      trend: '+0.8%',
      trendUp: true
    },
    {
      title: 'Total Trades',
      value: metrics.totalTrades.toString(),
      icon: BarChart3,
      color: 'text-orange-500',
      bgColor: 'bg-orange-500/10',
      borderColor: 'border-orange-500/20',
      trend: '+15',
      trendUp: true
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100
      }
    }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-[1600px] mx-auto"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl blur-3xl" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg">
              <TrendingUp className="h-7 w-7 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                Trading Dashboard
              </h1>
              <p className="text-lg text-muted-foreground mt-1">
                Master your trading discipline with AI-powered insights
              </p>
            </div>
          </div>
          <Badge variant="outline" className="px-4 py-2 text-sm">
            <Activity className="w-4 h-4 mr-2" />
            Live Trading
          </Badge>
        </div>
      </motion.div>
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card className={`glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${stat.borderColor} bg-card/50`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className={`text-xs ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </Badge>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Data Management Section */}
      <motion.div variants={itemVariants}>
        <EnhancedCSVUpload />
      </motion.div>

      {/* Main Performance Section */}
      <motion.div variants={itemVariants} className="space-y-8">
        <Card className="glass-card border-0 shadow-lg">
          <CardHeader>
            <CardTitle>Performance Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Total P&L</p>
                <p className={`text-2xl font-bold ${metrics.totalProfitLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  ${metrics.totalProfitLoss.toFixed(2)}
                </p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Win Rate</p>
                <p className="text-2xl font-bold">{metrics.winRate.toFixed(1)}%</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-muted-foreground">Expectancy</p>
                <p className="text-2xl font-bold">${metrics.expectancy.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <TradeJournalTable trades={currentTrades} />
      </motion.div>

      {/* Discipline Score & Insights Section */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-1">
          <DisciplineScoreWidget />
        </div>
        <div className="xl:col-span-2">
          <BehavioralInsights />
        </div>
      </motion.div>
    </motion.div>
  );
}