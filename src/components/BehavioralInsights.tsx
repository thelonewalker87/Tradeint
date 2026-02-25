import { motion } from 'framer-motion';
import { Brain, AlertTriangle, Info } from 'lucide-react';
import { behavioralInsights } from '@/data/mockData';

const severityConfig = {
  high: { class: 'severity-high', icon: AlertTriangle, label: 'High' },
  medium: { class: 'severity-medium', icon: AlertTriangle, label: 'Medium' },
  low: { class: 'severity-low', icon: Info, label: 'Low' },
};

export default function BehavioralInsights() {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center gap-2 mb-4">
        <Brain className="w-5 h-5 text-primary" />
        <h3 className="text-sm font-semibold">AI Behavioral Insights</h3>
      </div>
      <div className="space-y-3">
        {behavioralInsights.map((insight, i) => {
          const sev = severityConfig[insight.severity];
          return (
            <motion.div
              key={insight.id}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.1, duration: 0.35 }}
              className="glass-card-hover p-4 flex gap-3"
            >
              <div className="shrink-0 mt-0.5">
                <sev.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <span className={`text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full border ${sev.class}`}>{sev.label}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{insight.category}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">{insight.message}</p>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
