import { Trade, DisciplineScore } from '../../data/types';
import { analyzeBehavioralPatterns } from '../behavioral';

export function calculateRiskConsistencyScore(trades: Trade[]): number {
  if (trades.length === 0) return 100;

  // --- Metric 1: Position size consistency (CV-based, but milder penalty) ---
  const positionSizes = trades.map(t => t.positionSize).filter(s => s > 0);
  let positionScore = 80; // default reasonable if no valid sizes
  if (positionSizes.length > 1) {
    const avgPos = positionSizes.reduce((a, b) => a + b, 0) / positionSizes.length;
    const posVariance = positionSizes.reduce((sum, s) => sum + Math.pow(s - avgPos, 2), 0) / positionSizes.length;
    const posCV = avgPos > 0 ? Math.sqrt(posVariance) / avgPos : 0;
    // CV of 0 = perfect (100), CV of 1.0 = very inconsistent (0), scale gently
    positionScore = Math.max(0, Math.min(100, 100 - posCV * 100));
  }

  // --- Metric 2: % of trades with a positive planned R:R >= 1.0 ---
  const rrQuality = trades.filter(t => t.riskReward >= 1.0).length / trades.length;
  const rrScore = rrQuality * 100; // 100% of trades with RR>=1 = 100 score

  // --- Metric 3: Stop loss adherence (penalise "no-stop-loss" violations) ---
  const noStopTrades = trades.filter(t =>
    t.ruleViolations.some(v =>
      v.type === 'no-stop-loss' || v.description?.toLowerCase().includes('stop')
    )
  ).length;
  const stopAdherence = Math.max(0, 100 - (noStopTrades / trades.length) * 100);

  // Weighted combination
  return (positionScore * 0.35 + rrScore * 0.45 + stopAdherence * 0.20);
}

export function calculateRuleAdherenceScore(trades: Trade[]): number {
  if (trades.length === 0) return 100;
  
  const totalTrades = trades.length;
  const tradesWithViolations = trades.filter(t => t.ruleViolations.length > 0).length;
  
  // Calculate violation severity weights
  let violationScore = 0;
  trades.forEach(trade => {
    trade.ruleViolations.forEach(violation => {
      const severityWeight = {
        low: 1,
        medium: 3,
        high: 6,
        critical: 10
      }[violation.severity];
      
      violationScore += severityWeight;
    });
  });
  
  // Normalize to 0-100 scale
  const maxPossibleScore = totalTrades * 10; // Assuming worst case of critical violations
  const adherenceScore = Math.max(0, 100 - (violationScore / maxPossibleScore * 100));
  
  return adherenceScore;
}

export function calculateEmotionalControlScore(trades: Trade[]): number {
  if (trades.length === 0) return 100;
  
  const emotionalTrades = trades.filter(t => t.emotionalState !== 'calm');
  const totalTrades = trades.length;
  
  // Calculate emotional state impact
  let emotionalImpact = 0;
  const stateWeights = {
    calm: 0,
    fearful: 2,
    greedy: 3,
    revenge: 5,
    overconfident: 4
  };
  
  trades.forEach(trade => {
    emotionalImpact += stateWeights[trade.emotionalState];
  });
  
  // Calculate emotional trading performance
  const calmTrades = trades.filter(t => t.emotionalState === 'calm');
  const calmWinRate = calmTrades.length > 0 ? 
    calmTrades.filter(t => t.profitLoss > 0).length / calmTrades.length : 0;
  
  const emotionalWinRate = emotionalTrades.length > 0 ?
    emotionalTrades.filter(t => t.profitLoss > 0).length / emotionalTrades.length : 0;
  
  // Score based on emotional frequency and performance
  const frequencyScore = Math.max(0, 100 - (emotionalTrades.length / totalTrades * 100));
  const performanceScore = emotionalWinRate >= calmWinRate ? 100 : 
    Math.max(0, 100 - ((calmWinRate - emotionalWinRate) * 200));
  
  return (frequencyScore + performanceScore) / 2;
}

export function calculateConsistencyScore(trades: Trade[]): number {
  if (trades.length === 0) return 0;

  // For small datasets, use a simplified but real score based on:
  // 1. Setup type consistency (are they sticking to one setup?)
  // 2. P&L trend consistency (not wildly erratic)
  // 3. Rule violation trend (improving or worsening?)
  
  // Setup consistency — what % of trades use the dominant setup?
  const setupCounts = new Map<string, number>();
  trades.forEach(trade => {
    setupCounts.set(trade.setupType, (setupCounts.get(trade.setupType) || 0) + 1);
  });
  const dominantSetup = Math.max(...setupCounts.values());
  const setupConsistency = (dominantSetup / trades.length) * 100;

  // P&L consistency — penalize high variance relative to average
  const pnls = trades.map(t => t.profitLoss);
  const avgPnL = pnls.reduce((sum, v) => sum + v, 0) / pnls.length;
  const variance = pnls.reduce((sum, v) => sum + Math.pow(v - avgPnL, 2), 0) / pnls.length;
  const stdDev = Math.sqrt(variance);
  const cv = Math.abs(avgPnL) > 0 ? stdDev / Math.abs(avgPnL) : 1;
  const pnlConsistency = Math.max(0, 100 - Math.min(cv * 40, 100));

  // Violation trend — are violations happening more toward the end (worsening)?
  const half = Math.floor(trades.length / 2);
  const firstHalfViolations = trades.slice(0, half).filter(t => t.ruleViolations.length > 0).length;
  const secondHalfViolations = trades.slice(half).filter(t => t.ruleViolations.length > 0).length;
  // If violations are decreasing → good consistency (improving discipline)
  const violationTrend = secondHalfViolations <= firstHalfViolations ? 80 : 40;

  // For larger datasets, also use time-based consistency
  if (trades.length >= 10) {
    const tradesByHour = new Map<number, number>();
    const tradesByDay = new Map<number, number>();

    trades.forEach(trade => {
      const hour = trade.entryTime.getHours();
      const day = trade.entryTime.getDay();
      tradesByHour.set(hour, (tradesByHour.get(hour) || 0) + 1);
      tradesByDay.set(day, (tradesByDay.get(day) || 0) + 1);
    });

    const hourValues = Array.from(tradesByHour.values());
    const dayValues = Array.from(tradesByDay.values());
    const hourAvg = hourValues.reduce((a, b) => a + b, 0) / hourValues.length;
    const dayAvg = dayValues.reduce((a, b) => a + b, 0) / dayValues.length;
    const hourVariance = hourValues.reduce((sum, val) => sum + Math.pow(val - hourAvg, 2), 0) / hourValues.length;
    const dayVariance = dayValues.reduce((sum, val) => sum + Math.pow(val - dayAvg, 2), 0) / dayValues.length;
    const timeConsistency = Math.max(0, 100 - (Math.sqrt(hourVariance) + Math.sqrt(dayVariance)) / 2);

    return (timeConsistency * 0.25 + setupConsistency * 0.35 + pnlConsistency * 0.25 + violationTrend * 0.15);
  }

  return (setupConsistency * 0.45 + pnlConsistency * 0.35 + violationTrend * 0.20);
}


export function calculateDisciplineScore(trades: Trade[]): DisciplineScore {
  if (trades.length === 0) {
    return {
      overall: 0,
      riskManagement: 0,
      ruleAdherence: 0,
      emotionalControl: 0,
      consistency: 0,
      breakdown: []
    };
  }
  
  // Calculate individual component scores
  const riskManagement = calculateRiskConsistencyScore(trades);
  const ruleAdherence = calculateRuleAdherenceScore(trades);
  const emotionalControl = calculateEmotionalControlScore(trades);
  const consistency = calculateConsistencyScore(trades);
  
  // Weight the components
  const weights = {
    riskManagement: 0.3,
    ruleAdherence: 0.3,
    emotionalControl: 0.25,
    consistency: 0.15
  };
  
  const overall = 
    riskManagement * weights.riskManagement +
    ruleAdherence * weights.ruleAdherence +
    emotionalControl * weights.emotionalControl +
    consistency * weights.consistency;
  
  // Create detailed breakdown
  const breakdown = [
    {
      category: 'Risk Management',
      score: Math.round(riskManagement),
      weight: weights.riskManagement,
      factors: [
        'Position size consistency',
        'Risk-reward ratio consistency',
        'Stop loss adherence'
      ]
    },
    {
      category: 'Rule Adherence',
      score: Math.round(ruleAdherence),
      weight: weights.ruleAdherence,
      factors: [
        'Trading plan compliance',
        'Violation frequency',
        'Severity of violations'
      ]
    },
    {
      category: 'Emotional Control',
      score: Math.round(emotionalControl),
      weight: weights.emotionalControl,
      factors: [
        'Emotional trading frequency',
        'Performance under pressure',
        'Revenge trading avoidance'
      ]
    },
    {
      category: 'Consistency',
      score: Math.round(consistency),
      weight: weights.consistency,
      factors: [
        'Trading schedule regularity',
        'Setup consistency',
        'Performance stability'
      ]
    }
  ];
  
  return {
    overall: Math.round(overall),
    riskManagement: Math.round(riskManagement),
    ruleAdherence: Math.round(ruleAdherence),
    emotionalControl: Math.round(emotionalControl),
    consistency: Math.round(consistency),
    breakdown
  };
}

export function getDisciplineLevel(score: number): { level: string; color: string; description: string } {
  if (score >= 90) {
    return {
      level: 'Expert',
      color: 'text-green-600',
      description: 'Exceptional trading discipline with consistent rule-following'
    };
  } else if (score >= 80) {
    return {
      level: 'Excellent',
      color: 'text-emerald-600',
      description: 'Very strong discipline with minor areas for improvement'
    };
  } else if (score >= 70) {
    return {
      level: 'Good',
      color: 'text-blue-600',
      description: 'Solid discipline with some consistency issues'
    };
  } else if (score >= 60) {
    return {
      level: 'Fair',
      color: 'text-yellow-600',
      description: 'Moderate discipline requiring significant improvements'
    };
  } else if (score >= 50) {
    return {
      level: 'Poor',
      color: 'text-orange-600',
      description: 'Weak discipline with frequent rule violations'
    };
  } else {
    return {
      level: 'Critical',
      color: 'text-red-600',
      description: 'Severe discipline issues requiring immediate attention'
    };
  }
}

export function getImprovementRecommendations(score: DisciplineScore): string[] {
  const recommendations: string[] = [];
  
  if (score.riskManagement < 70) {
    recommendations.push('Implement fixed position sizing rules (e.g., 1% risk per trade)');
    recommendations.push('Use a risk-reward calculator before each trade');
    recommendations.push('Set maximum daily loss limits');
  }
  
  if (score.ruleAdherence < 70) {
    recommendations.push('Create and strictly follow a written trading plan');
    recommendations.push('Use pre-trade checklists for every setup');
    recommendations.push('Review trades weekly to identify rule violations');
  }
  
  if (score.emotionalControl < 70) {
    recommendations.push('Take breaks after consecutive losses');
    recommendations.push('Practice meditation or mindfulness techniques');
    recommendations.push('Set maximum trades per day/week limits');
  }
  
  if (score.consistency < 70) {
    recommendations.push('Establish fixed trading hours');
    recommendations.push('Focus on 1-2 high-probability setups');
    recommendations.push('Keep a detailed trading journal');
  }
  
  if (recommendations.length === 0) {
    recommendations.push('Maintain current discipline levels');
    recommendations.push('Continue refining your trading strategy');
  }
  
  return recommendations;
}
