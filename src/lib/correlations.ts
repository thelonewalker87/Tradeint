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


// ── Individual correlation detectors ─────────────────────────────────────────
// Each function returns a KeyObservation or null if pattern not found.

/**
 * Detects consecutive position size escalation.
 * Checks if trader increases size after wins (overconfidence)
 * or after losses (revenge sizing).
 */
function detectSizeEscalation(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 4) return null;

  let escalationsAfterWin  = 0;
  let escalationsAfterLoss = 0;
  let comparisons          = 0;

  for (let i = 1; i < trades.length; i++) {
    const prev = trades[i - 1];
    const curr = trades[i];
    if (prev.positionSize === 0 || curr.positionSize === 0) continue;

    comparisons++;
    const sizeIncreased = curr.positionSize > prev.positionSize * 1.2; // 20% bigger

    if (sizeIncreased && prev.result > 0) escalationsAfterWin++;
    if (sizeIncreased && prev.result <= 0) escalationsAfterLoss++;
  }

  if (comparisons === 0) return null;

  // After loss escalation — revenge sizing
  if (escalationsAfterLoss >= 3 && escalationsAfterLoss / comparisons > 0.15) {
    return {
      id:             'size-escalation-loss',
      type:           'revenge-sizing',
      severity:       'critical',
      affectedTrades: escalationsAfterLoss,
      title:          'Position Size Escalates After Losses',
      description:    `You increased position size significantly after a losing trade ${escalationsAfterLoss} times. This is revenge sizing — emotionally driven risk-taking that accelerates drawdowns. Your average loss on these trades is likely larger than normal.`,
    };
  }

  // After win escalation — overconfidence
  if (escalationsAfterWin >= 3 && escalationsAfterWin / comparisons > 0.2) {
    return {
      id:             'size-escalation-win',
      type:           'overconfidence',
      severity:       'high',
      affectedTrades: escalationsAfterWin,
      title:          'Position Size Escalates After Wins',
      description:    `You increased position size after a win ${escalationsAfterWin} times. Winning streaks trigger overconfidence — you risk more right before a reversion. Check if these oversized trades performed worse than your average.`,
    };
  }

  return null;
}


/**
 * Detects if trader holds losers significantly longer than winners.
 * Uses entry/exit prices as a proxy since no timestamp available.
 * Uses R:R as hold time proxy — low R:R on losers suggests early exit on winners.
 */
function detectHoldingBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;

  const winners = trades.filter(t => t.result > 0);
  const losers  = trades.filter(t => t.result <= 0);

  if (winners.length < 3 || losers.length < 3) return null;

  const avgWinRR  = avg(winners.map(t => Math.abs(t.rr)));
  const avgLossRR = avg(losers.map(t => Math.abs(t.rr)));

  // Winners exited early — actual RR much lower than it should be
  if (avgWinRR < 1.0 && avgLossRR > avgWinRR * 1.5) {
    return {
      id:             'early-exit-winners',
      type:           'holding-bias',
      severity:       'high',
      affectedTrades: winners.length,
      title:          'Cutting Winners Early, Holding Losers Too Long',
      description:    `Your average R:R on winners is ${avgWinRR.toFixed(2)} vs ${avgLossRR.toFixed(2)} on losers. You are exiting profitable trades before they reach potential while letting losing trades run. This is the single most common way traders leave money on the table.`,
    };
  }

  return null;
}


/**
 * Detects performance drop after consecutive losses.
 * Checks if win rate after 2+ consecutive losses is significantly lower.
 */
function detectPostLossDecline(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;

  const postStreakTrades: CSVTradeData[] = [];
  const normalTrades:     CSVTradeData[] = [];

  let streak = 0;
  for (let i = 0; i < trades.length; i++) {
    if (trades[i].result <= 0) {
      streak++;
    } else {
      if (streak >= 2 && i + 1 < trades.length) {
        // Trade immediately after a losing streak of 2+
        postStreakTrades.push(trades[i + 1]);
      }
      streak = 0;
    }

    if (streak === 0 && postStreakTrades.indexOf(trades[i]) === -1) {
      normalTrades.push(trades[i]);
    }
  }

  if (postStreakTrades.length < 3) return null;

  const postStreakWR = winRate(postStreakTrades);
  const normalWR    = winRate(normalTrades);

  if (postStreakWR < normalWR * 0.6) {
    return {
      id:             'post-loss-decline',
      type:           'emotional-trading',
      severity:       'high',
      affectedTrades: postStreakTrades.length,
      title:          'Performance Drops Sharply After Losing Streaks',
      description:    `Your win rate after 2+ consecutive losses is ${(postStreakWR * 100).toFixed(0)}% vs your normal ${(normalWR * 100).toFixed(0)}%. You are trading emotionally after streaks — consider a mandatory break rule after 2 consecutive losses.`,
    };
  }

  return null;
}


/**
 * Detects day of week performance correlation.
 * Flags if a specific day has significantly worse performance.
 */
function detectDayOfWeekBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 20) return null;

  const byDay: Record<string, CSVTradeData[]> = {};

  trades.forEach(t => {
    const day = getDayOfWeek(t.date);
    if (!byDay[day]) byDay[day] = [];
    byDay[day].push(t);
  });

  let worstDay     = '';
  let worstWR      = 1;
  let worstCount   = 0;
  let bestDay      = '';
  let bestWR       = 0;

  Object.entries(byDay).forEach(([day, dayTrades]) => {
    if (dayTrades.length < 3) return;
    const wr = winRate(dayTrades);
    if (wr < worstWR) { worstWR = wr; worstDay = day; worstCount = dayTrades.length; }
    if (wr > bestWR)  { bestWR  = wr; bestDay  = day; }
  });

  const overallWR = winRate(trades);

  // Worst day is significantly below average
  if (worstDay && worstWR < overallWR * 0.6 && worstCount >= 3) {
    return {
      id:             'day-of-week-bias',
      type:           'time-pattern',
      severity:       'medium',
      affectedTrades: worstCount,
      title:          `${worstDay} Is Your Worst Trading Day`,
      description:    `Your win rate on ${worstDay} is ${(worstWR * 100).toFixed(0)}% vs your overall ${(overallWR * 100).toFixed(0)}%. ${bestDay ? `Your best day is ${bestDay} at ${(bestWR * 100).toFixed(0)}%.` : ''} Consider reducing size or skipping ${worstDay} entirely until you understand why it underperforms.`,
    };
  }

  return null;
}


/**
 * Detects if rule violations cluster after consecutive losses.
 * Pattern: loss → loss → violation
 */
function detectViolationAfterLoss(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;

  let violationsAfterStreak = 0;
  let streak                = 0;

  for (let i = 0; i < trades.length; i++) {
    if (trades[i].result <= 0) {
      streak++;
    } else {
      streak = 0;
    }

    if (streak >= 2 && trades[i].ruleViolation) {
      violationsAfterStreak++;
    }
  }

  if (violationsAfterStreak >= 2) {
    return {
      id:             'violation-after-loss',
      type:           'discipline-breakdown',
      severity:       'critical',
      affectedTrades: violationsAfterStreak,
      title:          'Rule Violations Spike After Losing Streaks',
      description:    `You broke your trading rules ${violationsAfterStreak} times immediately following a losing streak of 2 or more. Losses are triggering emotional rule-breaking. A mandatory cooldown period after consecutive losses would directly address this pattern.`,
    };
  }

  return null;
}


/**
 * Detects if trader overtrades (takes more trades) after a big loss.
 * Proxy: more trades on days following a loss above 2x average loss.
 */
function detectOvertrading(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;

  const avgLoss = avg(
    trades.filter(t => t.result < 0).map(t => Math.abs(t.result))
  );

  const bigLossDates = new Set(
    trades
      .filter(t => t.result < 0 && Math.abs(t.result) > avgLoss * 2)
      .map(t => t.date)
  );

  if (bigLossDates.size === 0) return null;

  // Count trades on days after big loss days
  const allDates    = [...new Set(trades.map(t => t.date))].sort();
  let overtradeDays = 0;
  const normalTradesPerDay = trades.length / allDates.length;

  allDates.forEach((date, i) => {
    if (i === 0) return;
    const prevDate = allDates[i - 1];
    if (!bigLossDates.has(prevDate)) return;

    const tradesOnDay = trades.filter(t => t.date === date).length;
    if (tradesOnDay > normalTradesPerDay * 1.5) overtradeDays++;
  });

  if (overtradeDays >= 2) {
    return {
      id:             'overtrading-after-loss',
      type:           'overtrading',
      severity:       'high',
      affectedTrades: overtradeDays,
      title:          'Overtrading After Big Losses',
      description:    `On ${overtradeDays} occasions you took significantly more trades than usual on the day following a large loss. This is a classic recovery trading pattern — trying to win back losses quickly leads to lower quality setups and compounds the damage.`,
    };
  }

  return null;
}


/**
 * Detects if a specific instrument is consistently losing money.
 */
function detectPairBias(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 15) return null;

  const byPair: Record<string, CSVTradeData[]> = {};
  trades.forEach(t => {
    if (!byPair[t.pair]) byPair[t.pair] = [];
    byPair[t.pair].push(t);
  });

  let worstPair    = '';
  let worstPnL     = 0;
  let worstCount   = 0;

  Object.entries(byPair).forEach(([pair, pairTrades]) => {
    if (pairTrades.length < 3) return;
    const pnl = pairTrades.reduce((s, t) => s + t.result, 0);
    if (pnl < worstPnL) {
      worstPnL   = pnl;
      worstPair  = pair;
      worstCount = pairTrades.length;
    }
  });

  if (worstPair && worstPnL < -50) {
    return {
      id:             'pair-bias',
      type:           'instrument-bias',
      severity:       'medium',
      affectedTrades: worstCount,
      title:          `${worstPair} Is Consistently Draining Your Account`,
      description:    `You have lost $${Math.abs(worstPnL).toFixed(0)} across ${worstCount} trades on ${worstPair}. Despite repeated losses on this instrument you keep returning to it. Consider a temporary ban on ${worstPair} until you can identify specifically what is not working.`,
    };
  }

  return null;
}


/**
 * Detects positive pattern — consistent discipline.
 */
function detectDisciplineStreak(trades: CSVTradeData[]): KeyObservation | null {
  if (trades.length < 10) return null;

  const recentTrades    = trades.slice(-20);
  const cleanTrades     = recentTrades.filter(t => !t.ruleViolation);
  const cleanPercentage = cleanTrades.length / recentTrades.length;

  if (cleanPercentage >= 0.9) {
    return {
      id:             'discipline-streak',
      type:           'positive',
      severity:       'positive',
      affectedTrades: cleanTrades.length,
      title:          'Strong Recent Discipline',
      description:    `${cleanTrades.length} of your last ${recentTrades.length} trades were taken without rule violations. Consistent rule adherence is the foundation of long-term profitability — this is one of your clearest strengths right now.`,
    };
  }

  return null;
}


// ── Main export ───────────────────────────────────────────────────────────────

/**
 * Run all correlation detectors against the full trade history.
 * Returns up to 6 most significant observations sorted by severity.
 */
export function detectKeyObservations(trades: CSVTradeData[]): KeyObservation[] {
  if (trades.length < 5) return [];

  // Sort trades by date ascending for sequential analysis
  const sorted = [...trades].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  const severityOrder: Record<Severity, number> = {
    critical: 0,
    high:     1,
    medium:   2,
    low:      3,
    positive: 4,
  };

  const results = [
    detectSizeEscalation(sorted),
    detectViolationAfterLoss(sorted),
    detectPostLossDecline(sorted),
    detectOvertrading(sorted),
    detectHoldingBias(sorted),
    detectDayOfWeekBias(sorted),
    detectPairBias(sorted),
    detectDisciplineStreak(sorted),
  ]
    .filter((obs): obs is KeyObservation => obs !== null)
    .sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
    .slice(0, 6);

  return results;
}