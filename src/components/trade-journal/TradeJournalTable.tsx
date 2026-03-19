import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { 
  Search, Filter, Download, Eye, Edit, Trash2, ChevronDown, 
  ChevronLeft, ChevronRight, Calendar, TrendingUp, TrendingDown, Play 
} from 'lucide-react';
import { dataManager } from '@/lib/data-management';
import { Trade } from '@/data/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow 
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import EnhancedTradeReplayModal from '@/components/replay/EnhancedTradeReplayModal';

interface Column {
  key: keyof Trade | 'actions';
  label: string;
  sortable: boolean;
  render?: (value: string | number | Date | boolean | undefined, record: Trade) => React.ReactNode;
}

export default function TradeJournalTable() {
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState<keyof Trade>('entryTime');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [filterSymbol, setFilterSymbol] = useState<string>('all');
  const [filterDirection, setFilterDirection] = useState<string>('all');
  const [filterSetup, setFilterSetup] = useState<string>('all');
  const [filterSession, setFilterSession] = useState<string>('all');
  const [isReplayModalOpen, setIsReplayModalOpen] = useState(false);
  const [selectedTradeId, setSelectedTradeId] = useState<string>('');

  const handleSort = (column: keyof Trade) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  // Add a helper function to format cell values
  const formatCellValue = (value: string | number | Date | boolean | undefined): React.ReactNode => {
    if (value === undefined) return null;
    if (value instanceof Date) {
      return value.toLocaleDateString();
    }
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
      return value;
    }
    return String(value);
  };

  // Column definitions
  const columns: Column[] = [
    {
      key: 'tradeId',
      label: 'Trade ID',
      sortable: true,
      render: (value) => (
        <span className="font-mono text-xs text-muted-foreground">{formatCellValue(value)}</span>
      )
    },
    {
      key: 'symbol',
      label: 'Symbol',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="font-mono">
          {value}
        </Badge>
      )
    },
    {
      key: 'entryTime',
      label: 'Entry Time',
      sortable: true,
      render: (value) => formatCellValue(value)
    },
    {
      key: 'exitTime',
      label: 'Exit Time',
      sortable: true,
      render: (value) => formatCellValue(value)
    },
    {
      key: 'entryPrice',
      label: 'Entry Price',
      sortable: true,
      render: (value) => `$${formatCellValue(value)}`
    },
    {
      key: 'exitPrice',
      label: 'Exit Price',
      sortable: true,
      render: (value) => `$${formatCellValue(value)}`
    },
    {
      key: 'positionSize',
      label: 'Size',
      sortable: true,
      render: (value) => formatCellValue(value)
    },
    {
      key: 'profitLoss',
      label: 'P&L',
      sortable: true,
      render: (value) => {
        const pnl = formatCellValue(value) as number;
        return (
          <span className={`font-semibold ${
            pnl >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
          }`}>
            ${pnl >= 0 ? '+' : ''}{formatCellValue(pnl)}
          </span>
        );
      }
    },
    {
      key: 'riskReward',
      label: 'R:R',
      sortable: true,
      render: (value) => formatCellValue(value)
    },
    {
      key: 'session',
      label: 'Session',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {formatCellValue(value)}
        </Badge>
      )
    },
    {
      key: 'direction',
      label: 'Direction',
      sortable: true,
      render: (value) => (
        <Badge 
          variant={value === 'long' ? 'default' : 'destructive'}
          className="text-xs"
        >
          {formatCellValue(value)}
        </Badge>
      )
    },
    {
      key: 'setupType',
      label: 'Setup',
      sortable: true,
      render: (value) => (
        <Badge variant="outline" className="text-xs">
          {formatCellValue(value)}
        </Badge>
      )
    },
    {
      key: 'actions',
      label: 'Actions',
      sortable: false,
      render: (_, record) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setSelectedTradeId(record.tradeId);
              setIsReplayModalOpen(true);
            }}
          >
            <Play className="h-4 w-4" />
          </Button>
        </div>
      )
    }
  ];

  // Filter and sort trades
  const filteredTrades = useMemo(() => {
    let trades = dataManager.getTrades();

    // Ensure newest trades are first (descending by date)
    trades = trades.slice().sort((a, b) => new Date(b.entryTime).getTime() - new Date(a.entryTime).getTime());

    // Apply search filter
    if (searchTerm) {
      trades = trades.filter(trade =>
        Object.values(trade).some(value =>
          String(value).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Apply other filters
    if (filterSymbol !== 'all') {
      trades = trades.filter(trade => trade.symbol === filterSymbol);
    }
    if (filterDirection !== 'all') {
      trades = trades.filter(trade => trade.direction === filterDirection);
    }
    if (filterSetup !== 'all') {
      trades = trades.filter(trade => trade.setupType === filterSetup);
    }
    if (filterSession !== 'all') {
      trades = trades.filter(trade => trade.session === filterSession);
    }

    // Apply sorting
    return trades.sort((a, b) => {
      const aValue = a[sortColumn];
      const bValue = b[sortColumn];
      
      if (aValue === undefined || bValue === undefined) return 0;
      
      let comparison = 0;
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        comparison = aValue - bValue;
      } else if (aValue instanceof Date && bValue instanceof Date) {
        comparison = aValue.getTime() - bValue.getTime();
      } else {
        comparison = String(aValue).localeCompare(String(bValue));
      }
      
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [searchTerm, filterSymbol, filterDirection, filterSetup, filterSession, sortColumn, sortDirection]);

  // Pagination
  const itemsPerPage = 10;
  const totalPages = Math.ceil(filteredTrades.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedTrades = filteredTrades.slice(startIndex, startIndex + itemsPerPage);

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>Trade Journal</span>
          <div className="text-sm text-muted-foreground">
            {filteredTrades.length} trades
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6 p-4 bg-muted/30 rounded-lg">
          <div className="flex items-center gap-2 min-w-0">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search trades..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-64"
            />
          </div>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterSymbol === 'all' ? 'All Symbols' : filterSymbol}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterSymbol('all')}>
                All Symbols
              </DropdownMenuItem>
              {Array.from(new Set(filteredTrades.map(t => t.symbol))).map(symbol => (
                <DropdownMenuItem key={symbol} onClick={() => setFilterSymbol(symbol)}>
                  {symbol}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterDirection === 'all' ? 'All Directions' : filterDirection}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterDirection('all')}>
                All Directions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterDirection('long')}>
                Long Only
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterDirection('short')}>
                Short Only
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterSetup === 'all' ? 'All Setups' : filterSetup}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterSetup('all')}>
                All Setups
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('breakout')}>
                Breakout
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('pullback')}>
                Pullback
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('reversal')}>
                Reversal
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('scalp')}>
                Scalp
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('swing')}>
                Swing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSetup('position')}>
                Position
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm" className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                {filterSession === 'all' ? 'All Sessions' : filterSession}
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => setFilterSession('all')}>
                All Sessions
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSession('london')}>
                London
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSession('new-york')}>
                New York
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSession('tokyo')}>
                Tokyo
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSession('sydney')}>
                Sydney
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setFilterSession('overlap')}>
                Overlap
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="outline" size="sm" className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Export
          </Button>
        </div>

        {/* Table */}
        <div className="rounded-lg border bg-background overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((column) => (
                  <TableHead key={column.key} className={column.sortable ? 'cursor-pointer' : ''}>
                    <div 
                      className="flex items-center gap-2"
                      onClick={() => column.sortable && column.key !== 'actions' && handleSort(column.key as keyof Trade)}
                    >
                      {column.label}
                      {column.sortable && (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </div>
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedTrades.map((trade, index) => (
                <TableRow key={trade.tradeId} className="hover:bg-muted/50">
                  {columns.map((column) => (
                    <TableCell key={column.key}>
                      {column.render ? column.render(trade[column.key], trade) : formatCellValue(trade[column.key])}
                    </TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
