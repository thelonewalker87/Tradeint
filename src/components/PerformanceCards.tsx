import { motion } from 'framer-motion';
import { DollarSign, Target, TrendingUp, Brain, Shield } from 'lucide-react';
import AnimatedCounter from './AnimatedCounter';

interface Metrics {
  totalPnL: number;
  winRate: number;
  avgRiskReward: number;
  expectancy: number;
  disciplineScore: number;
}

const cardConfig = [
  { key: 'totalPnL', label: 'Total P&L', icon: DollarSign, prefix: '$', suffix: '', decimals: 2 },
  { key: 'winRate', label: 'Win Rate', icon: Target, prefix: '', suffix: '%', decimals: 1 },
  { key: 'avgRiskReward', label: 'Avg Risk-Reward', icon: TrendingUp, prefix: '', suffix: 'R', decimals: 2 },
  { key: 'expectancy', label: 'Expectancy', icon: Brain, prefix: '', suffix: '', decimals: 2 },
  { key: 'disciplineScore', label: 'Discipline Score', icon: Shield, prefix: '', suffix: '/100', decimals: 0 },
] as const;

export default function PerformanceCards({ metrics }: { metrics: Metrics }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
      {cardConfig.map((c, i) => {
        const val = metrics[c.key as keyof Metrics];
        const isPositive = c.key === 'totalPnL' ? val > 0 : true;
        return (
          <motion.div
            key={c.key}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.4 }}
            className="glass-card-hover p-5 flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{c.label}</span>
              <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <c.icon className="w-4 h-4 text-primary" />
              </div>
            </div>
            <div className={`text-2xl font-bold ${c.key === 'totalPnL' ? (isPositive ? 'text-success' : 'text-destructive') : ''}`}>
              <AnimatedCounter end={val} prefix={c.prefix} suffix={c.suffix} decimals={c.decimals} />
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
