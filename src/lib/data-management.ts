import { CSVTradeData } from '@/csvManager';

// Global state for uploaded data
let uploadedTrades: CSVTradeData[] = [];
let isUsingUploadedData = false;

export const dataManager = {
  // Get current trades (uploaded or empty)
  getTrades(): CSVTradeData[] {
    return isUsingUploadedData ? uploadedTrades : [];
  },

  // Set uploaded trades
  setUploadedTrades(trades: CSVTradeData[]) {
    uploadedTrades = trades;
    isUsingUploadedData = true;
  },

  // Check if using uploaded data
  isUsingUploaded(): boolean {
    return isUsingUploadedData;
  },

  // Clear uploaded data
  clearUploadedData() {
    uploadedTrades = [];
    isUsingUploadedData = false;
  },

  // Add single trade (for manual entry)
  addTrade(trade: CSVTradeData) {
    if (isUsingUploadedData) {
      // Add new trades at the beginning so latest trades show first
      uploadedTrades.unshift(trade);
    }
  },

  // Update trade
  updateTrade(tradeId: string, updates: Partial<CSVTradeData>) {
    if (isUsingUploadedData) {
      const index = uploadedTrades.findIndex(t => t.id === tradeId);
      if (index !== -1) {
        uploadedTrades[index] = { ...uploadedTrades[index], ...updates };
      }
    }
  },

  // Delete trade
  deleteTrade(tradeId: string) {
    if (isUsingUploadedData) {
      uploadedTrades = uploadedTrades.filter(t => t.id !== tradeId);
    }
  },

  // Get trade by ID
  getTradeById(tradeId: string): CSVTradeData | undefined {
    if (isUsingUploadedData) {
      return uploadedTrades.find(t => t.id === tradeId);
    }
    return undefined;
  }
};
