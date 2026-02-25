import { useState } from 'react';
import { motion } from 'framer-motion';
import { AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { equityCurveData, winLossData, disciplineTrendData, tradeJournal } from '@/data/mockData';

const pairDistribution = (() => {
  const map: Record<string, number> = {};
  tradeJournal.forEach(t => { map[t.pair] = (map[t.pair] || 0) + 1; });
  return Object.entries(map).map(([name, value]) => ({ name, value }));
})();

const colors = ['hsl(200,90%,50%)', 'hsl(145,70%,45%)', 'hsl(35,90%,55%)', 'hsl(0,70%,50%)', 'hsl(270,60%,60%)', 'hsl(180,60%,45%)'];

const directionData = [
  { name: 'Long', wins: tradeJournal.filter(t => t.direction === 'long' && t.outcome === 'win').length, losses: tradeJournal.filter(t => t.direction === 'long' && t.outcome === 'loss').length },
  { name: 'Short', wins: tradeJournal.filter(t => t.direction === 'short' && t.outcome === 'win').length, losses: tradeJournal.filter(t => t.direction === 'short' && t.outcome === 'loss').length },
];

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="glass-card px-3 py-2 text-xs">
      <p className="text-muted-foreground mb-1">{label}</p>
      {payload.map((p: any, i: number) => (
        <p key={i} style={{ color: p.color }} className="font-medium">{p.name}: {p.value}</p>
      ))}
    </div>
  );
};

export default function AnalyticsPage() {
  return (
    <div className="space-y-6 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-bold mb-1">Analytics</h1>
        <p className="text-sm text-muted-foreground">Deep dive into your trading patterns</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Cumulative P&L */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Cumulative P&L</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={equityCurveData}>
              <defs>
                <linearGradient id="plGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(200,90%,50%)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="hsl(200,90%,50%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
              <XAxis dataKey="date" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="equity" stroke="hsl(200,90%,50%)" strokeWidth={2} fill="url(#plGrad)" name="P&L" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Pair Distribution */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Pair Distribution</h3>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={pairDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                {pairDistribution.map((_, i) => <Cell key={i} fill={colors[i % colors.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Direction Performance */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Long vs Short Performance</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={directionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
              <XAxis dataKey="name" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="wins" fill="hsl(145,70%,45%)" radius={[4, 4, 0, 0]} name="Wins" />
              <Bar dataKey="losses" fill="hsl(0,70%,50%)" radius={[4, 4, 0, 0]} name="Losses" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Discipline Trend */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="glass-card p-5">
          <h3 className="text-sm font-semibold mb-4">Discipline Score Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={disciplineTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220,15%,20%)" />
              <XAxis dataKey="week" tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis domain={[60, 100]} tick={{ fill: 'hsl(215,15%,55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="hsl(200,90%,50%)" strokeWidth={2.5} dot={{ r: 4, fill: 'hsl(200,90%,50%)' }} name="Score" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}
