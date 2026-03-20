import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ChevronLeft, ChevronRight, Play, AlertTriangle, Edit2 } from 'lucide-react';
import { CSVTradeData } from '@/csvManager';
import TradeReplayModal from './TradeReplayModal';

const PAGE_SIZE = 5;

interface TradeJournalTableProps {
  trades: CSVTradeData[];
  isLoading?: boolean;
  onEditTrade?: (trade: CSVTradeData) => void;
}

export default function TradeJournalTable({ trades, isLoading = false, onEditTrade }: TradeJournalTableProps) {
  const [search, setSearch] = useState('');
  const [filterOutcome, setFilterOutcome] = useState<'all' | 'win' | 'loss'>('all');
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState('1');
  const [replayTrade, setReplayTrade] = useState<CSVTradeData | null>(null);

  useEffect(() => {
    setPageInput(String(page));
  }, [page]);

  // Reset to first page when trade list changes so newly added trades appear immediately
  useEffect(() => {
    setPage(1);
  }, [trades.length]);


  const sortedTrades = useMemo(() => {
    return [...trades].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [trades]);

  const filtered = useMemo(() => {
    return sortedTrades.filter(t => {
      const matchSearch = t.pair.toLowerCase().includes(search.toLowerCase()) || t.id.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filterOutcome === 'all' || (t.result >= 0 ? 'win' : 'loss') === filterOutcome;
      return matchSearch && matchFilter;
    });
  }, [sortedTrades, search, filterOutcome]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const handlePageInputChange = (value: string) => {
    if (!/^\d*$/.test(value)) return;
    setPageInput(value);
    const num = Number(value);
    if (value !== '' && num >= 1 && num <= totalPages) {
      setPage(num);
    }
  };

  const handlePageInputBlur = () => {
    const parsed = parseInt(pageInput, 10);
    const normalized = isNaN(parsed) ? page : Math.min(Math.max(parsed, 1), totalPages);
    setPage(normalized);
    setPageInput(String(normalized));
  };

  return (
    <>
      <div className="glass-card p-5">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
          <h3 className="text-sm font-semibold">Trade Journal</h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search trades..."
                className="h-9 pl-9 pr-3 rounded-lg bg-secondary border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 w-48 transition-all"
              />
            </div>
            <div className="flex gap-1 bg-secondary/50 p-0.5 rounded-lg">
              {(['all', 'win', 'loss'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => { setFilterOutcome(f); setPage(1); }}
                  className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all capitalize ${filterOutcome === f ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : (
            <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                {['Trade ID', 'Pair', 'Entry', 'Exit', 'Size', 'Result', 'R:R', 'Violation', ''].map(h => (
                  <th key={h} className="text-left text-[11px] font-medium text-muted-foreground uppercase tracking-wider p-3">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <AnimatePresence mode="popLayout">
                {paged.map(t => (
                  <motion.tr
                    key={t.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="border-b border-border/50 hover:bg-secondary/30 transition-colors"
                  >
                    <td className="p-3 font-mono text-xs text-muted-foreground">{t.id}</td>
                    <td className="p-3 font-medium">{t.pair}</td>
                    <td className="p-3 font-mono text-xs">{t.entry.toFixed(4)}</td>
                    <td className="p-3 font-mono text-xs">{t.exit.toFixed(4)}</td>
                    <td className="p-3 font-mono text-xs">{t.positionSize}</td>
                    <td className={`p-3 font-mono text-xs font-semibold ${t.result >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.result >= 0 ? '+' : ''}{t.result.toFixed(2)}
                    </td>
                    <td className={`p-3 font-mono text-xs ${t.rr >= 0 ? 'text-success' : 'text-destructive'}`}>
                      {t.rr >= 0 ? '+' : ''}{t.rr.toFixed(1)}
                    </td>
                    <td className="p-3">
                      {t.ruleViolation ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full severity-high">
                          <AlertTriangle className="w-3 h-3" />{t.ruleViolation}
                        </span>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-1">
                        <button onClick={() => setReplayTrade(t)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Replay Trade">
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        {onEditTrade && (
                          <button onClick={() => onEditTrade(t)} className="p-1.5 rounded-lg hover:bg-primary/10 text-primary transition-colors" title="Edit Trade">
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-4">
          <span className="text-xs text-muted-foreground">{filtered.length} trade{filtered.length !== 1 ? 's' : ''}</span>
          <div className="flex items-center gap-2">
            <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 transition-all">
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-2">
              <label className="text-xs text-muted-foreground">Page</label>
              <input
                type="number"
                min={1}
                max={totalPages}
                value={pageInput}
                onChange={(e) => handlePageInputChange(e.target.value)}
                onBlur={handlePageInputBlur}
                className="w-14 h-8 text-sm text-center rounded-lg bg-secondary border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
              <span className="text-xs text-muted-foreground">of {totalPages}</span>
            </div>

            <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="p-1.5 rounded-lg hover:bg-secondary disabled:opacity-30 transition-all">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      <TradeReplayModal trade={replayTrade} onClose={() => setReplayTrade(null)} />
    </>
  );
}
