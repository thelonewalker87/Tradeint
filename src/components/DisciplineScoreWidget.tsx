import { motion } from 'framer-motion';
import { Shield, TrendingUp, AlertTriangle, Brain, Target } from 'lucide-react';
import { calculateDisciplineScore, getDisciplineLevel, getImprovementRecommendations } from '@/lib/scoring';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { CSVTradeData } from '@/csvManager';
import { AIApiService } from '@/services/AIApiService';

const categoryIcons = {
  'Risk Management': Shield,
  'Rule Adherence': Target,
  'Emotional Control': Brain,
  'Consistency': TrendingUp
};

const categoryColors = {
  'Risk Management': 'from-blue-500 to-cyan-600',
  'Rule Adherence': 'from-green-500 to-emerald-600',
  'Emotional Control': 'from-purple-500 to-pink-600',
  'Consistency': 'from-orange-500 to-red-600'
};

interface DisciplineScoreWidgetProps {
  trades: CSVTradeData[];
}

export default function DisciplineScoreWidget({ trades }: DisciplineScoreWidgetProps) {
  // Map CSV data to Trade objects for the scoring logic
  const mappedTrades = trades.map(t => AIApiService.mapCSVToTradeObject(t));
  
  const disciplineScore = calculateDisciplineScore(mappedTrades);
  const level = getDisciplineLevel(disciplineScore.overall);
  const recommendations = getImprovementRecommendations(disciplineScore);

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center gap-3">
          <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
            <Shield className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-bold">Discipline Score</h3>
            <p className="text-sm text-muted-foreground">
              Overall trading discipline assessment
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Overall Score */}
        <div className="text-center space-y-3">
          <div className="relative inline-flex items-center justify-center">
            <div className="text-6xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              {disciplineScore.overall}
            </div>
            <div className="text-lg text-muted-foreground">/100</div>
          </div>
          
          <Badge className={`${level.color} border-0 text-sm px-3 py-1`}>
            {level.level}
          </Badge>
          
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {level.description}
          </p>
        </div>

        {/* Progress Ring Visualization */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <svg className="w-32 h-32 transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="hsl(var(--muted))"
                strokeWidth="12"
                fill="none"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="url(#score-gradient)"
                strokeWidth="12"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 56}`}
                strokeDashoffset={`${2 * Math.PI * 56 * (1 - disciplineScore.overall / 100)}`}
                className="transition-all duration-1000 ease-out"
              />
              <defs>
                <linearGradient id="score-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="hsl(200, 90%, 50%)" />
                  <stop offset="100%" stopColor="hsl(280, 90%, 60%)" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold">{disciplineScore.overall}%</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="space-y-4">
          <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
            Performance Breakdown
          </h4>
          <div className="grid grid-cols-1 gap-4">
            {disciplineScore.breakdown.map((category, index) => {
              const Icon = categoryIcons[category.category as keyof typeof categoryIcons];
              const colorClass = categoryColors[category.category as keyof typeof categoryColors];
              
              return (
                <motion.div
                  key={category.category}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`p-1.5 bg-gradient-to-r ${colorClass} rounded-lg`}>
                        <Icon className="h-3 w-3 text-white" />
                      </div>
                      <span className="text-sm font-medium">{category.category}</span>
                    </div>
                    <span className="text-sm font-bold">{Math.round(category.score)}%</span>
                  </div>
                  
                  <Progress 
                    value={category.score} 
                    className="h-2"
                  />
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* Improvement Recommendations */}
        {recommendations.length > 0 && (
          <div className="space-y-3">
            <h4 className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              Recommendations
            </h4>
            <div className="space-y-2">
              {recommendations.slice(0, 2).map((rec, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex items-start gap-2 p-3 rounded-lg bg-blue-500/5 border border-blue-500/20"
                >
                  <AlertTriangle className="h-4 w-4 text-blue-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-blue-800 dark:text-blue-200">
                    {rec}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
