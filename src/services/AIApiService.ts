import { CSVTradeData } from '../csvManager';

// API Schema Types matching Python backend
export interface TradeInput {
  ticker: string;
  direction: 'long' | 'short';
  entry_price: number;
  exit_price: number;
  stop_loss: number;
  take_profit?: number | null;
  account_size: number;
  position_size: number;
  trade_notes?: string | null;
  session?: string | null;
  strategy_tag?: string | null;
}

export interface DimensionScore {
  score: number;
  max: number;
  feedback: string;
}

export interface GradeResult {
  overall_score: number;
  letter_grade: string;
  metrics: any;
  entry_quality: DimensionScore;
  risk_management: DimensionScore;
  trade_thesis: DimensionScore;
  exit_quality: DimensionScore;
  summary: string;
  patterns: string[];
}

export interface AnalysePerformanceResult {
  answer: string;
  top_weakness: string;
  recommendations: string[];
  positive_patterns: string[];
}

const RAW_API_URL = import.meta.env.VITE_AI_API_URL || 'http://localhost:8000';
// Remove trailing slash if present to avoid double-slashes in the final URL
const CLEAN_API_URL = RAW_API_URL.endsWith('/') ? RAW_API_URL.slice(0, -1) : RAW_API_URL;
const API_BASE_URL = `${CLEAN_API_URL}/ai/query`;

// Log to help user verify the URL in their browser console
if (typeof window !== 'undefined') {
  console.log('Tradient AI Service using:', API_BASE_URL);
}

// Only log once to help user verify the URL in their browser console
if (typeof window !== 'undefined') {
  console.log('Tradient AI Service using:', API_BASE_URL);
}

export const AIApiService = {
  /**
   * Safe mapping from generic CSV trade data to strict AI TradeInput
   */
  mapCSVToAITrade(csvTrade: CSVTradeData, accountSize: number = 10000): TradeInput {
    // Generate safe stop losses if missing (1% away)
    let safeStopLoss = 0;
    if (csvTrade.direction === 'long') {
      safeStopLoss = csvTrade.entry * 0.99;
    } else {
      safeStopLoss = csvTrade.entry * 1.01;
    }

    // Default position size if not provided or 0
    const safePosSize = csvTrade.positionSize > 0 ? csvTrade.positionSize : (accountSize * 0.01) / csvTrade.entry;

    return {
      ticker: csvTrade.pair || 'UNKNOWN',
      direction: csvTrade.direction,
      entry_price: csvTrade.entry,
      exit_price: csvTrade.exit,
      stop_loss: safeStopLoss, // Required by grader constraints
      account_size: accountSize,
      position_size: safePosSize,
      trade_notes: csvTrade.notes || csvTrade.ruleViolation || 'No notes provided',
      strategy_tag: 'CSV Import'
    };
  },

  async gradeTrade(trade: TradeInput): Promise<GradeResult> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'grade_trade',
        payload: { trade }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Error: ${response.status} - ${errorText}`);
    }
    return response.json();
  },

  async analysePerformance(gradedTrades: GradeResult[], question: string = "Summarize my performance and behaviors."): Promise<AnalysePerformanceResult> {
    const response = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'analyse_performance',
        payload: { trades: gradedTrades, question }
      })
    });
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`AI API Analysis Error: ${response.status} - ${errorText}`);
    }
    return response.json();
  },

  /**
   * Helper to map CSVTradeData to the internal 'Trade' type for local TS logic
   */
  mapCSVToTradeObject(csv: CSVTradeData): any {
    const entryDate = new Date(csv.date);
    const exitDate = new Date(csv.date);
    
    return {
      tradeId: csv.id,
      symbol: csv.pair,
      entryTime: entryDate,
      exitTime: exitDate,
      entryPrice: csv.entry,
      exitPrice: csv.exit,
      positionSize: csv.positionSize,
      profitLoss: csv.result,
      riskReward: csv.rr,
      direction: csv.direction,
      setupType: (csv.notes?.toLowerCase().includes('breakout') ? 'breakout' : 
                  csv.notes?.toLowerCase().includes('pullback') ? 'pullback' : 'reversal'),
      ruleViolations: csv.ruleViolation ? [{
        type: 'position-size',
        severity: 'medium',
        description: csv.ruleViolation
      }] : [],
      emotionalState: (csv.notes?.toLowerCase().includes('revenge') ? 'revenge' :
                      csv.notes?.toLowerCase().includes('greedy') ? 'greedy' :
                      csv.notes?.toLowerCase().includes('fomo') ? 'fearful' : 'calm'),
      holdingTime: 60, // Default to 60m if unknown
      tags: csv.notes ? [csv.notes] : [],
      notes: csv.notes || ''
    };
  }
};
