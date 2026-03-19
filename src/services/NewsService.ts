import React from 'react';
import { toast } from 'sonner';

export interface NewsItem {
  id: string;
  title: string;
  summary: string;
  source: string;
  publishedAt: string;
  category: 'market' | 'economic' | 'crypto' | 'forex' | 'commodities';
  sentiment: 'bullish' | 'bearish' | 'neutral';
  impact: 'high' | 'medium' | 'low';
  url?: string;
  symbols?: string[];
}

export interface NewsAnalytics {
  totalNews: number;
  highImpact: number;
  marketSentiment: 'bullish' | 'bearish' | 'neutral';
  avgSentimentScore: number;
}

// Several realistic RSS feeds converted to JSON
const RSS_FEEDS = [
  'https://api.rss2json.com/v1/api.json?rss_url=https://www.investing.com/rss/news_285.rss', // Forex
  'https://api.rss2json.com/v1/api.json?rss_url=https://www.investing.com/rss/news_25.rss', // Crypto
  'https://api.rss2json.com/v1/api.json?rss_url=https://www.investing.com/rss/news_11.rss' // Commodities
];

class NewsService {
  private static instance: NewsService;
  private news: NewsItem[] = [];
  private listeners: ((data: NewsItem[], analytics: NewsAnalytics) => void)[] = [];
  private isInitialized = false;

  static getInstance(): NewsService {
    if (!NewsService.instance) {
      NewsService.instance = new NewsService();
    }
    return NewsService.instance;
  }

  private constructor() {
    this.initializeNews();
  }

  private async initializeNews() {
    await this.fetchRealNews(true);
    this.isInitialized = true;
    this.startRealTimeUpdates();
  }

  private startRealTimeUpdates() {
    // Poll for new news every 2 minutes to save API limits but stay real-time
    setInterval(() => {
      this.fetchRealNews(false);
    }, 120000);
  }

  private determineSentiment(title: string, summary: string): 'bullish' | 'bearish' | 'neutral' {
    const text = (title + ' ' + summary).toLowerCase();
    const bullishWords = ['surge', 'rise', 'jump', 'gain', 'bull', 'high', 'up', 'growth', 'positive', 'rally'];
    const bearishWords = ['drop', 'fall', 'plunge', 'loss', 'bear', 'low', 'down', 'decline', 'negative', 'crash'];

    let score = 0;
    bullishWords.forEach(w => { if (text.includes(w)) score++; });
    bearishWords.forEach(w => { if (text.includes(w)) score--; });

    if (score > 0) return 'bullish';
    if (score < 0) return 'bearish';
    return 'neutral';
  }

  private determineImpact(title: string): 'high' | 'medium' | 'low' {
    const text = title.toLowerCase();
    const highImpact = ['fed', 'ecb', 'inflation', 'cpi', 'rate', 'nfp', 'gdp', 'crash', 'surge', 'war', 'crisis'];
    if (highImpact.some(w => text.includes(w))) return 'high';
    return Math.random() > 0.6 ? 'medium' : 'low'; // Randomize remaining lightly
  }

  private determineCategory(feedUrl: string): 'market' | 'economic' | 'crypto' | 'forex' | 'commodities' {
    if (feedUrl.includes('25.rss')) return 'crypto';
    if (feedUrl.includes('11.rss')) return 'commodities';
    if (feedUrl.includes('285.rss')) return 'forex';
    return 'market';
  }

  private async fetchRealNews(isInitialLoad: boolean) {
    try {
      const allNewsPromises = RSS_FEEDS.map(feed => fetch(feed).then(res => res.json()));
      const feedsData = await Promise.all(allNewsPromises);

      let newItemsFound = false;

      // Process each feed
      feedsData.forEach((data, index) => {
        if (data.status === 'ok' && data.items) {
          const category = this.determineCategory(RSS_FEEDS[index]);
          
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          data.items.forEach((item: any) => {
            // Check if we already have this news item
            const exists = this.news.find(n => n.url === item.link || n.title === item.title);
            
            if (!exists) {
              const newsItem: NewsItem = {
                id: item.guid || Date.now().toString() + Math.random().toString(),
                title: item.title,
                summary: item.description.replace(/<[^>]*>?/gm, '').substring(0, 150) + '...', // strip HTML
                source: data.feed.title || 'Market News',
                publishedAt: new Date(item.pubDate.replace(' ', 'T')).toISOString(),
                category: category,
                sentiment: this.determineSentiment(item.title, item.description),
                impact: this.determineImpact(item.title),
                url: item.link,
                symbols: []
              };

              this.news.push(newsItem);
              newItemsFound = true;

              // If it's NOT the first load, meaning it genuinely just arrived live, trigger the toast
              if (!isInitialLoad) {
                toast(newsItem.title, {
                  description: `${newsItem.impact.toUpperCase()} IMPACT • ${newsItem.category.toUpperCase()}`,
                  icon: newsItem.impact === 'high' ? '🚨' : '📰',
                  duration: 6000
                });
              }
            }
          });
        }
      });

      if (newItemsFound) {
        // Sort by newest first
        this.news.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());
        
        // Keep memory bounded to latest 50 items
        if (this.news.length > 50) {
          this.news = this.news.slice(0, 50);
        }

        this.notifyListeners();
      }
    } catch (error) {
      console.error('Failed to fetch real news:', error);
    }
  }

  private calculateAnalytics(): NewsAnalytics {
    const totalNews = this.news.length;
    const highImpact = this.news.filter(item => item.impact === 'high').length;
    const bullishCount = this.news.filter(item => item.sentiment === 'bullish').length;
    const bearishCount = this.news.filter(item => item.sentiment === 'bearish').length;
    
    let avgSentimentScore = 0;
    if (totalNews > 0) {
      avgSentimentScore = (bullishCount - bearishCount) / totalNews;
    }

    return {
      totalNews,
      highImpact,
      marketSentiment: avgSentimentScore > 0.1 ? 'bullish' : avgSentimentScore < -0.1 ? 'bearish' : 'neutral',
      avgSentimentScore: parseFloat(avgSentimentScore.toFixed(2))
    };
  }

  private notifyListeners() {
    const analytics = this.calculateAnalytics();
    this.listeners.forEach(listener => listener(this.news, analytics));
  }

  public subscribe(listener: (data: NewsItem[], analytics: NewsAnalytics) => void) {
    this.listeners.push(listener);
    // Immediately notify with current data
    if (this.isInitialized) {
      listener(this.news, this.calculateAnalytics());
    }
  }

  public unsubscribe(listener: (data: NewsItem[], analytics: NewsAnalytics) => void) {
    this.listeners = this.listeners.filter(l => l !== listener);
  }

  public getNews(): NewsItem[] {
    return this.news;
  }

  public getAnalytics(): NewsAnalytics {
    return this.calculateAnalytics();
  }
}

export default NewsService;
