import { motion } from 'framer-motion';
import { BookOpen, Search, Filter, Download, Plus, Calendar, TrendingUp, Activity, RefreshCw, Upload } from 'lucide-react';
import { Link } from 'react-router-dom';
import TradeJournalTable from '@/components/TradeJournalTable';
import AddTradeModal from '@/components/AddTradeModal';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState, useEffect } from 'react';
import CSVManager from '@/csvManager';
import { CSVTradeData } from '@/csvManager';

export default function JournalPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddTradeModalOpen, setIsAddTradeModalOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState<CSVTradeData | null>(null);
  const [trades, setTrades] = useState<CSVTradeData[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Load trades from CSV data on mount and listen for updates
  useEffect(() => {
    loadTrades();

    // Listen for storage events (cross-tab updates)
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'tradient_trades_csv') {
        console.log('Journal: Storage event detected, reloading trades...');
        loadTrades();
      }
    };

    // Listen for custom events (same-tab updates)
    const handleTradesUpdate = (e: CustomEvent) => {
      console.log('Journal: Trades update event detected, reloading trades...', e.detail);
      loadTrades();
    };

    // Add event listeners
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('tradesUpdated', handleTradesUpdate as EventListener);

    // Cleanup listeners on unmount
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('tradesUpdated', handleTradesUpdate as EventListener);
    };
  }, []);

  const loadTrades = async () => {
    setIsLoading(true);
    try {
      const csvTrades = await CSVManager.loadFromAPI();
      // Sort by date (newest first)
      csvTrades.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setTrades(csvTrades);
    } catch (error) {
      console.error('Error loading trades:', error);
      setTrades([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddOrEditTrade = async (submittedTrade: CSVTradeData) => {
    try {
      if (editingTrade) {
        await CSVManager.updateTradeInAPI(submittedTrade);
      } else {
        await CSVManager.addTradeToAPI(submittedTrade);
      }
      
      // Reload trades to update display
      loadTrades();
    } catch (error) {
      console.error('Error saving trade:', error);
    }
  };

  const handleEditClick = (trade: CSVTradeData) => {
    setEditingTrade(trade);
    setIsAddTradeModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsAddTradeModalOpen(false);
    setTimeout(() => setEditingTrade(null), 300); // clear after close animation
  };

  const handleRefreshData = async () => {
    // Clear and reload data
    await CSVManager.saveToAPI([]);
    await loadTrades();
  };

  const handleExportCSV = () => {
    try {
      CSVManager.downloadCSV(trades, `trades_${new Date().toISOString().split('T')[0]}.csv`);
    } catch (error) {
      console.error('Error exporting CSV:', error);
    }
  };

  // Calculate stats
  const totalTrades = trades.length;
  const thisMonthTrades = trades.filter(trade => {
    const tradeDate = new Date(trade.date);
    const now = new Date();
    return tradeDate.getMonth() === now.getMonth() && tradeDate.getFullYear() === now.getFullYear();
  }).length;
  
  const winRate = trades.length > 0 
    ? ((trades.filter(trade => trade.result > 0).length / trades.length) * 100).toFixed(1)
    : '0.0';
  
  const avgPnL = trades.length > 0
    ? (trades.reduce((sum, trade) => sum + trade.result, 0) / trades.length).toFixed(1)
    : '0.0';

  // Filter trades based on search term
  const filteredTrades = trades.filter(trade => {
    const searchLower = searchTerm.toLowerCase();
    return (
      trade.pair.toLowerCase().includes(searchLower) ||
      trade.id.toLowerCase().includes(searchLower) ||
      trade.date.includes(searchLower) ||
      (trade.notes && trade.notes.toLowerCase().includes(searchLower))
    );
  });

  return (
    <div className="space-y-8 max-w-[1400px]">
      {/* Header */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Trade Journal</h1>
          <p className="text-muted-foreground">Review and analyze your complete trading history</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleExportCSV}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="outline" size="sm" onClick={loadTrades} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setIsAddTradeModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Trade
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6"
      >
        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Total Trades</p>
                <p className="text-2xl font-bold">{totalTrades}</p>
              </div>
              <div className="p-2 bg-blue-500/10 rounded-xl">
                <BookOpen className="w-5 h-5 text-blue-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">This Month</p>
                <p className="text-2xl font-bold">{thisMonthTrades}</p>
              </div>
              <div className="p-2 bg-green-500/10 rounded-xl">
                <Calendar className="w-5 h-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Win Rate</p>
                <p className="text-2xl font-bold">{winRate}%</p>
              </div>
              <div className="p-2 bg-purple-500/10 rounded-xl">
                <TrendingUp className="w-5 h-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Avg P&L</p>
                <p className="text-2xl font-bold">${avgPnL}</p>
              </div>
              <div className="p-2 bg-orange-500/10 rounded-xl">
                <Activity className="w-5 h-5 text-orange-500" />
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Search and Filters */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col md:flex-row gap-4"
      >
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search trades by pair, date, or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 glass-card border-0 shadow-lg"
            />
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm">
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Badge variant="secondary" className="px-3 py-2">
            All Time
          </Badge>
          <Badge variant="secondary" className="px-3 py-2">
            All Pairs
          </Badge>
        </div>
      </motion.div>

      {/* Trade Table / Empty State */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        {trades.length === 0 && !isLoading ? (
          <Card className="glass-card border-dashed border-2 border-border/40 bg-card/20">
            <CardContent className="flex flex-col items-center justify-center py-20 gap-6">
              <div className="p-5 bg-primary/10 rounded-2xl">
                <Upload className="h-12 w-12 text-primary" />
              </div>
              <div className="text-center max-w-sm">
                <h3 className="text-2xl font-bold text-foreground mb-2">No Trades Yet</h3>
                <p className="text-muted-foreground text-base leading-relaxed">
                  Import your trade history from a CSV file, or add your first trade manually.
                </p>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-3">
                <Button asChild size="lg" className="rounded-xl">
                  <Link to="/csv-upload">
                    <Upload className="h-4 w-4 mr-2" />
                    Upload CSV
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="rounded-xl"
                  onClick={() => setIsAddTradeModalOpen(true)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Trade
                </Button>
              </div>
            </CardContent>
          </Card>
        ) : (
          <TradeJournalTable trades={filteredTrades} isLoading={isLoading} onEditTrade={handleEditClick} />
        )}
      </motion.div>

      {/* Add/Edit Trade Modal */}
      <AddTradeModal
        isOpen={isAddTradeModalOpen}
        onClose={handleCloseModal}
        onAddTrade={handleAddOrEditTrade}
        initialData={editingTrade}
      />
    </div>
  );
}
