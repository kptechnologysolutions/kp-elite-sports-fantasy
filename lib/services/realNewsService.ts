import { NewsArticle } from './newsService';
import useSleeperStore from '@/lib/store/useSleeperStore';

class RealNewsService {
  private cache = new Map<string, { data: NewsArticle[], timestamp: number }>();
  private CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  async getPlayerNews(playerNames: string[]): Promise<NewsArticle[]> {
    const allNews: NewsArticle[] = [];
    
    // Get news for each player
    for (const playerName of playerNames) {
      const news = await this.searchPlayerNews(playerName);
      allNews.push(...news);
    }
    
    // Sort by date and remove duplicates
    const uniqueNews = Array.from(
      new Map(allNews.map(item => [item.id, item])).values()
    );
    
    return uniqueNews.sort((a, b) => b.publishedAt.getTime() - a.publishedAt.getTime());
  }

  async searchPlayerNews(playerName: string): Promise<NewsArticle[]> {
    const cacheKey = `player_${playerName}`;
    const cached = this.cache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }

    try {
      // Search multiple sources for player news
      const [espnNews, yahooNews, sleeperNews] = await Promise.all([
        this.searchESPNNews(playerName),
        this.searchYahooNews(playerName),
        this.searchSleeperTrending(playerName)
      ]);
      
      const allNews = [...espnNews, ...yahooNews, ...sleeperNews];
      
      // Cache the results
      this.cache.set(cacheKey, { data: allNews, timestamp: Date.now() });
      
      return allNews;
    } catch (error) {
      console.error('Error fetching player news:', error);
      return this.getFallbackNews(playerName);
    }
  }

  private async searchESPNNews(playerName: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`/api/news/espn?player=${encodeURIComponent(playerName)}`);
      if (!response.ok) throw new Error('ESPN API failed');
      
      const data = await response.json();
      return data.articles.map((article: any) => ({
        id: `espn_${article.id}`,
        title: article.headline,
        description: article.description || article.headline,
        url: article.links?.web?.href || '#',
        source: 'ESPN',
        publishedAt: new Date(article.published || Date.now()),
        category: this.categorizeArticle(article.headline),
        players: [playerName],
        impact: this.assessImpact(article.headline)
      }));
    } catch (error) {
      return [];
    }
  }

  private async searchYahooNews(playerName: string): Promise<NewsArticle[]> {
    try {
      const response = await fetch(`/api/news/yahoo?player=${encodeURIComponent(playerName)}`);
      if (!response.ok) throw new Error('Yahoo API failed');
      
      const data = await response.json();
      return data.items.map((item: any) => ({
        id: `yahoo_${item.guid}`,
        title: item.title,
        description: item.summary || item.title,
        url: item.link,
        source: 'Yahoo Sports',
        publishedAt: new Date(item.pubDate || Date.now()),
        category: this.categorizeArticle(item.title),
        players: [playerName],
        impact: this.assessImpact(item.title)
      }));
    } catch (error) {
      return [];
    }
  }

  private async searchSleeperTrending(playerName: string): Promise<NewsArticle[]> {
    try {
      // Get player ID from Sleeper
      const store = useSleeperStore.getState();
      const players = Array.from(store.players.values());
      const player = players.find(p => 
        `${p.first_name} ${p.last_name}`.toLowerCase() === playerName.toLowerCase()
      );
      
      if (!player) return [];
      
      // Fetch trending data from Sleeper
      const response = await fetch(`https://api.sleeper.app/v1/players/nfl/trending/add?lookback_hours=24&limit=100`);
      if (!response.ok) throw new Error('Sleeper API failed');
      
      const trendingData = await response.json();
      
      // Check if our player is trending
      const playerTrending = trendingData.find((t: any) => t.player_id === player.player_id);
      
      if (playerTrending) {
        return [{
          id: `sleeper_trending_${player.player_id}_${Date.now()}`,
          title: `${playerName} is Trending on Sleeper`,
          description: `Added by ${playerTrending.count} teams in the last 24 hours`,
          url: '#',
          source: 'Sleeper Trending',
          publishedAt: new Date(),
          category: 'waiver',
          players: [playerName],
          impact: playerTrending.count > 1000 ? 'high' : playerTrending.count > 100 ? 'medium' : 'low'
        }];
      }
      
      return [];
    } catch (error) {
      return [];
    }
  }

  private categorizeArticle(title: string): NewsArticle['category'] {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('injur') || lowerTitle.includes('hurt') || 
        lowerTitle.includes('questionable') || lowerTitle.includes('doubtful')) {
      return 'injury';
    }
    if (lowerTitle.includes('trade') || lowerTitle.includes('deal')) {
      return 'trade';
    }
    if (lowerTitle.includes('waiver') || lowerTitle.includes('pickup') || 
        lowerTitle.includes('add') || lowerTitle.includes('drop')) {
      return 'waiver';
    }
    if (lowerTitle.includes('start') || lowerTitle.includes('sit') || 
        lowerTitle.includes('matchup') || lowerTitle.includes('projection')) {
      return 'analysis';
    }
    return 'general';
  }

  private assessImpact(title: string): 'high' | 'medium' | 'low' {
    const lowerTitle = title.toLowerCase();
    
    // High impact keywords
    if (lowerTitle.includes('breaking') || lowerTitle.includes('out for season') ||
        lowerTitle.includes('ir') || lowerTitle.includes('suspended') ||
        lowerTitle.includes('traded') || lowerTitle.includes('released')) {
      return 'high';
    }
    
    // Medium impact keywords
    if (lowerTitle.includes('questionable') || lowerTitle.includes('limited') ||
        lowerTitle.includes('game-time') || lowerTitle.includes('waiver')) {
      return 'medium';
    }
    
    return 'low';
  }

  private getFallbackNews(playerName: string): NewsArticle[] {
    // Fallback to some generic recent news
    return [
      {
        id: `fallback_${playerName}_${Date.now()}`,
        title: `${playerName} - Latest Updates`,
        description: `Check the latest stats and projections for ${playerName}`,
        url: `https://www.google.com/search?q=${encodeURIComponent(playerName + ' fantasy football news')}`,
        source: 'Search Results',
        publishedAt: new Date(),
        category: 'general',
        players: [playerName],
        impact: 'low'
      }
    ];
  }

  async getRosterNews(): Promise<NewsArticle[]> {
    const store = useSleeperStore.getState();
    const { myRoster, players } = store;
    
    if (!myRoster || !myRoster.players) {
      return [];
    }
    
    // Get names of all players on roster
    const playerNames: string[] = [];
    for (const playerId of myRoster.players) {
      const player = players.get(playerId);
      if (player && player.position !== 'DEF') {
        playerNames.push(`${player.first_name} ${player.last_name}`);
      }
    }
    
    // Limit to top 10 players to avoid too many API calls
    const topPlayers = playerNames.slice(0, 10);
    
    return this.getPlayerNews(topPlayers);
  }

  async getLeagueWideNews(): Promise<NewsArticle[]> {
    try {
      // Fetch general NFL fantasy news
      const response = await fetch('/api/news/general');
      if (!response.ok) throw new Error('General news API failed');
      
      const data = await response.json();
      return data.articles;
    } catch (error) {
      // Return some recent general news
      return [
        {
          id: 'general_1',
          title: 'Week ' + Math.ceil((Date.now() - new Date('2024-09-01').getTime()) / (7 * 24 * 60 * 60 * 1000)) + ' Fantasy Football Start/Sit',
          description: 'Expert recommendations for this week\'s lineup decisions',
          url: 'https://www.fantasypros.com/nfl/start/',
          source: 'FantasyPros',
          publishedAt: new Date(),
          category: 'analysis',
          impact: 'medium'
        },
        {
          id: 'general_2',
          title: 'Top Waiver Wire Pickups',
          description: 'Players to target on the waiver wire this week',
          url: 'https://www.espn.com/fantasy/football/',
          source: 'ESPN',
          publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
          category: 'waiver',
          impact: 'medium'
        },
        {
          id: 'general_3',
          title: 'NFL Injury Report',
          description: 'Latest injury updates for fantasy-relevant players',
          url: 'https://www.nfl.com/injuries/',
          source: 'NFL.com',
          publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
          category: 'injury',
          impact: 'high'
        }
      ];
    }
  }
}

export const realNewsService = new RealNewsService();