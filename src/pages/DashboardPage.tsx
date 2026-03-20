import { motion } from 'framer-motion';
import { TrendingUp, Brain, Target, DollarSign, AlertCircle, BarChart3, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
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

  const loadTrades = useCallback(async () => {
    try {
      const csvTrades = await CSVManager.loadFromAPI();
      setCurrentTrades(
        csvTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      );
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

  /** 
   * Build a rich AI-style analysis from local trade data.
   * Used as primary or fallback when the Railway AI backend is unavailable.
   */
  const buildLocalAnalysis = useCallback((trades: CSVTradeData[]): AnalysePerformanceResult => {
    const winners = trades.filter(t => t.result > 0);
    const losers  = trades.filter(t => t.result <= 0);
    const winRate  = trades.length > 0 ? (winners.length / trades.length) * 100 : 0;
    const totalPnL = trades.reduce((sum, t) => sum + t.result, 0);
    const avgRR    = trades.length > 0 ? trades.reduce((sum, t) => sum + t.rr, 0) / trades.length : 0;
    const avgWin   = winners.length > 0 ? winners.reduce((sum, t) => sum + t.result, 0) / winners.length : 0;
    const avgLoss  = losers.length  > 0 ? Math.abs(losers.reduce((sum, t) => sum + t.result, 0) / losers.length) : 0;
    const violations = trades.filter(t => t.ruleViolation);
    const violationRate = trades.length > 0 ? (violations.length / trades.length) * 100 : 0;

    // Per-pair PnL
    const pairPnL: Record<string, number> = {};
    trades.forEach(t => { pairPnL[t.pair] = (pairPnL[t.pair] || 0) + t.result; });
    const sortedPairs = Object.entries(pairPnL).sort((a, b) => b[1] - a[1]);
    const bestPair  = sortedPairs[0];
    const worstPair = sortedPairs[sortedPairs.length - 1];

    // Violation breakdown
    const violationTypes: Record<string, number> = {};
    violations.forEach(t => {
      const key = t.ruleViolation!;
      violationTypes[key] = (violationTypes[key] || 0) + 1;
    });
    const topViolation = Object.entries(violationTypes).sort((a, b) => b[1] - a[1])[0];

    // Loss streak detection
    let maxLossStreak = 0, curStreak = 0;
    trades.forEach(t => {
      if (t.result <= 0) { curStreak++; maxLossStreak = Math.max(maxLossStreak, curStreak); }
      else curStreak = 0;
    });

    // Best trade
    const bestTrade = [...trades].sort((a, b) => b.result - a.result)[0];

    // --- Build the answer (detailed paragraph) ---
    const profitStatus = totalPnL >= 0
      ? `net profitable at $${totalPnL.toFixed(0)}`
      : `net negative at -$${Math.abs(totalPnL).toFixed(0)}`;

    let answer = `Across ${trades.length} trades you are ${profitStatus} with a ${winRate.toFixed(1)}% win rate and average R:R of ${avgRR.toFixed(2)}. `;

    if (avgWin > 0 && avgLoss > 0) {
      answer += `Average win is $${avgWin.toFixed(0)} vs average loss of $${avgLoss.toFixed(0)} — `;
      answer += avgWin > avgLoss
        ? `you let winners run further than losers, which is a professional trait. `
        : `your losses are larger than your wins, which will erode your account even with a good win rate. `;
    }

    if (bestPair && bestPair[1] > 0) {
      answer += `Your strongest instrument is ${bestPair[0]} ($${bestPair[1].toFixed(0)} P&L). `;
    }
    if (worstPair && worstPair[1] < 0 && worstPair[0] !== bestPair?.[0]) {
      answer += `${worstPair[0]} is your weakest pair at -$${Math.abs(worstPair[1]).toFixed(0)} — consider reducing exposure there. `;
    }

    if (violationRate > 0) {
      answer += `Rule violations in ${violationRate.toFixed(0)}% of trades are a significant drag on performance. `;
      if (topViolation) answer += `The most frequent violation is "${topViolation[0]}". `;
    } else {
      answer += `Excellent rule adherence — zero violations recorded. `;
    }

    if (maxLossStreak >= 3) {
      answer += `Your worst losing streak was ${maxLossStreak} consecutive losses — developing a drawdown protocol is essential.`;
    } else {
      answer += `Your maximum consecutive loss streak of ${maxLossStreak} is manageable — maintain this with strict daily loss limits.`;
    }

    // --- Top weakness ---
    let top_weakness = 'Inconsistent risk management across instruments';
    if (topViolation)                 top_weakness = `${topViolation[0]} (${topViolation[1]} occurrence${topViolation[1] > 1 ? 's' : ''})`;
    else if (avgLoss > avgWin)        top_weakness = `Losses ($${avgLoss.toFixed(0)}) are larger than wins ($${avgWin.toFixed(0)}) — exit management needs work`;
    else if (winRate < 45)            top_weakness = 'Low win rate — entry criteria need refinement';
    else if (avgRR < 1)               top_weakness = 'Poor average R:R — exits are too early or entries are too late';
    else if (maxLossStreak >= 3)      top_weakness = `Loss streak of ${maxLossStreak} — need a drawdown stop-trading rule`;

    // --- Positive patterns ---
    const positive_patterns: string[] = [];
    if (winRate >= 55)                positive_patterns.push(`${winRate.toFixed(0)}% win rate — top-tier consistency`);
    if (avgRR >= 2.0)                 positive_patterns.push(`Strong average R:R of ${avgRR.toFixed(2)}`);
    if (avgWin > avgLoss && avgWin > 0) positive_patterns.push(`Winners ($${avgWin.toFixed(0)}) outpace losses ($${avgLoss.toFixed(0)})`);
    if (violations.length === 0)      positive_patterns.push('Perfect rule adherence — zero violations');
    if (bestTrade)                    positive_patterns.push(`Best trade: ${bestTrade.pair} +$${bestTrade.result.toFixed(0)}`);
    if (positive_patterns.length === 0) positive_patterns.push('Actively tracking and reviewing every trade');

    // --- Recommendations ---
    const recommendations: string[] = [];
    if (violationRate > 15)           recommendations.push(`Cut violation rate (${violationRate.toFixed(0)}%) — run a 5-point pre-trade checklist before every entry`);
    if (avgRR < 1.5)                  recommendations.push(`Raise minimum target R:R to 1.5:1 — skip any setup that doesn't hit this threshold`);
    if (winRate < 50)                 recommendations.push(`Improve entry selectivity (${winRate.toFixed(0)}% win rate) — wait for 3+ confluences before entering`);
    if (maxLossStreak >= 3)           recommendations.push(`Add a max-3-consecutive-loss rule — step away and review charts before trading again`);
    if (avgLoss > avgWin && avgLoss > 0) recommendations.push(`Tighten stop losses — your avg loss ($${avgLoss.toFixed(0)}) exceeds avg win ($${avgWin.toFixed(0)})`);
    if (worstPair && worstPair[1] < 0)   recommendations.push(`Reduce or pause trading ${worstPair[0]} until you identify why it consistently underperforms`);
    if (recommendations.length < 3)  recommendations.push('Review your 3 best trades weekly — repeat what made them work');
    if (recommendations.length < 3)  recommendations.push('Set a hard daily loss limit of 2% of account — stop trading when hit');

    return {
      answer,
      top_weakness,
      recommendations: recommendations.slice(0, 3),
      positive_patterns: positive_patterns.slice(0, 3)
    };
  }, []);

  const handleDeepAIAnalysis = async () => {
    if (currentTrades.length === 0) return;
    setIsAnalyzing(true);

    try {
      const aiApiUrl = import.meta.env.VITE_AI_API_URL;

      if (aiApiUrl) {
        // Build a compact trade summary — ONE single API call, no individual grading
        const tradeSummary = currentTrades.slice(-20).map(t => ({
          ticker:    t.pair,
          direction: t.direction,
          pnl:       t.result,
          rr:        t.rr,
          violation: t.ruleViolation || null,
          notes:     t.notes || null,
        }));

        const response = await fetch(`${aiApiUrl.replace(/\/$/, '')}/ai/query`, {
          method:  'POST',
          headers: { 'Content-Type': 'application/json' },
          body:    JSON.stringify({
            type:    'analyse_performance',
            payload: {
              trades:   tradeSummary,
              question: 'Analyse my trading performance. Identify my biggest weakness, give 3 specific recommendations, and highlight 2 positive patterns.'
            }
          })
        });

        if (response.ok) {
          const analysis = await response.json();
          setAiInsights(analysis);
          toast.success('AI Analysis Complete!');
          setIsAnalyzing(false);
          return;
        }
      }

      // Fallback to local only if AI truly failed
      const localAnalysis = buildLocalAnalysis(currentTrades);
      setAiInsights(localAnalysis);
      toast.success('Analysis Complete (local)');

    } catch (error) {
      console.error('Analysis error:', error);
      const localAnalysis = buildLocalAnalysis(currentTrades);
      setAiInsights(localAnalysis);
      toast.success('Analysis Complete (local)');
    } finally {
      setIsAnalyzing(false);
    }
  };

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
              {currentTrades.length > 0 ? 'LIVE DATA' : 'NO DATA'}
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

      {/* Empty State */}
      {currentTrades.length === 0 ? (
        <motion.div variants={itemVariants}>
          <Card className="glass-card border-dashed border-2 border-border/40 bg-card/20">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-5 bg-primary/10 rounded-2xl">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-2xl font-bold text-foreground mb-2">No Trade Data Yet</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Upload your CSV trade history to unlock your dashboard — all analytics, insights, and charts will populate automatically.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button asChild size="lg" className="rounded-xl">
                  <Link to="/csv-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="rounded-xl">
                  <Link to="/journal">
                    Add Trade Manually
                  </Link>
                </Button>
              </div>
              <div className="text-center">
                <p className="text-xs text-muted-foreground">Supported: any broker CSV export (MetaTrader, cTrader, Tradovate, etc.)</p>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ) : (
        <>
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
            <TradeJournalTable trades={currentTrades} />
          </motion.div>

          <NewsSection />
        </>
      )}
    </motion.div>
  );
}