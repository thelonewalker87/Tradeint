import { useState } from 'react';
import { LineChart, Line, BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { motion } from 'framer-motion';
import { equityCurveData, winLossData, disciplineTrendData, heatmapData } from '@/data/mockData';

const filters = ['Week', 'Month', 'All Time'] as const;

function sliceByFilter(data: any[], filter: string) {
  if (filter === 'Week') return data.slice(-4);
  if (filter === 'Month') return data.slice(-8);
  return data;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {typeof p.value === 'number' ? p.value.toLocaleString() : p.value}</p>
      ))}
    </div>
  );
};

export default function PerformanceCharts() {
  const [filter, setFilter] = useState<string>('All Time');

  const equity = sliceByFilter(equityCurveData, filter);
  const winLoss = sliceByFilter(winLossData, filter);
  const discipline = sliceByFilter(disciplineTrendData, filter);

  return (
    <div className="space-y-6">
      {/* Filter tabs */}
      <div className="flex gap-1 bg-secondary/50 p-1 rounded-lg w-fit">
        {filters.map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Equity Curve */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Equity Curve</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={equity}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200, 90%, 50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(200, 90%, 50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="equity" stroke="hsl(200, 90%, 50%)" strokeWidth={2} fill="url(#eqGrad)" name="Equity" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Win/Loss Distribution */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Win/Loss Distribution</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={winLoss} barGap={2}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="month" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wins" fill="hsl(145, 70%, 45%)" radius={[4, 4, 0, 0]} name="Wins" />
              <Bar dataKey="losses" fill="hsl(0, 70%, 50%)" radius={[4, 4, 0, 0]} name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Time-of-Day Heatmap */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Time-of-Day Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr>
                  <th className="text-left text-muted-foreground font-medium p-2">Time</th>
                  {['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map(d => (
                    <th key={d} className="text-center text-muted-foreground font-medium p-2">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {heatmapData.map(row => (
                  <tr key={row.hour}>
                    <td className="p-2 font-mono text-muted-foreground">{row.hour}</td>
                    {(['mon', 'tue', 'wed', 'thu', 'fri'] as const).map(day => {
                      const val = row[day];
                      const bg = val > 2 ? 'bg-success/30' : val > 0 ? 'bg-success/15' : val > -1 ? 'bg-destructive/10' : 'bg-destructive/25';
                      return (
                        <td key={day} className="p-1">
                          <div className={`${bg} rounded-md p-2 text-center font-mono font-medium ${val >= 0 ? 'text-success' : 'text-destructive'}`}>
                            {val > 0 ? '+' : ''}{val.toFixed(1)}%
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Discipline Score Trend */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Discipline Score Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={discipline}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: 'hsl(215, 15%, 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="hsl(200, 90%, 50%)" strokeWidth={2} dot={{ r: 3, fill: 'hsl(200, 90%, 50%)' }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
