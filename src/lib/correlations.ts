// correlations.ts
// Detects behavioural correlations from raw trade data.
// These are PATTERNS not statistics — things that repeat across trades.
// No AI needed — all computed locally from CSVTradeData.

import { CSVTradeData } from '../csvManager';

export type Severity = 'critical' | 'high' | 'medium' | 'low' | 'positive';

export interface KeyObservation {
  id:             string;
  title:          string;
  description:    string;
  severity:       Severity;
  affectedTrades: number;
  type:           string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const avg = (arr: number[]): number =>
  arr.length === 0 ? 0 : arr.reduce((a, b) => a + b, 0) / arr.length;

const winRate = (trades: CSVTradeData[]): number =>
  trades.length === 0 ? 0 : trades.filter(t => t.result > 0).length / trades.length;

const getDayOfWeek = (dateStr: string): string =>
  new Date(dateStr).toLocaleDateString('en-US', { weekday: 'long' });

const pct = (n: number): string => `${(n * 100).toFixed(0)}%`;


// ── Detectors ─────────────────────────────────────────────────────────────────

// 1. Position size escalation after losses (revenge sizing)
function detectSizeEscalationAfterLoss(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 4) return null;
  let count = 0, comparisons = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (!prev.positionSize || !curr.positionSize) continue;
    comparisons++;
    if (curr.positionSize > prev.positionSize * 1.2 && prev.result <= 0) count++;
  }
  if (comparisons === 0) return null;
  if (count >= 3 && count / comparisons > 0.15) {
    return {
      id: 'size-escalation-loss', type: 'revenge-sizing', severity: 'critical',
      affectedTrades: count,
      title: 'Position Size Escalates After Losses',
      description: `You increased position size by 20%+ after a losing trade ${count} times. This is revenge sizing — emotionally driven risk-taking that accelerates drawdowns. Your worst losses likely follow this pattern directly.`,
    };
  }
  return null;
}


// 2. Position size escalation after wins (overconfidence)
function detectSizeEscalationAfterWin(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 4) return null;
  let count = 0, comparisons = 0;
  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (!prev.positionSize || !curr.positionSize) continue;
    comparisons++;
    if (curr.positionSize > prev.positionSize * 1.2 && prev.result > 0) count++;
  }
  if (comparisons === 0) return null;
  if (count >= 3 && count / comparisons > 0.2) {
    return {
      id: 'size-escalation-win', type: 'overconfidence', severity: 'high',
      affectedTrades: count,
      title: 'Position Size Escalates After Wins',
      description: `You increased size after a win ${count} times. Winning streaks trigger overconfidence — you risk more right before a reversion. Check if these oversized follow-up trades perform worse than your average.`,
    };
  }
  return null;
}


// 3. Losing trades are consistently larger than winning trades
function detectLargerSizeOnLosers(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  const winners = trades.filter(t => t.result > 0 && t.positionSize > 0);
  const losers  = trades.filter(t => t.result <= 0 && t.positionSize > 0);
  if (winners.length < 3 || losers.length < 3) return null;
  const avgWinSize  = avg(winners.map(t => t.positionSize));
  const avgLossSize = avg(losers.map(t => t.positionSize));
  if (avgLossSize > avgWinSize * 1.3) {
    return {
      id: 'larger-size-on-losers', type: 'sizing-instinct', severity: 'high',
      affectedTrades: losers.length,
      title: 'You Trade Larger on Losing Trades',
      description: `Your average position size on losing trades ($${avgLossSize.toFixed(0)}) is ${((avgLossSize / avgWinSize - 1) * 100).toFixed(0)}% larger than on winners ($${avgWinSize.toFixed(0)}). You are consistently sizing up on the wrong trades — your instinct on size is inverted.`,
    };
  }
  return null;
}


// 4. Win rate drops after consecutive wins (complacency)
function detectComplacencyAfterWins(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const postStreakTrades: CSVTradeData[] = [];
  let streak = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].result > 0) {
      streak++;
      if (streak >= 3) postStreakTrades.push(trades[i + 1]);
    } else {
      streak = 0;
    }
  }
  if (postStreakTrades.length < 3) return null;
  const postStreakWR = winRate(postStreakTrades);
  const overallWR   = winRate(trades);
  if (postStreakWR < overallWR * 0.65) {
    return {
      id: 'complacency-after-wins', type: 'complacency', severity: 'high',
      affectedTrades: postStreakTrades.length,
      title: 'Win Rate Drops After Winning Streaks',
      description: `After 3+ consecutive wins your win rate drops to ${pct(postStreakWR)} vs your normal ${pct(overallWR)}. Winning streaks breed complacency — you start taking lower quality setups or stop following your process as strictly.`,
    };
  }
  return null;
}


// 5. RR drops after consecutive wins (taking worse setups when confident)
function detectRRDropAfterWins(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const postStreakRR: number[] = [];
  const normalRR:     number[] = [];
  let streak = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].result > 0) {
      streak++;
      if (streak >= 3) postStreakRR.push(trades[i + 1].rr);
      else normalRR.push(trades[i].rr);
    } else {
      streak = 0;
      normalRR.push(trades[i].rr);
    }
  }
  if (postStreakRR.length < 3) return null;
  const avgPostRR   = avg(postStreakRR);
  const avgNormalRR = avg(normalRR);
  if (avgPostRR < avgNormalRR * 0.7) {
    return {
      id: 'rr-drop-after-wins', type: 'complacency', severity: 'medium',
      affectedTrades: postStreakRR.length,
      title: 'R:R Deteriorates After Winning Streaks',
      description: `After 3+ consecutive wins your average R:R drops to ${avgPostRR.toFixed(2)} vs your normal ${avgNormalRR.toFixed(2)}. You are accepting worse risk-reward ratios when you feel confident — a sign of complacency in setup selection.`,
    };
  }
  return null;
}


// 6. Performance drops after losing streaks (emotional)
function detectPostLossDecline(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  const postStreakTrades: CSVTradeData[] = [];
  const normalTrades:     CSVTradeData[] = [];
  let streak = 0;
  for (let i = 0; i < trades.length - 1; i++) {
    if (trades[i].result <= 0) {
      streak++;
      if (streak >= 2) postStreakTrades.push(trades[i + 1]);
    } else {
      streak = 0;
    }
    if (streak === 0) normalTrades.push(trades[i]);
  }
  if (postStreakTrades.length < 3) return null;
  const postWR   = winRate(postStreakTrades);
  const normalWR = winRate(normalTrades);
  if (postWR < normalWR * 0.6) {
    return {
      id: 'post-loss-decline', type: 'emotional-trading', severity: 'high',
      affectedTrades: postStreakTrades.length,
      title: 'Performance Drops After Losing Streaks',
      description: `Your win rate after 2+ consecutive losses is ${pct(postWR)} vs your normal ${pct(normalWR)}. You are trading emotionally after streaks. A mandatory break rule after 2 consecutive losses would directly address this.`,
    };
  }
  return null;
}


// 7. Violations cluster after losing streaks
function detectViolationAfterLoss(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  let count = 0, streak = 0;
  for (let i = 0; i < trades.length; i++) {
    if (trades[i].result <= 0) streak++;
    else streak = 0;
    if (streak >= 2 && trades[i].ruleViolation) count++;
  }
  if (count >= 2) {
    return {
      id: 'violation-after-loss', type: 'discipline-breakdown', severity: 'critical',
      affectedTrades: count,
      title: 'Rule Violations Spike After Losing Streaks',
      description: `You broke your rules ${count} times immediately following 2+ consecutive losses. Losses are directly triggering emotional rule-breaking. A mandatory cooldown period after consecutive losses would break this cycle.`,
    };
  }
  return null;
}


// 8. Violations after wins (overconfidence leading to rule breaks)
function detectViolationAfterWin(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  let count = 0, streak = 0;
  for (let i = 1; i < trades.length; i++) {
    if (trades[i - 1].result > 0) streak++;
    else streak = 0;
    if (streak >= 2 && trades[i].ruleViolation) count++;
  }
  if (count >= 3) {
    return {
      id: 'violation-after-win', type: 'overconfidence', severity: 'medium',
      affectedTrades: count,
      title: 'Rule Violations Follow Winning Streaks',
      description: `You broke your rules ${count} times during or after a winning streak. Wins make you feel invincible — you start skipping steps in your process because you think you do not need them right now.`,
    };
  }
  return null;
}


// 9. Consecutive violations — once broken, keeps breaking
function detectConsecutiveViolations(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 8) return null;
  let consecutiveCount = 0, maxRun = 0, run = 0;
  for (const t of trades) {
    if (t.ruleViolation) { run++; maxRun = Math.max(maxRun, run); }
    else run = 0;
    if (run >= 2) consecutiveCount++;
  }
  if (maxRun >= 3) {
    return {
      id: 'consecutive-violations', type: 'discipline-breakdown', severity: 'critical',
      affectedTrades: consecutiveCount,
      title: `Rule Violations Run in Streaks (Max ${maxRun} in a Row)`,
      description: `Your longest consecutive violation streak is ${maxRun} trades. Once you break a rule once you are significantly more likely to break it again immediately. The first violation is the most dangerous one — treat it as a stop signal.`,
    };
  }
  return null;
}


// 10. Violations concentrated on specific pair
function detectViolationsByPair(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  const byPair: Record<string, { total: number; violations: number }> = {};
  trades.forEach(t => {
    if (!byPair[t.pair]) byPair[t.pair] = { total: 0, violations: 0 };
    byPair[t.pair].total++;
    if (t.ruleViolation) byPair[t.pair].violations++;
  });
  let worstPair = '', worstRate = 0, worstCount = 0;
  Object.entries(byPair).forEach(([pair, data]) => {
    if (data.total < 3) return;
    const rate = data.violations / data.total;
    if (rate > worstRate && data.violations >= 2) {
      worstRate = rate; worstPair = pair; worstCount = data.violations;
    }
  });
  const overallViolationRate = trades.filter(t => t.ruleViolation).length / trades.length;
  if (worstPair && worstRate > overallViolationRate * 2 && worstRate > 0.3) {
    return {
      id: 'violations-by-pair', type: 'instrument-bias', severity: 'high',
      affectedTrades: worstCount,
      title: `${worstPair} Triggers Your Rule Violations`,
      description: `${pct(worstRate)} of your ${worstPair} trades involve a rule violation — more than double your overall violation rate of ${pct(overallViolationRate)}. This instrument has a psychological hold on you that bypasses your discipline.`,
    };
  }
  return null;
}


// 11. Long vs short directional bias
function detectDirectionalBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const longs  = trades.filter(t => t.direction === 'long');
  const shorts = trades.filter(t => t.direction === 'short');
  if (longs.length < 4 || shorts.length < 4) return null;
  const longWR  = winRate(longs);
  const shortWR = winRate(shorts);
  if (Math.abs(longWR - shortWR) > 0.25) {
    const better = longWR > shortWR ? 'long' : 'short';
    const worse  = better === 'long' ? 'short' : 'long';
    const betterWR = better === 'long' ? longWR : shortWR;
    const worseWR  = worse  === 'long' ? longWR : shortWR;
    return {
      id: 'directional-bias', type: 'direction-bias', severity: 'medium',
      affectedTrades: worse === 'long' ? longs.length : shorts.length,
      title: `You Cannot Trade ${worse.charAt(0).toUpperCase() + worse.slice(1)}s Profitably`,
      description: `Your ${better} win rate is ${pct(betterWR)} vs ${pct(worseWR)} on ${worse}s. You have a strong directional bias — consider restricting yourself to ${better} setups only until you understand why ${worse} trades consistently underperform.`,
    };
  }
  return null;
}


// 12. Holding bias — cutting winners, holding losers
function detectHoldingBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  const winners = trades.filter(t => t.result > 0);
  const losers  = trades.filter(t => t.result <= 0);
  if (winners.length < 3 || losers.length < 3) return null;
  const avgWinRR  = avg(winners.map(t => Math.abs(t.rr)));
  const avgLossRR = avg(losers.map(t => Math.abs(t.rr)));
  if (avgWinRR < 1.0 && avgLossRR > avgWinRR * 1.5) {
    return {
      id: 'early-exit-winners', type: 'holding-bias', severity: 'high',
      affectedTrades: winners.length,
      title: 'Cutting Winners Early, Holding Losers Too Long',
      description: `Your average R:R on winners is ${avgWinRR.toFixed(2)} vs ${avgLossRR.toFixed(2)} on losers. You exit profitable trades before they reach potential while letting losing trades run. This is the single most common way traders destroy an otherwise good system.`,
    };
  }
  return null;
}


// 13. Worst day of week
function detectDayOfWeekBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 20) return null;
  const byDay: Record<string, CSVTradeData[]> = {};
  trades.forEach(t => {
    const day = getDayOfWeek(t.date);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(t);
  });
  let worstDay = '', worstWR = 1, worstCount = 0;
  let bestDay  = '', bestWR  = 0;
  Object.entries(byDay).forEach(([day, dayTrades]) => {
    if (dayTrades.length < 3) return;
    const wr = winRate(dayTrades);
    if (wr < worstWR) { worstWR = wr; worstDay = day; worstCount = dayTrades.length; }
    if (wr > bestWR)  { bestWR  = wr; bestDay  = day; }
  });
  const overallWR = winRate(trades);
  if (worstDay && worstWR < overallWR * 0.6 && worstCount >= 3) {
    return {
      id: 'day-of-week-bias', type: 'time-pattern', severity: 'medium',
      affectedTrades: worstCount,
      title: `${worstDay} Is Your Worst Trading Day`,
      description: `Your win rate on ${worstDay} is ${pct(worstWR)} vs your overall ${pct(overallWR)}. ${bestDay ? `Your best day is ${bestDay} at ${pct(bestWR)}.` : ''} Consider reducing size or skipping ${worstDay} entirely.`,
    };
  }
  return null;
}


// 14. Friday position size increase — end of week gambling
function detectFridaySizeIncrease(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const fridays = trades.filter(t => getDayOfWeek(t.date) === 'Friday');
  const others  = trades.filter(t => getDayOfWeek(t.date) !== 'Friday');
  if (fridays.length < 3 || others.length < 5) return null;
  const avgFridaySize = avg(fridays.map(t => t.positionSize).filter(Boolean));
  const avgOtherSize  = avg(others.map(t => t.positionSize).filter(Boolean));
  if (avgFridaySize > avgOtherSize * 1.3) {
    return {
      id: 'friday-size-increase', type: 'time-pattern', severity: 'medium',
      affectedTrades: fridays.length,
      title: 'You Trade Larger on Fridays',
      description: `Your average position size on Fridays ($${avgFridaySize.toFixed(0)}) is ${((avgFridaySize / avgOtherSize - 1) * 100).toFixed(0)}% larger than other days ($${avgOtherSize.toFixed(0)}). End of week urgency or P&L recovery attempts are inflating your Friday risk.`,
    };
  }
  return null;
}


// 15. Overtrading after big losses
function detectOvertradingAfterLoss(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const avgLoss = avg(trades.filter(t => t.result < 0).map(t => Math.abs(t.result)));
  const bigLossDates = new Set(
    trades.filter(t => t.result < 0 && Math.abs(t.result) > avgLoss * 2).map(t => t.date)
  );
  if (bigLossDates.size === 0) return null;
  const allDates = [...new Set(trades.map(t => t.date))].sort();
  const normalTPD = trades.length / allDates.length;
  let overtradeDays = 0;
  allDates.forEach((date, i) => {
    if (i === 0) return;
    if (!bigLossDates.has(allDates[i - 1])) return;
    if (trades.filter(t => t.date === date).length > normalTPD * 1.5) overtradeDays++;
  });
  if (overtradeDays >= 2) {
    return {
      id: 'overtrading-after-loss', type: 'overtrading', severity: 'high',
      affectedTrades: overtradeDays,
      title: 'Overtrading After Big Losses',
      description: `On ${overtradeDays} occasions you took significantly more trades than usual the day after a large loss. Recovery trading leads to rushed entries and compounds the damage — each additional trade is lower quality than the last.`,
    };
  }
  return null;
}


// 16. Specific pair consistently losing
function detectPairBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const byPair: Record<string, CSVTradeData[]> = {};
  trades.forEach(t => {
    if (!byPair[t.pair]) byPair[t.pair] = [];
    byPair[t.pair].push(t);
  });
  let worstPair = '', worstPnL = 0, worstCount = 0;
  Object.entries(byPair).forEach(([pair, pt]) => {
    if (pt.length < 3) return;
    const pnl = pt.reduce((s, t) => s + t.result, 0);
    if (pnl < worstPnL) { worstPnL = pnl; worstPair = pair; worstCount = pt.length; }
  });
  if (worstPair && worstPnL < -50) {
    return {
      id: 'pair-bias', type: 'instrument-bias', severity: 'medium',
      affectedTrades: worstCount,
      title: `${worstPair} Is Consistently Draining Your Account`,
      description: `You have lost $${Math.abs(worstPnL).toFixed(0)} across ${worstCount} trades on ${worstPair}. Despite repeated losses you keep returning to this instrument. Consider a temporary ban on ${worstPair} until you identify what is not working.`,
    };
  }
  return null;
}


// 17. Direction bias on specific pair
function detectDirectionBiasByPair(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const byPair: Record<string, { longs: CSVTradeData[]; shorts: CSVTradeData[] }> = {};
  trades.forEach(t => {
    if (!byPair[t.pair]) byPair[t.pair] = { longs: [], shorts: [] };
    if (t.direction === 'long') byPair[t.pair].longs.push(t);
    else byPair[t.pair].shorts.push(t);
  });
  for (const [pair, data] of Object.entries(byPair)) {
    if (data.longs.length < 3 || data.shorts.length < 3) continue;
    const longWR  = winRate(data.longs);
    const shortWR = winRate(data.shorts);
    if (Math.abs(longWR - shortWR) > 0.35) {
      const worse = longWR > shortWR ? 'short' : 'long';
      const worseWR = worse === 'long' ? longWR : shortWR;
      return {
        id: `direction-bias-${pair}`, type: 'direction-bias', severity: 'medium',
        affectedTrades: worse === 'long' ? data.longs.length : data.shorts.length,
        title: `You Cannot Trade ${pair} ${worse.charAt(0).toUpperCase() + worse.slice(1)}s`,
        description: `Your ${worse} win rate on ${pair} is only ${pct(worseWR)}. You have a strong directional bias on this specific instrument — only trade the direction that works for you on ${pair} until you diagnose why the other fails.`,
      };
    }
  }
  return null;
}


// 18. Trades with no notes perform worse
function detectNoNotesPerformance(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;
  const withNotes    = trades.filter(t => t.notes && t.notes.trim().length > 5);
  const withoutNotes = trades.filter(t => !t.notes || t.notes.trim().length <= 5);
  if (withNotes.length < 5 || withoutNotes.length < 5) return null;
  const withWR    = winRate(withNotes);
  const withoutWR = winRate(withoutNotes);
  if (withWR > withoutWR * 1.3) {
    return {
      id: 'no-notes-performance', type: 'journaling', severity: 'medium',
      affectedTrades: withoutNotes.length,
      title: 'Trades With Notes Win More Often',
      description: `Your win rate on trades with notes is ${pct(withWR)} vs ${pct(withoutWR)} on trades without. Writing down your thesis before entering forces you to think clearly — ${withoutNotes.length} trades had no notes and underperformed significantly.`,
    };
  }
  return null;
}


// 19. Edge deteriorating over time on a specific pair
function detectEdgeDeterioration(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 20) return null;
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const half   = Math.floor(sorted.length / 2);
  const early  = sorted.slice(0, half);
  const recent = sorted.slice(half);
  const earlyWR  = winRate(early);
  const recentWR = winRate(recent);
  if (earlyWR > 0.5 && recentWR < earlyWR * 0.65) {
    return {
      id: 'edge-deterioration', type: 'edge-decay', severity: 'high',
      affectedTrades: recent.length,
      title: 'Your Edge Is Deteriorating Over Time',
      description: `Your win rate in your first ${early.length} trades was ${pct(earlyWR)} but has dropped to ${pct(recentWR)} in your most recent ${recent.length} trades. Your strategy may need updating — market conditions change and edges decay. Review what changed between your early and recent trades.`,
    };
  }
  return null;
}


// 20. Positive — strong recent discipline
function detectDisciplineStreak(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;
  const recent = trades.slice(-20);
  const clean  = recent.filter(t => !t.ruleViolation);
  if (clean.length / recent.length >= 0.9) {
    return {
      id: 'discipline-streak', type: 'positive', severity: 'positive',
      affectedTrades: clean.length,
      title: 'Strong Recent Discipline',
      description: `${clean.length} of your last ${recent.length} trades were taken without rule violations. Consistent rule adherence is the foundation of long-term profitability — this is one of your clearest current strengths.`,
    };
  }
  return null;
}


// 21. Positive — improving win rate trend
function detectImprovingTrend(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 20) return null;
  const sorted = [...trades].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const half   = Math.floor(sorted.length / 2);
  const early  = sorted.slice(0, half);
  const recent = sorted.slice(half);
  const earlyWR  = winRate(early);
  const recentWR = winRate(recent);
  if (recentWR > earlyWR * 1.2 && recentWR > 0.5) {
    return {
      id: 'improving-trend', type: 'positive', severity: 'positive',
      affectedTrades: recent.length,
      title: 'Your Win Rate Is Improving',
      description: `Your recent win rate (${pct(recentWR)}) is significantly better than your earlier performance (${pct(earlyWR)}). You are actively improving as a trader — whatever changes you have made recently are working. Double down on them.`,
    };
  }
  return null;
}


// ── Main export ───────────────────────────────────────────────────────────────

export function detectKeyObservations(trades: CSVTradeData[]): KeyObservation[] {
  if (trades.length < 5) return [];

  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const severityOrder: Record<Severity, number> = {
    critical: 0, high: 1, medium: 2, low: 3, positive: 4,
  };

  return [
    detectSizeEscalationAfterLoss(sorted),
    detectViolationAfterLoss(sorted),
    detectConsecutiveViolations(sorted),
    detectLargerSizeOnLosers(sorted),
    detectPostLossDecline(sorted),
    detectOvertradingAfterLoss(sorted),
    detectEdgeDeterioration(sorted),
    detectSizeEscalationAfterWin(sorted),
    detectComplacencyAfterWins(sorted),
    detectRRDropAfterWins(sorted),
    detectViolationAfterWin(sorted),
    detectViolationsByPair(sorted),
    detectDirectionalBias(sorted),
    detectDirectionBiasByPair(sorted),
    detectHoldingBias(sorted),
    detectDayOfWeekBias(sorted),
    detectFridaySizeIncrease(sorted),
    detectNoNotesPerformance(sorted),
    detectPairBias(sorted),
    detectDisciplineStreak(sorted),
    detectImprovingTrend(sorted),
  ]
    .filter((obs): obs is KeyObservation => obs !== null)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6);
}