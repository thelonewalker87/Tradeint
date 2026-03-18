import { motion } from 'framer-motion';
import { TrendingUp, Brain, Calendar, Target, Activity, DollarSign, Award, AlertCircle, BarChart3, Loader2, Sparkles } from 'lucide-react';
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
import { AIApiService, AnalysePerformanceResult, GradeResult } from '@/services/AIApiService';
import { toast } from 'sonner';

export default function DashboardPage() {
  const [currentTrades, setCurrentTrades] = useState<CSVTradeData[]>([]);
  const [aiInsights, setAiInsights] = useState<AnalysePerformanceResult | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

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

    const handleTradesUpdate = () => {
      loadTrades();
      setAiInsights(null); // Reset AI insights when data changes
    };
    window.addEventListener('tradesUpdated', handleTradesUpdate);

    return () => {
      window.removeEventListener('tradesUpdated', handleTradesUpdate);
    };
  }, [loadTrades]);

  const handleDeepAIAnalysis = async () => {
    if (currentTrades.length === 0) return;
    
    setIsAnalyzing(true);
    try {
      // 1. Map trades to AI inputs
      const aiInputs = currentTrades.slice(-20).map(t => AIApiService.mapCSVToAITrade(t));
      
      // 2. Grade them (sequential for safety with free tier API limits, but could be parallel)
      // Note: In a real app we might cache these grades. 
      // For this demo, we'll grade the most recent batch.
      const gradedTrades: GradeResult[] = [];
      for (const input of aiInputs) {
        try {
          const result = await AIApiService.gradeTrade(input);
          gradedTrades.push(result);
        } catch (e) {
          console.warn('Failed to grade a trade, skipping...', e);
        }
      }

      if (gradedTrades.length === 0) throw new Error('Could not grade any trades');

      // 3. Perform batch performance analysis
      const analysis = await AIApiService.analysePerformance(gradedTrades);
      setAiInsights(analysis);
      toast.success('Llama-3 Analysis Complete!');
    } catch (error) {
      toast.error('AI Connection Failed. If this is the deployed site, please check your VITE_AI_API_URL environment variable in Vercel.');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
      { id: 'TR-011', date: '2025-03-05', pair: 'AUD/JPY', direction: 'long', entry: 98.45, exit: 97.88, positionSize: 1.2, result: -684.00, rr: -2.1, ruleViolation: 'Revenge Trade', notes: 'Revenge trading after loss' }
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
      trend: `+${currentTrades.length}`,
      trendUp: true
    }
  ];

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: { y: 0, opacity: 1, transition: { type: "spring", stiffness: 100 } }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-8 max-w-[1600px] mx-auto pb-20"
    >
      {/* Header Section */}
      <motion.div variants={itemVariants} className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-primary/5 rounded-3xl blur-3xl opacity-50" />
        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-primary to-primary/80 rounded-2xl shadow-lg border border-white/10">
              <TrendingUp className="h-7 w-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent tracking-tight">
                Trading Dashboard
              </h1>
              <p className="text-lg text-muted-foreground font-medium mt-1">
                Real-time discipline scoring and Llama-3 AI analytics
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
             <Badge variant="outline" className="px-4 py-2 text-xs font-bold border-primary/20 bg-primary/5">
              {localStorage.getItem('tradient_trades_csv') ? 'LIVE DATA' : 'SAMPLE DATA'}
            </Badge>
          </div>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div variants={itemVariants} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            whileHover={{ y: -4 }}
            className="transition-all duration-300"
          >
            <Card className={`glass-card border-0 shadow-lg hover:shadow-xl transition-all duration-300 ${stat.borderColor} bg-card/40 backdrop-blur-md`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-2 rounded-xl ${stat.bgColor}`}>
                    <stat.icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <Badge variant="secondary" className={`text-[10px] font-bold ${stat.trendUp ? 'text-green-500' : 'text-red-500'}`}>
                    {stat.trend}
                  </Badge>
                </div>
                <div>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-1">{stat.title}</p>
                  <p className="text-3xl font-black tracking-tighter">{stat.value}</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>

      {/* Main Analysis Section */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="xl:col-span-1">
          <DisciplineScoreWidget trades={currentTrades} />
        </motion.div>
        <motion.div variants={itemVariants} className="xl:col-span-2">
          <BehavioralInsights 
            trades={currentTrades} 
            aiInsights={aiInsights}
            isAnalyzing={isAnalyzing}
            onAnalyze={handleDeepAIAnalysis}
          />
        </motion.div>
      </div>

      <motion.div variants={itemVariants}>
        <EnhancedCSVUpload />
      </motion.div>

      <motion.div variants={itemVariants}>
        <TradeJournalTable trades={currentTrades} />
      </motion.div>
      
      <NewsSection />
    </motion.div>
  );
}