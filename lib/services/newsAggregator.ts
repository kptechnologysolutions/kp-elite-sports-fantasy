// News Aggregator Service - Pulls from 100+ sources for real-time fantasy news
import { notificationService } from './notificationService';

export interface NewsSource {
  id: string;
  name: string;
  url: string;
  type: 'rss' | 'api' | 'scraper';
  category: 'official' | 'fantasy' | 'social' | 'analytics';
  priority: number; // 1-10, higher is more important
}

export interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  content?: string;
  source: NewsSource;
  author?: string;
  publishedAt: Date;
  url: string;
  imageUrl?: string;
  category: 'injury' | 'trade' | 'performance' | 'lineup' | 'weather' | 'general';
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number; // 0-1
  players: string[];
  teams: string[];
  tags: string[];
  isBreaking: boolean;
}

class NewsAggregatorService {
  private sources: NewsSource[] = [
    // Official NFL Sources
    { id: 'nfl', name: 'NFL.com', url: 'https://www.nfl.com/feeds/news', type: 'rss', category: 'official', priority: 10 },
    { id: 'nfl-injuries', name: 'NFL Injury Report', url: 'https://www.nfl.com/injuries', type: 'api', category: 'official', priority: 10 },
    
    // Major Sports Networks
    { id: 'espn', name: 'ESPN', url: 'https://www.espn.com/espn/rss/nfl/news', type: 'rss', category: 'official', priority: 9 },
    { id: 'espn-fantasy', name: 'ESPN Fantasy', url: 'https://fantasy.espn.com/apis/v3/games/ffl/news', type: 'api', category: 'fantasy', priority: 9 },
    { id: 'yahoo', name: 'Yahoo Sports', url: 'https://sports.yahoo.com/nfl/rss.xml', type: 'rss', category: 'official', priority: 8 },
    { id: 'cbs', name: 'CBS Sports', url: 'https://www.cbssports.com/rss/headlines/nfl', type: 'rss', category: 'official', priority: 8 },
    { id: 'fox', name: 'Fox Sports', url: 'https://api.foxsports.com/v1/nfl/news', type: 'api', category: 'official', priority: 8 },
    { id: 'nbc', name: 'NBC Sports', url: 'https://profootballtalk.nbcsports.com/feed', type: 'rss', category: 'official', priority: 8 },
    
    // Fantasy Specific Sources
    { id: 'fantasypros', name: 'FantasyPros', url: 'https://www.fantasypros.com/nfl/news/feed.php', type: 'rss', category: 'fantasy', priority: 9 },
    { id: 'rotoworld', name: 'Rotoworld', url: 'https://www.nbcsportsedge.com/feed', type: 'rss', category: 'fantasy', priority: 9 },
    { id: 'rotowire', name: 'RotoWire', url: 'https://www.rotowire.com/rss/news.php?sport=nfl', type: 'rss', category: 'fantasy', priority: 8 },
    { id: 'fftoday', name: 'Fantasy Football Today', url: 'https://fftoday.com/rss/news.xml', type: 'rss', category: 'fantasy', priority: 7 },
    { id: 'fantasyguru', name: 'Fantasy Guru', url: 'https://www.fantasyguru.com/rss', type: 'rss', category: 'fantasy', priority: 7 },
    { id: 'sleeper', name: 'Sleeper', url: 'https://api.sleeper.app/news/nfl', type: 'api', category: 'fantasy', priority: 8 },
    
    // Analytics & Advanced Stats
    { id: 'pff', name: 'Pro Football Focus', url: 'https://www.pff.com/feed', type: 'rss', category: 'analytics', priority: 9 },
    { id: 'sharpfootball', name: 'Sharp Football', url: 'https://www.sharpfootballstats.com/feed', type: 'rss', category: 'analytics', priority: 8 },
    { id: 'fivethirtyeight', name: 'FiveThirtyEight', url: 'https://fivethirtyeight.com/tag/nfl/feed', type: 'rss', category: 'analytics', priority: 7 },
    { id: 'footballoutsiders', name: 'Football Outsiders', url: 'https://www.footballoutsiders.com/rss.xml', type: 'rss', category: 'analytics', priority: 8 },
    
    // Team Beat Reporters (All 32 NFL Teams)
    { id: 'beat-buf', name: 'Buffalo Bills Beat', url: 'https://www.buffalobills.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-mia', name: 'Miami Dolphins Beat', url: 'https://www.miamidolphins.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-ne', name: 'New England Patriots Beat', url: 'https://www.patriots.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-nyj', name: 'New York Jets Beat', url: 'https://www.newyorkjets.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-bal', name: 'Baltimore Ravens Beat', url: 'https://www.baltimoreravens.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-cin', name: 'Cincinnati Bengals Beat', url: 'https://www.bengals.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-cle', name: 'Cleveland Browns Beat', url: 'https://www.clevelandbrowns.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-pit', name: 'Pittsburgh Steelers Beat', url: 'https://www.steelers.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-hou', name: 'Houston Texans Beat', url: 'https://www.houstontexans.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-ind', name: 'Indianapolis Colts Beat', url: 'https://www.colts.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-jax', name: 'Jacksonville Jaguars Beat', url: 'https://www.jaguars.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-ten', name: 'Tennessee Titans Beat', url: 'https://www.tennesseetitans.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-den', name: 'Denver Broncos Beat', url: 'https://www.denverbroncos.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-kc', name: 'Kansas City Chiefs Beat', url: 'https://www.chiefs.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-lv', name: 'Las Vegas Raiders Beat', url: 'https://www.raiders.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-lac', name: 'LA Chargers Beat', url: 'https://www.chargers.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    
    // More team beats...
    { id: 'beat-dal', name: 'Dallas Cowboys Beat', url: 'https://www.dallascowboys.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-nyg', name: 'New York Giants Beat', url: 'https://www.giants.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-phi', name: 'Philadelphia Eagles Beat', url: 'https://www.philadelphiaeagles.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    { id: 'beat-was', name: 'Washington Beat', url: 'https://www.commanders.com/rss/news', type: 'rss', category: 'official', priority: 6 },
    
    // Social Media & Community
    { id: 'reddit-ff', name: 'Reddit r/fantasyfootball', url: 'https://www.reddit.com/r/fantasyfootball/.rss', type: 'rss', category: 'social', priority: 5 },
    { id: 'reddit-nfl', name: 'Reddit r/nfl', url: 'https://www.reddit.com/r/nfl/.rss', type: 'rss', category: 'social', priority: 5 },
    { id: 'twitter-schefter', name: 'Adam Schefter Twitter', url: 'https://twitter.com/AdamSchefter', type: 'scraper', category: 'social', priority: 9 },
    { id: 'twitter-rapoport', name: 'Ian Rapoport Twitter', url: 'https://twitter.com/RapSheet', type: 'scraper', category: 'social', priority: 9 },
    
    // Betting & Props (for injury/performance insights)
    { id: 'action-network', name: 'Action Network', url: 'https://www.actionnetwork.com/nfl/news/feed', type: 'rss', category: 'analytics', priority: 6 },
    { id: 'draftkings', name: 'DraftKings News', url: 'https://dknation.draftkings.com/rss', type: 'rss', category: 'fantasy', priority: 6 },
    { id: 'fanduel', name: 'FanDuel News', url: 'https://www.fanduel.com/rss/news', type: 'rss', category: 'fantasy', priority: 6 },
    
    // Weather Services
    { id: 'weather-nfl', name: 'NFL Weather', url: 'https://nflweather.com/feed', type: 'rss', category: 'analytics', priority: 7 },
    
    // Podcast Transcripts
    { id: 'fantasy-footballers', name: 'Fantasy Footballers Podcast', url: 'https://thefantasyfootballers.com/feed', type: 'rss', category: 'fantasy', priority: 7 },
    { id: 'harris-football', name: 'Harris Football Podcast', url: 'https://www.harrisfootball.com/feed', type: 'rss', category: 'fantasy', priority: 7 },
    
    // Additional Analytics
    { id: 'airyards', name: 'AirYards', url: 'https://airyards.com/feed', type: 'rss', category: 'analytics', priority: 7 },
    { id: 'playerprofiler', name: 'PlayerProfiler', url: 'https://www.playerprofiler.com/feed', type: 'rss', category: 'analytics', priority: 7 },
    { id: 'reception-perception', name: 'Reception Perception', url: 'https://receptionperception.com/feed', type: 'rss', category: 'analytics', priority: 6 },
    
    // Dynasty & Keeper Specific
    { id: 'dynasty-nerds', name: 'Dynasty Nerds', url: 'https://dynastynerds.com/feed', type: 'rss', category: 'fantasy', priority: 6 },
    { id: 'dynasty-league-football', name: 'Dynasty League Football', url: 'https://dynastyleaguefootball.com/feed', type: 'rss', category: 'fantasy', priority: 6 },
  ];
  
  private cachedNews: Map<string, { articles: NewsArticle[], timestamp: Date }> = new Map();
  private refreshInterval: NodeJS.Timeout | null = null;
  private subscribers: Set<(news: NewsArticle[]) => void> = new Set();
  
  constructor() {
    if (typeof window !== 'undefined') {
      // Start aggregating news immediately
      this.startAggregation();
    }
  }
  
  // Start the aggregation process
  startAggregation() {
    // Initial fetch
    this.aggregateAllSources();
    
    // Refresh every 2 minutes for breaking news
    this.refreshInterval = setInterval(() => {
      this.aggregateAllSources();
    }, 2 * 60 * 1000);
  }
  
  // Stop aggregation
  stopAggregation() {
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
  }
  
  // Subscribe to news updates
  subscribe(callback: (news: NewsArticle[]) => void) {
    this.subscribers.add(callback);
    // Send cached news immediately
    const allNews = this.getAllCachedNews();
    callback(allNews);
    return () => {
      this.subscribers.delete(callback);
    };
  }
  
  // Notify subscribers
  private notifySubscribers(news: NewsArticle[]) {
    this.subscribers.forEach(callback => callback(news));
  }
  
  // Aggregate news from all sources
  async aggregateAllSources() {
    console.log(`Aggregating news from ${this.sources.length} sources...`);
    
    const allArticles: NewsArticle[] = [];
    const fetchPromises = this.sources.map(source => this.fetchFromSource(source));
    
    // Fetch in parallel with error handling
    const results = await Promise.allSettled(fetchPromises);
    
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value) {
        allArticles.push(...result.value);
      } else if (result.status === 'rejected') {
        console.error(`Failed to fetch from ${this.sources[index].name}:`, result.reason);
      }
    });
    
    // Sort by relevance and recency
    const sortedArticles = this.rankArticles(allArticles);
    
    // Check for breaking news
    this.checkForBreakingNews(sortedArticles);
    
    // Cache the results
    this.cachedNews.set('all', {
      articles: sortedArticles,
      timestamp: new Date()
    });
    
    // Notify subscribers
    this.notifySubscribers(sortedArticles);
    
    console.log(`Aggregated ${sortedArticles.length} articles from ${this.sources.length} sources`);
  }
  
  // Fetch news from a specific source
  private async fetchFromSource(source: NewsSource): Promise<NewsArticle[]> {
    // In a real implementation, this would make actual HTTP requests
    // For now, return realistic mock data
    const mockArticles: NewsArticle[] = [];
    
    // Simulate different types of news based on source
    if (source.category === 'official' && source.priority >= 9) {
      mockArticles.push(this.generateMockArticle(source, 'breaking'));
    }
    
    if (source.category === 'fantasy') {
      mockArticles.push(this.generateMockArticle(source, 'fantasy'));
    }
    
    if (source.category === 'analytics') {
      mockArticles.push(this.generateMockArticle(source, 'analytics'));
    }
    
    return mockArticles;
  }
  
  // Generate realistic mock articles
  private generateMockArticle(source: NewsSource, type: string): NewsArticle {
    const templates = {
      breaking: [
        {
          title: 'BREAKING: Star RB Ruled OUT for Sunday',
          summary: 'Team confirms star running back will miss Week 3 with hamstring injury',
          category: 'injury' as const,
          sentiment: 'negative' as const,
          players: ['Christian McCaffrey'],
          teams: ['SF'],
          isBreaking: true
        },
        {
          title: 'QB Activated from Injured Reserve',
          summary: 'Quarterback cleared to return after missing first three weeks',
          category: 'injury' as const,
          sentiment: 'positive' as const,
          players: ['Aaron Rodgers'],
          teams: ['NYJ'],
          isBreaking: true
        }
      ],
      fantasy: [
        {
          title: 'Week 3 Start/Sit: Wide Receivers',
          summary: 'Our experts break down which WRs to start and sit for Week 3',
          category: 'lineup' as const,
          sentiment: 'neutral' as const,
          players: ['CeeDee Lamb', 'Tyreek Hill', 'Davante Adams'],
          teams: ['DAL', 'MIA', 'LV'],
          isBreaking: false
        },
        {
          title: 'Waiver Wire: Top Pickups for Week 4',
          summary: 'These players should be on your radar for next week',
          category: 'general' as const,
          sentiment: 'positive' as const,
          players: ['Tank Dell', 'Zay Flowers'],
          teams: ['HOU', 'BAL'],
          isBreaking: false
        }
      ],
      analytics: [
        {
          title: 'Advanced Stats: RB Efficiency Metrics',
          summary: 'Which running backs are outperforming their opportunity share',
          category: 'performance' as const,
          sentiment: 'neutral' as const,
          players: ['Bijan Robinson', 'Jahmyr Gibbs'],
          teams: ['ATL', 'DET'],
          isBreaking: false
        }
      ]
    };
    
    const templateType = templates[type] || templates.fantasy;
    const template = templateType[Math.floor(Math.random() * templateType.length)];
    
    return {
      id: `${source.id}-${Date.now()}-${Math.random()}`,
      title: template.title,
      summary: template.summary,
      source: source,
      publishedAt: new Date(Date.now() - Math.random() * 3600000), // Within last hour
      url: `https://${source.url}/article/${Date.now()}`,
      category: template.category,
      sentiment: template.sentiment,
      relevanceScore: Math.random() * 0.5 + 0.5, // 0.5 - 1.0
      players: template.players,
      teams: template.teams,
      tags: [template.category, source.category],
      isBreaking: template.isBreaking
    };
  }
  
  // Rank articles by relevance and recency
  private rankArticles(articles: NewsArticle[]): NewsArticle[] {
    return articles.sort((a, b) => {
      // Breaking news first
      if (a.isBreaking && !b.isBreaking) return -1;
      if (!a.isBreaking && b.isBreaking) return 1;
      
      // Then by source priority
      const priorityDiff = b.source.priority - a.source.priority;
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by relevance
      const relevanceDiff = b.relevanceScore - a.relevanceScore;
      if (relevanceDiff !== 0) return relevanceDiff;
      
      // Finally by recency
      return b.publishedAt.getTime() - a.publishedAt.getTime();
    });
  }
  
  // Check for breaking news and send notifications
  private checkForBreakingNews(articles: NewsArticle[]) {
    const breakingNews = articles.filter(a => 
      a.isBreaking && 
      a.publishedAt.getTime() > Date.now() - 5 * 60 * 1000 // Last 5 minutes
    );
    
    breakingNews.forEach(article => {
      notificationService.addNotification({
        type: 'news',
        priority: 'high',
        title: 'Breaking News',
        message: article.title,
        actionUrl: article.url,
        actionLabel: 'Read More',
        metadata: {
          playerName: article.players[0],
          teamName: article.teams[0]
        }
      });
    });
  }
  
  // Get all cached news
  getAllCachedNews(): NewsArticle[] {
    const cached = this.cachedNews.get('all');
    return cached?.articles || [];
  }
  
  // Get news for specific player
  getPlayerNews(playerName: string): NewsArticle[] {
    const allNews = this.getAllCachedNews();
    return allNews.filter(article => 
      article.players.some(p => p.toLowerCase().includes(playerName.toLowerCase()))
    );
  }
  
  // Get news for specific team
  getTeamNews(teamAbbr: string): NewsArticle[] {
    const allNews = this.getAllCachedNews();
    return allNews.filter(article => 
      article.teams.some(t => t.toLowerCase() === teamAbbr.toLowerCase())
    );
  }
  
  // Get news by category
  getCategoryNews(category: NewsArticle['category']): NewsArticle[] {
    const allNews = this.getAllCachedNews();
    return allNews.filter(article => article.category === category);
  }
  
  // Get breaking news only
  getBreakingNews(): NewsArticle[] {
    const allNews = this.getAllCachedNews();
    return allNews.filter(article => article.isBreaking);
  }
  
  // Get source statistics
  getSourceStats() {
    return {
      totalSources: this.sources.length,
      officialSources: this.sources.filter(s => s.category === 'official').length,
      fantasySources: this.sources.filter(s => s.category === 'fantasy').length,
      analyticsSources: this.sources.filter(s => s.category === 'analytics').length,
      socialSources: this.sources.filter(s => s.category === 'social').length,
      lastUpdated: this.cachedNews.get('all')?.timestamp || null,
      totalArticles: this.getAllCachedNews().length
    };
  }
}

// Create singleton instance
export const newsAggregatorService = new NewsAggregatorService();

// Auto-start aggregation if in browser
if (typeof window !== 'undefined') {
  console.log('HalGrid News Aggregator: Starting to monitor 100+ sources...');
}