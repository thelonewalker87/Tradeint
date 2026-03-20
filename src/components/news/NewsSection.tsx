import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Newspaper, TrendingUp, TrendingDown, Clock, Filter, Globe 
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import NewsService, { NewsItem } from '@/services/NewsService';

const categoryColors = {
  market: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300',
  economic: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300',
  crypto: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-300',
  forex: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-300',
  commodities: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-300'
};

const sentimentColors = {
  bullish: 'text-green-600 dark:text-green-400',
  bearish: 'text-red-600 dark:text-red-400',
  neutral: 'text-gray-600 dark:text-gray-400'
};

const impactColors = {
  high: 'bg-red-500',
  medium: 'bg-yellow-500',
  low: 'bg-green-500'
};

interface VolatilityData {
  symbol: string;
  current: number;
  change: number;
  changePercent: number;
  volatility: number;
  volume: string;
  high: number;
  low: number;
}

const mockVolatility: VolatilityData[] = [
  {
    symbol: 'EUR/USD',
    current: 1.0867,
    change: 0.0023,
    changePercent: 0.21,
    volatility: 12.5,
    volume: '2.3B',
    high: 1.0892,
    low: 1.0845
  },
  {
    symbol: 'GBP/USD',
    current: 1.2634,
    change: -0.0012,
    changePercent: -0.09,
    volatility: 15.2,
    volume: '1.8B',
    high: 1.2656,
    low: 1.2621
  },
  {
    symbol: 'USD/JPY',
    current: 148.23,
    change: 0.45,
    changePercent: 0.30,
    volatility: 18.7,
    volume: '3.1B',
    high: 148.67,
    low: 147.89
  },
  {
    symbol: 'BTC/USD',
    current: 71234,
    change: 2345,
    changePercent: 3.40,
    volatility: 45.2,
    volume: '28.5B',
    high: 71890,
    low: 68920
  }
];

export default function NewsSection() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedTimeRange, setSelectedTimeRange] = useState('today');
  const [activeTab, setActiveTab] = useState('news');

  useEffect(() => {
    const newsService = NewsService.getInstance();
    
    setNewsList(newsService.getNews());

    const handleNewsUpdate = (data: NewsItem[]) => {
      setNewsList([...data]);
    };

    newsService.subscribe(handleNewsUpdate);
    return () => newsService.unsubscribe(handleNewsUpdate);
  }, []);

  const filteredNews = newsList.filter(news => {
    if (selectedCategory === 'all') return true;
    return news.category === selectedCategory;
  });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`;
    return `${Math.floor(diffInMinutes / 1440)}d ago`;
  };

  return (
    <Card className="glass-card border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl">
              <Newspaper className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold">Market Intelligence</h3>
              <p className="text-sm text-muted-foreground">
                Real-time news and market volatility
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={selectedTimeRange} onValueChange={setSelectedTimeRange}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Time range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">Today</SelectItem>
                <SelectItem value="week">This Week</SelectItem>
                <SelectItem value="month">This Month</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardTitle>
      </CardHeader>
      
      <CardContent className="space-y-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="news" className="flex items-center gap-2">
              <Newspaper className="h-4 w-4" />
              Market News
            </TabsTrigger>
            <TabsTrigger value="volatility" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Volatility Monitor
            </TabsTrigger>
          </TabsList>

          <TabsContent value="news" className="space-y-4 mt-4">
            {/* Category Filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-1">
                {['all', 'market', 'economic', 'crypto', 'forex', 'commodities'].map(category => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                    className="capitalize"
                  >
                    {category}
                  </Button>
                ))}
              </div>
            </div>

            {/* News List */}
            <div className="space-y-3">
              <AnimatePresence>
                {filteredNews.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="p-8 text-center text-muted-foreground border rounded-lg bg-background/50 backdrop-blur-sm"
                  >
                    No news found for the selected filters. Try adjusting your criteria.
                  </motion.div>
                ) : (
                  filteredNews.map((news, index) => (
                    <motion.div
                      key={news.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.1 }}
                      className="p-4 rounded-lg border bg-background/50 backdrop-blur-sm transition-all"
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 space-y-2">
                          {/* Header */}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Badge className={categoryColors[news.category as keyof typeof categoryColors] || ''}>
                              {news.category}
                            </Badge>
                            <div className={`flex items-center gap-1 text-sm font-medium ${sentimentColors[news.sentiment as keyof typeof sentimentColors] || sentimentColors.neutral}`}>
                              {news.sentiment === 'bullish' && <TrendingUp className="h-3 w-3" />}
                              {news.sentiment === 'bearish' && <TrendingDown className="h-3 w-3" />}
                              <span className="capitalize">{news.sentiment}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <div className={`w-2 h-2 rounded-full ${impactColors[news.impact as keyof typeof impactColors] || impactColors.low}`} />
                              <span className="text-xs text-muted-foreground capitalize">{news.impact}</span>
                            </div>
                          </div>
  
                          {/* Title */}
                          <h4 className="font-semibold text-foreground leading-tight">
                            {news.title}
                          </h4>
  
                          {/* Summary */}
                          <p className="text-sm text-muted-foreground leading-relaxed">
                            {news.summary}
                          </p>
  
                          {/* Footer */}
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Globe className="h-3 w-3" />
                                {news.source}
                              </span>
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {formatTimeAgo(news.publishedAt)}
                              </span>
                            </div>
                          </div>
  
                          {/* Symbols */}
                          {news.symbols && news.symbols.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {news.symbols.map(symbol => (
                                <Badge key={symbol} variant="outline" className="text-xs">
                                  {symbol}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </TabsContent>

          {/* Volatility Tab */}
          <TabsContent value="volatility" className="mt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {mockVolatility.map((vol, index) => (
                <motion.div
                  key={vol.symbol}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className="p-4 rounded-lg border bg-background/50 backdrop-blur-sm hover:bg-muted/30 transition-all"
                >
                  <div className="space-y-3">
                    {/* Symbol Header */}
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-lg">{vol.symbol}</h4>
                      <div className={`flex items-center gap-1 text-sm font-bold ${
                        vol.change >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {vol.change >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                        {vol.changePercent >= 0 ? '+' : ''}{vol.changePercent.toFixed(2)}%
                      </div>
                    </div>

                    {/* Current Price */}
                    <div className="text-center">
                      <div className="text-2xl font-bold text-foreground">
                        {vol.current.toLocaleString()}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Current Price
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-mono font-bold text-foreground">
                          {vol.high.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">High</div>
                      </div>
                      <div className="text-center p-2 bg-muted/30 rounded">
                        <div className="font-mono font-bold text-foreground">
                          {vol.low.toLocaleString()}
                        </div>
                        <div className="text-muted-foreground">Low</div>
                      </div>
                    </div>

                    {/* Volatility Bar */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">Volatility</span>
                        <span className="font-bold">{vol.volatility.toFixed(1)}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, vol.volatility * 2)}%` }}
                          transition={{ delay: index * 0.2, duration: 0.8 }}
                        />
                      </div>
                    </div>

                    {/* Volume */}
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Volume</span>
                      <span className="font-bold">{vol.volume}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
