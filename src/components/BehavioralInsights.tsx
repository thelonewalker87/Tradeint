import { motion, AnimatePresence } from 'framer-motion';
import { Brain, AlertTriangle, Info, TrendingDown, Clock, Target, Zap, Loader2, Sparkles, TrendingUp } from 'lucide-react';
import { analyzeBehavioralPatterns, getBehavioralSummary } from '@/lib/behavioral';
import { detectKeyObservations } from '@/lib/correlations';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CSVTradeData } from '@/csvManager';
import { AnalysePerformanceResult, AIApiService } from '@/services/AIApiService';


interface BehavioralInsightsProps {
  trades: CSVTradeData[];
  aiInsights?: AnalysePerformanceResult | null;
  isAnalyzing?: boolean;
  onAnalyze?: () => void;
}

const severityConfig = {
  critical: {
    class: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 border-red-200',
    icon: AlertTriangle,
    label: 'Critical',
    color: 'text-red-600'
  },
  high: {
    class: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300 border-orange-200',
    icon: AlertTriangle,
    label: 'High',
    color: 'text-orange-600'
  },
  medium: {
    class: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200',
    icon: AlertTriangle,
    label: 'Medium',
    color: 'text-yellow-600'
  },
  low: {
    class: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200',
    icon: Info,
    label: 'Low',
    color: 'text-blue-600'
  },
  positive: {
    class: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 border-green-200',
    icon: TrendingUp,
    label: 'Positive',
    color: 'text-green-600'
  }
};

const patternIcons = {
  'revenge-trading':      Zap,
  'overtrading':          Clock,
  'position-escalation':  TrendingDown,
  'holding-losers':       Target,
  'poor-recovery':        Brain,
  'time-pattern':         Clock,
  'setup-bias':           Target,
  'revenge-sizing':       Zap,
  'overconfidence':       TrendingUp,
  'holding-bias':         Target,
  'emotional-trading':    Brain,
  'discipline-breakdown': AlertTriangle,
  'instrument-bias':      TrendingDown,
  'positive':             TrendingUp,
};

export default function BehavioralInsights({ trades, aiInsights, isAnalyzing, onAnalyze }: BehavioralInsightsProps) {
  // Use local analysis for stats, with mapping
  const mappedTrades = trades.map(t => AIApiService.mapCSVToTradeObject(t));
  const localInsights = analyzeBehavioralPatterns(mappedTrades);
  const summary = getBehavioralSummary(localInsights);

  // Correlation-based key observations — replaces dummy data
  const keyObservations = detectKeyObservations(trades);

  return (
    <Card className="glass-card border-0 shadow-lg h-full overflow-hidden">
      <CardHeader className="pb-4 flex flex-row items-center justify-between">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl">
            <Brain className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">AI Behavioral Insights</h3>
            <p className="text-sm text-muted-foreground">
              {summary.totalInsights} patterns detected • ${Math.abs(summary.totalImpact || 0).toFixed(0)} impact
            </p>
          </div>
        </CardTitle>

        {onAnalyze && (
          <button
            onClick={onAnalyze}
            disabled={isAnalyzing || trades.length === 0}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 hover:bg-primary/20 text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnalyzing ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            <span className="text-xs font-semibold">AI Coach</span>
          </button>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          {aiInsights ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-purple-500/10 border border-primary/20"
            >
              <div className="flex items-start gap-3">
                <div className="p-1.5 bg-primary/20 rounded-lg shrink-0 mt-1">
                  <Sparkles className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary mb-1">Dr. Drawdown's Diagnosis</h4>
                  <p className="text-sm border-l-2 border-primary/20 pl-3 italic text-muted-foreground mb-3 leading-relaxed">
                    "{aiInsights.answer}"
                  </p>

                  <div className="space-y-3">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider font-bold text-red-500 mb-1">Primary Weakness</p>
                      <p className="text-sm font-medium">{aiInsights.top_weakness}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-green-500 mb-1">Patterns</p>
                        <ul className="text-[10px] space-y-1">
                          {aiInsights.positive_patterns.map((p, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-green-500" />
                              {p}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-[10px] uppercase tracking-wider font-bold text-blue-500 mb-1">Recommendations</p>
                        <ul className="text-[10px] space-y-1">
                          {aiInsights.recommendations.map((r, i) => (
                            <li key={i} className="flex items-center gap-1.5">
                              <div className="w-1 h-1 rounded-full bg-blue-500" />
                              {r}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : isAnalyzing ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-12 flex flex-col items-center justify-center text-center space-y-3"
            >
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
              <p className="text-sm text-muted-foreground">Dr. Drawdown is analyzing your trading habits...</p>
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Statistical Patterns</h4>
          <div className="grid grid-cols-1 gap-2">
            {Object.entries(summary.patterns).map(([pattern, count]) => {
              if (count === 0) return null;
              const Icon = patternIcons[pattern as keyof typeof patternIcons] || Brain;
              const patternName = pattern.split('-').map(word =>
                word.charAt(0).toUpperCase() + word.slice(1)
              ).join(' ');

              return (
                <div key={pattern} className="flex items-center justify-between p-2 rounded-lg bg-muted/20 border border-muted/10 hover:border-muted/30 transition-colors">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">{patternName}</span>
                  </div>
                  <Badge variant="secondary" className="text-[10px] font-bold">
                    {count} {count === 1 ? 'instance' : 'instances'}
                  </Badge>
                </div>
              );
            })}
          </div>
        </div>

        <div className="space-y-3">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Key Observations</h4>
          <div className="space-y-3">
            {keyObservations.length === 0 ? (
              <div className="p-4 rounded-xl border bg-card/30 text-center">
                <Target className="h-6 w-6 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No significant patterns detected yet. Upload more trades for deeper insights.</p>
              </div>
            ) : (
              keyObservations.map((insight, i) => {
                const sev = severityConfig[insight.severity] ?? severityConfig.low;
                const PatternIcon = patternIcons[insight.type as keyof typeof patternIcons] || Brain;

                return (
                  <motion.div
                    key={insight.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.3 }}
                    className="p-4 rounded-xl border bg-card/30 backdrop-blur-sm hover:bg-card/50 transition-all duration-200"
                  >
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 mt-1">
                        <PatternIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                          <Badge className={`text-[10px] font-bold ${sev.class} border`}>
                            {sev.label}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">
                            {insight.affectedTrades} trade{insight.affectedTrades !== 1 ? 's' : ''} affected
                          </span>
                        </div>
                        <h5 className="text-sm font-bold mb-1">{insight.title}</h5>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          {insight.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {trades.length === 0 && (
          <div className="text-center py-12">
            <Brain className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-sm text-muted-foreground">
              No data available. Upload a CSV to generate insights.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}