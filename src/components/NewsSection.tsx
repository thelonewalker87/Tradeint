import { useState } from 'react';
import { motion } from 'framer-motion';
import { Newspaper, ToggleLeft, ToggleRight } from 'lucide-react';
import { newsItems, performanceMetrics, newsPerformanceMetrics } from '@/data/mockData';
import PerformanceCards from './PerformanceCards';

const impactBadge = {
  high: 'impact-high',
  medium: 'impact-medium',
  low: 'impact-low',
};

export default function NewsSection() {
  const [showNewsPerf, setShowNewsPerf] = useState(false);

  return (
    <div className="space-y-4">
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Newspaper className="w-5 h-5 text-primary" />
            <h3 className="text-sm font-semibold">Economic Calendar</h3>
          </div>
          <button
            onClick={() => setShowNewsPerf(!showNewsPerf)}
            className="flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            {showNewsPerf ? <ToggleRight className="w-5 h-5 text-primary" /> : <ToggleLeft className="w-5 h-5" />}
            Show performance during news
          </button>
        </div>

        <div className="space-y-2">
          {newsItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${impactBadge[item.impact]}`}>
                  {item.impact}
                </span>
                <span className="text-sm truncate">{item.title}</span>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-xs font-mono text-muted-foreground">{item.currency}</span>
                <span className="text-xs text-muted-foreground">{item.time}</span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {showNewsPerf && (
        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
          <div className="mb-2">
            <p className="text-xs text-muted-foreground">Performance during news events (degraded metrics):</p>
          </div>
          <PerformanceCards metrics={newsPerformanceMetrics} />
        </motion.div>
      )}
    </div>
  );
}
