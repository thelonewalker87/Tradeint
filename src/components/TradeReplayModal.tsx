import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowUpRight, ArrowDownRight, AlertTriangle, Lightbulb } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, ResponsiveContainer, ReferenceLine, ReferenceDot } from 'recharts';
import { Trade } from '@/data/mockData';

// Generate mock price data for replay
function generatePriceData(trade: Trade) {
  const points = 50;
  const data = [];
  const range = Math.abs(trade.exit - trade.entry) * 3;
  const start = Math.min(trade.entry, trade.exit) - range * 0.3;
  const entryIdx = 15;
  const exitIdx = 40;

  for (let i = 0; i < points; i++) {
    const noise = (Math.random() - 0.5) * range * 0.4;
    let price: number;
    if (i < entryIdx) {
      price = start + (trade.entry - start) * (i / entryIdx) + noise;
    } else if (i < exitIdx) {
      const progress = (i - entryIdx) / (exitIdx - entryIdx);
      price = trade.entry + (trade.exit - trade.entry) * progress + noise;
    } else {
      price = trade.exit + noise * 1.5;
    }
    data.push({ idx: i, price: parseFloat(price.toFixed(5)) });
  }
  return { data, entryIdx, exitIdx };
}

const recommendations: Record<string, string> = {
  'Oversized Position': 'Stick to your maximum 1.5% risk per trade rule. This position exceeded your plan by 40%.',
  'Traded During News': 'Avoid entering positions within 15 minutes of high-impact news releases. Wait for volatility to settle.',
  'No Stop Loss': 'Always set a stop loss before entering. Use ATR-based stops for dynamic protection.',
  'Revenge Trade': 'After 2 consecutive losses, take a mandatory 30-minute break. Review your journal before re-entering.',
};

export default function TradeReplayModal({ trade, onClose }: { trade: Trade | null; onClose: () => void }) {
  if (!trade) return null;

  const { data, entryIdx, exitIdx } = generatePriceData(trade);
  const recommendation = trade.ruleViolation ? recommendations[trade.ruleViolation] || 'Follow your trading plan strictly.' : 'This trade followed your rules — well done!';

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 16 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 16 }}
          transition={{ duration: 0.25 }}
          className="glass-card w-full max-w-2xl max-h-[90vh] overflow-y-auto"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-border">
            <div className="flex items-center gap-3">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${trade.outcome === 'win' ? 'bg-success/15' : 'bg-destructive/15'}`}>
                {trade.direction === 'long' ? <ArrowUpRight className={`w-4 h-4 ${trade.outcome === 'win' ? 'text-success' : 'text-destructive'}`} /> : <ArrowDownRight className={`w-4 h-4 ${trade.outcome === 'win' ? 'text-success' : 'text-destructive'}`} />}
              </div>
              <div>
                <h2 className="text-lg font-bold">{trade.pair} — {trade.id}</h2>
                <p className="text-xs text-muted-foreground">{trade.date} · {trade.direction.toUpperCase()} · {trade.positionSize} lots</p>
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-secondary transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Chart */}
          <div className="p-5">
            <h3 className="text-sm font-semibold mb-3">Price Action Replay</h3>
            <div className="bg-secondary/30 rounded-lg p-3">
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data}>
                  <XAxis dataKey="idx" hide />
                  <YAxis domain={['auto', 'auto']} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 10 }} axisLine={false} tickLine={false} tickCount={5} />
                  <Line type="monotone" dataKey="price" stroke="hsl(215, 15%, 55%)" strokeWidth={1.5} dot={false} />
                  <ReferenceLine y={trade.entry} stroke="hsl(200, 90%, 50%)" strokeDasharray="4 4" label={{ value: `Entry ${trade.entry}`, position: 'right', fill: 'hsl(200, 90%, 50%)', fontSize: 10 }} />
                  <ReferenceLine y={trade.exit} stroke={trade.outcome === 'win' ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 50%)'} strokeDasharray="4 4" label={{ value: `Exit ${trade.exit}`, position: 'right', fill: trade.outcome === 'win' ? 'hsl(145, 70%, 45%)' : 'hsl(0, 70%, 50%)', fontSize: 10 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Stats */}
          <div className="px-5 grid grid-cols-3 gap-3 mb-4">
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Result</p>
              <p className={`text-lg font-bold mono ${trade.result >= 0 ? 'text-success' : 'text-destructive'}`}>{trade.result >= 0 ? '+' : ''}${trade.result.toFixed(2)}</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Risk-Reward</p>
              <p className={`text-lg font-bold mono ${trade.rr >= 0 ? 'text-success' : 'text-destructive'}`}>{trade.rr.toFixed(1)}R</p>
            </div>
            <div className="bg-secondary/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Outcome</p>
              <p className={`text-lg font-bold capitalize ${trade.outcome === 'win' ? 'text-success' : 'text-destructive'}`}>{trade.outcome}</p>
            </div>
          </div>

          {/* Recommendation */}
          <div className="px-5 pb-5">
            <div className={`rounded-lg p-4 ${trade.ruleViolation ? 'bg-destructive/10 border border-destructive/20' : 'bg-success/10 border border-success/20'}`}>
              <div className="flex items-start gap-2.5">
                {trade.ruleViolation ? <AlertTriangle className="w-4 h-4 text-destructive shrink-0 mt-0.5" /> : <Lightbulb className="w-4 h-4 text-success shrink-0 mt-0.5" />}
                <div>
                  <p className="text-sm font-semibold mb-1">
                    {trade.ruleViolation ? `Rule Violation: ${trade.ruleViolation}` : 'Clean Trade'}
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">{recommendation}</p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
