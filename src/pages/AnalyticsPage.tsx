import { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  LineChart, Line, AreaChart, Area, BarChart, Bar, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  ReferenceLine, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, TrendingDown, Target, Activity, DollarSign, 
  Calendar, Award, AlertCircle, ArrowUpRight, ArrowDownRight,
  BarChart3
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import CSVManager from '@/csvManager';
import { CSVTradeData } from '@/csvManager';
import { AIApiService } from '@/services/AIApiService';
import { calculateDisciplineScore, getDisciplineLevel } from '@/lib/scoring';

interface DailyPerformance {
  date: string;
  pnl: number;
  trades: number;
  maxProfit: number;
  maxDrawdown: number;
}

interface EquityPoint {
  index: number;
  date: string;
  equity: number;
  pnl: number;
  cumulativeR: number;
}

interface PerformanceMetrics {
  actualR: number;
  targetR: number;
  managementR: number;
  rLeftOnTable: number;
  winRate: number;
  avgRWin: number;
  avgRLoss: number;
  totalTrades: number;
  maxDrawdown: number;
}

export default function AnalyticsPage() {
  const [trades, setTrades] = useState<CSVTradeData[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadTrades = useCallback(async () => {
    setIsLoading(true);
    try {
      // Load existing trades from API
      const csvTrades = await CSVManager.loadFromAPI();
      
      // If no data exists, initialize with sample trades
      if (csvTrades.length === 0) {
        console.log('No trades found, initializing with sample data...');
        const sampleTrades = generateSampleTrades();
        await CSVManager.saveToAPI(sampleTrades);
        setTrades(sampleTrades);
      } else {
        console.log(`Loaded ${csvTrades.length} trades from API`);
        setTrades(csvTrades);
      }
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Load trades on mount and listen for updates
  useEffect(() => {
    loadTrades();
    
    const handleTradesUpdate = () => loadTrades();
    window.addEventListener('tradesUpdated', handleTradesUpdate);
    
    return () => {
      window.removeEventListener('tradesUpdated', handleTradesUpdate);
    };
  }, [loadTrades]);

  const generateSampleTrades = (): CSVTradeData[] => {
    const trades: CSVTradeData[] = [];
    const pairs = ['EUR/USD', 'GBP/USD', 'USD/JPY', 'AUD/USD', 'USD/CAD'];
    const startDate = new Date('2025-01-01');
    
    for (let i = 0; i < 100; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + Math.floor(i * 1.5));
      
      const isWin = Math.random() > 0.45; // 55% win rate
      const direction = Math.random() > 0.5 ? 'long' : 'short';
      const rr = 1.5 + Math.random() * 2.5; // 1.5:1 to 4:1
      const result = isWin ? rr * 100 * (0.8 + Math.random() * 0.4) : -100;
      
      trades.push({
        id: `TR-${String(i + 1).padStart(3, '0')}`,
        date: date.toISOString().split('T')[0],
        pair: pairs[Math.floor(Math.random() * pairs.length)],
        direction: direction as 'long' | 'short',
        entry: parseFloat((1.0 + Math.random() * 0.5).toFixed(5)),
        exit: parseFloat((1.0 + Math.random() * 0.5).toFixed(5)),
        positionSize: parseFloat((0.1 + Math.random() * 2).toFixed(2)),
        result: parseFloat(result.toFixed(2)),
        rr: parseFloat(rr.toFixed(2)),
        ruleViolation: Math.random() > 0.8 ? 'Late Entry' : null,
        notes: isWin ? 'Good setup execution' : 'Stop loss hit'
      });
    }
    
    return trades;
  };

  // Calculate comprehensive metrics
  const metrics = useMemo<PerformanceMetrics>(() => {
    if (trades.length === 0) {
      return {
        actualR: 0,
        targetR: 0,
        managementR: 0,
        rLeftOnTable: 0,
        winRate: 0,
        avgRWin: 0,
        avgRLoss: 0,
        totalTrades: 0,
        maxDrawdown: 0
      };
    }

    const winningTrades = trades.filter(t => t.result > 0);
    const losingTrades = trades.filter(t => t.result <= 0);
    
    const totalR = trades.reduce((sum, t) => sum + (t.result / 100), 0);
    const totalWinsR = winningTrades.reduce((sum, t) => sum + (t.result / 100), 0);
    const totalLossesR = Math.abs(losingTrades.reduce((sum, t) => sum + (t.result / 100), 0));
    
    // Calculate max drawdown
    let runningEquity = 0;
    let peak = 0;
    let maxDD = 0;
    
    const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    sorted.forEach(trade => {
        runningEquity += trade.result;
        peak = Math.max(peak, runningEquity);
        maxDD = Math.max(maxDD, peak - runningEquity);
      });
    
    return {
      actualR: totalR,
      targetR: totalR * 1.2, // Assume target is 20% higher
      managementR: totalR * 0.85, // Assume management cost is 15%
      rLeftOnTable: totalR * 0.15, // 15% left on table
      winRate: (winningTrades.length / trades.length) * 100,
      avgRWin: winningTrades.length > 0 ? totalWinsR / winningTrades.length : 0,
      avgRLoss: losingTrades.length > 0 ? totalLossesR / losingTrades.length : 0,
      totalTrades: trades.length,
      maxDrawdown: maxDD / 100 // Convert to R multiples
    };
  }, [trades]);

  // Calculate equity curve
  const equityCurve = useMemo<EquityPoint[]>(() => {
    if (trades.length === 0) return [];
    
    let runningEquity = 0;
    let runningR = 0;
    
    return [...trades]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .map((trade, index) => {
        runningEquity += trade.result;
        runningR += trade.result / 100;
        
        return {
          index: index + 1,
          date: new Date(trade.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          equity: runningEquity,
          pnl: trade.result,
          cumulativeR: runningR
        };
      });
  }, [trades]);

  // Calculate daily performance
  const dailyPerformance = useMemo<DailyPerformance[]>(() => {
    if (trades.length === 0) return [];
    
    const dailyMap = new Map<string, DailyPerformance>();
    
    trades.forEach(trade => {
      const date = trade.date;
      const existing = dailyMap.get(date) || {
        date,
        pnl: 0,
        trades: 0,
        maxProfit: 0,
        maxDrawdown: 0
      };
      
      existing.pnl += trade.result;
      existing.trades += 1;
      existing.maxProfit = Math.max(existing.maxProfit, trade.result);
      existing.maxDrawdown = Math.min(existing.maxDrawdown, trade.result);
      
      dailyMap.set(date, existing);
    });
    
    return Array.from(dailyMap.values())
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(-30); // Last 30 days
  }, [trades]);

  // Long vs Short analysis — multi-metric data for grouped bar chart
  const longShortData = useMemo(() => {
    if (trades.length === 0) return [];

    const longTrades = trades.filter(t => t.direction === 'long');
    const shortTrades = trades.filter(t => t.direction === 'short');

    const longPnL = longTrades.reduce((sum, t) => sum + (t.result || 0), 0);
    const shortPnL = shortTrades.reduce((sum, t) => sum + (t.result || 0), 0);

    const longWR = longTrades.length > 0
      ? Math.round((longTrades.filter(t => (t.result || 0) > 0).length / longTrades.length) * 100)
      : 0;
    const shortWR = shortTrades.length > 0
      ? Math.round((shortTrades.filter(t => (t.result || 0) > 0).length / shortTrades.length) * 100)
      : 0;

    const longAvg = longTrades.length > 0 ? Math.round((longPnL / longTrades.length) * 100) / 100 : 0;
    const shortAvg = shortTrades.length > 0 ? Math.round((shortPnL / shortTrades.length) * 100) / 100 : 0;

    // Return one row per metric so we can use grouped bars
    return [
      {
        metric: 'Trade Count',
        LONG: longTrades.length,
        SHORT: shortTrades.length,
      },
      {
        metric: 'Win Rate %',
        LONG: longWR,
        SHORT: shortWR,
      },
      {
        metric: 'Total P&L',
        LONG: Math.round(longPnL * 100) / 100,
        SHORT: Math.round(shortPnL * 100) / 100,
      },
      {
        metric: 'Avg Return',
        LONG: longAvg,
        SHORT: shortAvg,
      },
    ];
  }, [trades]);

  // Summary cards (separate, used below the chart)
  const longShortSummary = useMemo(() => {
    if (trades.length === 0) return [];
    const longTrades = trades.filter(t => t.direction === 'long');
    const shortTrades = trades.filter(t => t.direction === 'short');
    const longPnL = longTrades.reduce((sum, t) => sum + (t.result || 0), 0);
    const shortPnL = shortTrades.reduce((sum, t) => sum + (t.result || 0), 0);
    return [
      {
        type: 'LONG',
        trades: longTrades.length,
        winRate: longTrades.length > 0 ? Math.round((longTrades.filter(t => (t.result || 0) > 0).length / longTrades.length) * 100) : 0,
        totalPnL: Math.round(longPnL * 100) / 100,
        color: '#10b981',
      },
      {
        type: 'SHORT',
        trades: shortTrades.length,
        winRate: shortTrades.length > 0 ? Math.round((shortTrades.filter(t => (t.result || 0) > 0).length / shortTrades.length) * 100) : 0,
        totalPnL: Math.round(shortPnL * 100) / 100,
        color: '#ef4444',
      },
    ];
  }, [trades]);

  // Discipline score trend
  const { disciplineTrend, currentDisciplineScore, disciplineLevel } = useMemo(() => {
    if (trades.length === 0) {
      return { 
        disciplineTrend: [], 
        currentDisciplineScore: 0,
        disciplineLevel: { level: 'No Data', color: 'bg-muted text-muted-foreground', description: '' }
      };
    }

    const mappedTrades = trades.map(t => AIApiService.mapCSVToTradeObject(t));
    const score = calculateDisciplineScore(mappedTrades).overall;
    const level = getDisciplineLevel(score);

    const sortedTrades = [...mappedTrades].sort((a, b) => a.entryTime.getTime() - b.entryTime.getTime());
    
    const monthlyData = new Map<string, typeof mappedTrades>();
    sortedTrades.forEach(t => {
      const monthKey = t.entryTime.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, []);
      }
      monthlyData.get(monthKey)!.push(t);
    });

    const trendData: { month: string; score: number }[] = [];
    let cumulativeTrades: typeof mappedTrades = [];

    // Map maintains insertion order, so this naturally iterates oldest to newest
    monthlyData.forEach((monthTrades, month) => {
      cumulativeTrades = [...cumulativeTrades, ...monthTrades];
      trendData.push({
        month,
        score: calculateDisciplineScore(cumulativeTrades).overall
      });
    });

    return { 
      disciplineTrend: trendData.slice(-6), // Trend shows at most last 6 months
      currentDisciplineScore: score,
      disciplineLevel: level
    };
  }, [trades]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse">
          <div className="h-8 w-8 bg-primary rounded-full animate-spin"></div>
          <p className="mt-4 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-responsive-xl">Trading Analytics</h1>
            <p className="text-muted-foreground">Professional performance analysis</p>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <Badge variant="secondary" className="px-3 py-1 sm:px-4 sm:py-2">
              {trades.length} Trades
            </Badge>
            <Badge variant="secondary" className="px-3 py-1 sm:px-4 sm:py-2">
              Last 30 Days
            </Badge>
          </div>
        </div>

        {/* Performance Metrics Cards - IMPROVED */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          <ImprovedMetricCard
            title="Actual R"
            value={metrics.actualR.toFixed(2)}
            color={metrics.actualR >= 0 ? 'text-success' : 'text-destructive'}
            icon={<Target className="h-4 w-4" />}
            trend={metrics.actualR >= 0 ? 'up' : 'down'}
          />
          <ImprovedMetricCard
            title="Target R"
            value={metrics.targetR.toFixed(2)}
            color="text-primary"
            icon={<TrendingUp className="h-4 w-4" />}
            trend="up"
          />
          <ImprovedMetricCard
            title="Win Rate"
            value={`${metrics.winRate.toFixed(1)}%`}
            color={metrics.winRate >= 50 ? 'text-success' : 'text-destructive'}
            icon={<Activity className="h-4 w-4" />}
            trend={metrics.winRate >= 50 ? 'up' : 'down'}
          />
          <ImprovedMetricCard
            title="Avg Win/Loss"
            value={`${metrics.avgRWin.toFixed(2)}/${Math.abs(metrics.avgRLoss).toFixed(2)}`}
            color="text-primary"
            icon={<BarChart3 className="h-4 w-4" />}
            trend="up"
          />
          <ImprovedMetricCard
            title="Total P&L"
            value={`$${trades.reduce((sum, t) => sum + t.result, 0).toFixed(0)}`}
            color={trades.reduce((sum, t) => sum + t.result, 0) >= 0 ? 'text-success' : 'text-destructive'}
            icon={<DollarSign className="h-4 w-4" />}
            trend={trades.reduce((sum, t) => sum + t.result, 0) >= 0 ? 'up' : 'down'}
          />
          <ImprovedMetricCard
            title="Max Drawdown"
            value={`-${metrics.maxDrawdown.toFixed(2)}R`}
            color="text-warning"
            icon={<AlertCircle className="h-4 w-4" />}
            trend="down"
          />
        </div>

        {/* Equity Curve - KEEP AS IS */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="glass-card">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Equity Curve
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={equityCurve}>
                    <defs>
                      <linearGradient id="equityGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.05}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="index" 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                    />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))"
                      fontSize={12}
                      tickFormatter={(value) => `$${value.toLocaleString()}`}
                    />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px'
                      }}
                      formatter={(value: number) => [`$${value.toLocaleString()}`, 'Equity']}
                    />
                    <ReferenceLine y={0} stroke="hsl(var(--muted-foreground))" strokeDasharray="5 5" />
                    <Area
                      type="monotone"
                      dataKey="equity"
                      stroke="#10b981"
                      fillOpacity={1}
                      fill="url(#equityGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Quick Stats - IMPROVED */}
          <div className="space-y-4">
            <ImprovedQuickStatCard
              title="Total Trades"
              value={metrics.totalTrades}
              icon={<Target className="h-5 w-5" />}
              color="blue"
            />
            <ImprovedQuickStatCard
              title="Win Rate"
              value={`${metrics.winRate.toFixed(1)}%`}
              icon={<Activity className="h-5 w-5" />}
              color={metrics.winRate >= 50 ? 'green' : 'orange'}
            />
            <ImprovedQuickStatCard
              title="Max Drawdown"
              value={`-${metrics.maxDrawdown.toFixed(2)}R`}
              icon={<AlertCircle className="h-5 w-5" />}
              color="red"
            />
            <ImprovedQuickStatCard
              title="Total P&L"
              value={`$${trades.reduce((sum, t) => sum + t.result, 0).toFixed(0)}`}
              icon={<DollarSign className="h-5 w-5" />}
              color={trades.reduce((sum, t) => sum + t.result, 0) >= 0 ? 'green' : 'red'}
            />
          </div>
        </div>

        {/* Bottom Section - IMPROVED */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Long vs Short Analysis — Grouped Bar Chart */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Long vs Short Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              {longShortData.length > 0 ? (
                <>
                  <ResponsiveContainer width="100%" height={280}>
                    <BarChart
                      data={longShortData}
                      margin={{ top: 8, right: 16, left: 8, bottom: 8 }}
                      barCategoryGap="28%"
                      barGap={4}
                    >
                      <defs>
                        <linearGradient id="lgBarLong" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#10b981" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#10b981" stopOpacity={0.55}/>
                        </linearGradient>
                        <linearGradient id="lgBarShort" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#ef4444" stopOpacity={1}/>
                          <stop offset="100%" stopColor="#ef4444" stopOpacity={0.55}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                      <XAxis
                        dataKey="metric"
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={12}
                        tickLine={false}
                        axisLine={false}
                      />
                      <YAxis
                        stroke="hsl(var(--muted-foreground))"
                        fontSize={11}
                        tickLine={false}
                        axisLine={false}
                        width={50}
                        tickFormatter={(v) => {
                          if (Math.abs(v) >= 1000) return `${(v / 1000).toFixed(1)}k`;
                          return String(v);
                        }}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '10px',
                          fontSize: 13,
                        }}
                        formatter={(value: number, name: string, props) => {
                          const metric = props?.payload?.metric as string;
                          if (metric === 'Win Rate %') return [`${value}%`, name];
                          if (metric === 'Total P&L' || metric === 'Avg Return') return [`$${value.toFixed(2)}`, name];
                          return [value, name];
                        }}
                        cursor={{ fill: 'hsl(var(--muted))', opacity: 0.4 }}
                      />
                      <Legend
                        wrapperStyle={{ paddingTop: '12px', fontSize: 13 }}
                        iconType="circle"
                        iconSize={10}
                        formatter={(value) => (
                          <span style={{ color: 'hsl(var(--foreground))', fontWeight: 500 }}>{value}</span>
                        )}
                      />
                      <Bar dataKey="LONG" fill="url(#lgBarLong)" radius={[6, 6, 0, 0]} maxBarSize={56} />
                      <Bar dataKey="SHORT" fill="url(#lgBarShort)" radius={[6, 6, 0, 0]} maxBarSize={56} />
                    </BarChart>
                  </ResponsiveContainer>

                  {/* Summary cards */}
                  <div className="grid grid-cols-2 gap-4 mt-5">
                    {longShortSummary.map((data) => (
                      <div
                        key={data.type}
                        className="p-3 bg-gradient-to-r from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 rounded-xl border border-border/40"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span
                            className="font-bold text-sm px-2 py-0.5 rounded-md text-white"
                            style={{ backgroundColor: data.color }}
                          >
                            {data.type}
                          </span>
                          <Badge variant="outline" className="text-xs">
                            {data.trades} trades
                          </Badge>
                        </div>
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            Win Rate: <span className="font-semibold text-foreground">{data.winRate}%</span>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Total P&L:{' '}
                            <span className={`font-semibold ${data.totalPnL >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                              ${data.totalPnL.toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-64 text-muted-foreground">
                  <div className="text-center">
                    <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No trade data available</p>
                    <p className="text-sm">Add some trades to see the analysis</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Discipline Score Trend - IMPROVED */}
          <Card className="glass-card">
            <CardHeader className="pb-4">
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Discipline Score Trend
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={disciplineTrend}>
                  <defs>
                    <linearGradient id="disciplineGradient" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#f59e0b"/>
                      <stop offset="100%" stopColor="#f97316"/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" domain={[0, 100]} />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px'
                    }}
                    formatter={(value: number) => [`${value}/100`, 'Discipline Score']}
                  />
                  <Line
                    type="monotone"
                    dataKey="score"
                    stroke="url(#disciplineGradient)"
                    strokeWidth={3}
                    dot={{ fill: '#f59e0b', r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
              
              <div className="mt-6 text-center">
                <div className="text-2xl font-bold">
                  {currentDisciplineScore}
                </div>
                <div className="text-sm text-muted-foreground">Current Discipline Score</div>
                {disciplineLevel && disciplineLevel.level !== 'No Data' && (
                  <Badge className={`mt-2 ${disciplineLevel.color} border-0 bg-secondary/50`}>
                    {disciplineLevel.level}
                  </Badge>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// IMPROVED Metric Card Component
interface ImprovedMetricCardProps {
  title: string;
  value: string;
  color: string;
  icon: React.ReactNode;
  trend: 'up' | 'down';
}

function ImprovedMetricCard({ title, value, color, icon, trend }: ImprovedMetricCardProps) {
  return (
    <Card className="group relative overflow-hidden glass-card hover:scale-[1.02] transition-all duration-200 cursor-pointer">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200"></div>
      <CardContent className="relative p-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="p-1.5 bg-gradient-to-br from-primary/20 to-primary/30 rounded-md flex items-center justify-center">
              <div className={`w-4 h-4 ${color}`}>{icon}</div>
            </div>
            <div className={`flex items-center gap-1 text-xs font-medium ${
              trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            </div>
          </div>
          <div>
            <div className={`text-lg font-bold ${color}`}>
              {value}
            </div>
            <div className="text-xs text-muted-foreground">{title}</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// IMPROVED Quick Stat Card Component
interface ImprovedQuickStatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'red' | 'orange';
}

function ImprovedQuickStatCard({ title, value, icon, color }: ImprovedQuickStatCardProps) {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    red: 'from-red-500 to-red-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <Card className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-700 border-0 shadow-md hover:shadow-lg transition-all duration-200">
      <CardContent className="p-4">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-muted-foreground">{title}</span>
            <div className={`p-1.5 bg-gradient-to-br ${colorClasses[color]} rounded-md flex items-center justify-center`}>
              <div className="w-4 h-4 text-white">{icon}</div>
            </div>
          </div>
          <div className="text-xl font-bold text-foreground">
            {value}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
