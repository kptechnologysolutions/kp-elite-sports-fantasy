export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: Date;
  imageUrl?: string;
  category: 'injury' | 'trade' | 'waiver' | 'analysis' | 'general';
  players?: string[];
  teams?: string[];
  impact?: 'high' | 'medium' | 'low';
}

export interface NFLGame {
  gameId: string;
  week: number;
  homeTeam: string;
  awayTeam: string;
  gameTime: Date;
  homeRecord: { wins: number; losses: number };
  awayRecord: { wins: number; losses: number };
  spread?: number;
  overUnder?: number;
  homeProjectedScore?: number;
  awayProjectedScore?: number;
  difficulty: {
    home: 'easy' | 'moderate' | 'tough' | 'very-tough';
    away: 'easy' | 'moderate' | 'tough' | 'very-tough';
  };
  weather?: {
    temp: number;
    condition: string;
    windSpeed: number;
  };
}

class NewsService {
  // Mock news data - in production, would fetch from RSS feeds or APIs
  async getFantasyNews(limit = 10): Promise<NewsArticle[]> {
    // In production, you would fetch from:
    // - ESPN Fantasy API
    // - Yahoo Sports RSS
    // - RotoBaller RSS
    // - FantasyPros API
    // - Reddit r/fantasyfootball API
    // - Sleeper trending news
    
    const mockNews: NewsArticle[] = [
      {
        id: '1',
        title: 'Christian McCaffrey Returns to Practice',
        description: 'CMC was seen at practice today, indicating he could return for Week ' + new Date().getDate(),
        url: 'https://example.com',
        source: 'ESPN',
        publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        category: 'injury',
        players: ['Christian McCaffrey'],
        teams: ['SF'],
        impact: 'high'
      },
      {
        id: '2',
        title: 'Waiver Wire: Top Pickups for Week ' + new Date().getDate(),
        description: 'These players are must-adds from the waiver wire this week',
        url: 'https://example.com',
        source: 'FantasyPros',
        publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
        category: 'waiver',
        impact: 'medium'
      },
      {
        id: '3',
        title: 'Breaking: Star WR Traded to Contender',
        description: 'Major trade shakes up fantasy landscape as elite receiver finds new home',
        url: 'https://example.com',
        source: 'NFL Network',
        publishedAt: new Date(Date.now() - 1 * 60 * 60 * 1000),
        category: 'trade',
        impact: 'high'
      },
      {
        id: '4',
        title: 'Week ' + new Date().getDate() + ' Start/Sit Analysis',
        description: 'Expert recommendations for tough lineup decisions',
        url: 'https://example.com',
        source: 'RotoBaller',
        publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000),
        category: 'analysis',
        impact: 'medium'
      },
      {
        id: '5',
        title: 'Injury Report: Key Players Questionable',
        description: 'Several fantasy-relevant players listed as questionable for Sunday',
        url: 'https://example.com',
        source: 'Yahoo Sports',
        publishedAt: new Date(Date.now() - 3 * 60 * 60 * 1000),
        category: 'injury',
        impact: 'high'
      }
    ];
    
    return mockNews.slice(0, limit);
  }
  
  // Get upcoming NFL games with difficulty ratings
  async getUpcomingGames(week?: number): Promise<NFLGame[]> {
    // In production, fetch from NFL API or ESPN API
    const currentWeek = week || Math.floor(Date.now() / (7 * 24 * 60 * 60 * 1000)) % 18 + 1;
    
    // Mock NFL games
    const games: NFLGame[] = [
      {
        gameId: '1',
        week: currentWeek,
        homeTeam: 'KC',
        awayTeam: 'BUF',
        gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 9, losses: 2 },
        awayRecord: { wins: 8, losses: 3 },
        spread: -3,
        overUnder: 48.5,
        homeProjectedScore: 27,
        awayProjectedScore: 24,
        difficulty: {
          home: 'tough',
          away: 'very-tough'
        }
      },
      {
        gameId: '2',
        week: currentWeek,
        homeTeam: 'SF',
        awayTeam: 'DAL',
        gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 7, losses: 4 },
        awayRecord: { wins: 8, losses: 3 },
        spread: -4.5,
        overUnder: 45,
        homeProjectedScore: 24,
        awayProjectedScore: 21,
        difficulty: {
          home: 'moderate',
          away: 'tough'
        }
      },
      {
        gameId: '3',
        week: currentWeek,
        homeTeam: 'MIA',
        awayTeam: 'NYJ',
        gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 8, losses: 3 },
        awayRecord: { wins: 4, losses: 7 },
        spread: -7,
        overUnder: 42,
        homeProjectedScore: 28,
        awayProjectedScore: 17,
        difficulty: {
          home: 'easy',
          away: 'very-tough'
        }
      },
      {
        gameId: '4',
        week: currentWeek,
        homeTeam: 'GB',
        awayTeam: 'MIN',
        gameTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 6, losses: 5 },
        awayRecord: { wins: 7, losses: 4 },
        spread: -1.5,
        overUnder: 47,
        homeProjectedScore: 24,
        awayProjectedScore: 23,
        difficulty: {
          home: 'moderate',
          away: 'moderate'
        },
        weather: {
          temp: 35,
          condition: 'Snow',
          windSpeed: 15
        }
      },
      {
        gameId: '5',
        week: currentWeek,
        homeTeam: 'DET',
        awayTeam: 'CHI',
        gameTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 10, losses: 1 },
        awayRecord: { wins: 3, losses: 8 },
        spread: -10.5,
        overUnder: 44,
        homeProjectedScore: 31,
        awayProjectedScore: 17,
        difficulty: {
          home: 'easy',
          away: 'very-tough'
        }
      },
      {
        gameId: '6',
        week: currentWeek,
        homeTeam: 'PHI',
        awayTeam: 'WAS',
        gameTime: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        homeRecord: { wins: 9, losses: 2 },
        awayRecord: { wins: 4, losses: 7 },
        spread: -8.5,
        overUnder: 46,
        homeProjectedScore: 30,
        awayProjectedScore: 20,
        difficulty: {
          home: 'easy',
          away: 'tough'
        }
      }
    ];
    
    return games;
  }
  
  // Calculate matchup difficulty based on opponent strength
  calculateMatchupDifficulty(
    teamRecord: { wins: number; losses: number },
    opponentRecord: { wins: number; losses: number },
    isHome: boolean,
    spread?: number
  ): 'easy' | 'moderate' | 'tough' | 'very-tough' {
    const teamWinPct = teamRecord.wins / (teamRecord.wins + teamRecord.losses);
    const oppWinPct = opponentRecord.wins / (opponentRecord.wins + opponentRecord.losses);
    
    // Factor in home field advantage
    const adjustedTeamWinPct = isHome ? teamWinPct + 0.05 : teamWinPct;
    
    // Use spread if available
    if (spread !== undefined) {
      const favoredBy = isHome ? -spread : spread;
      if (favoredBy >= 7) return 'easy';
      if (favoredBy >= 3) return 'moderate';
      if (favoredBy >= -3) return 'tough';
      return 'very-tough';
    }
    
    // Otherwise use win percentages
    const differential = adjustedTeamWinPct - oppWinPct;
    if (differential >= 0.3) return 'easy';
    if (differential >= 0.1) return 'moderate';
    if (differential >= -0.1) return 'tough';
    return 'very-tough';
  }
  
  // Get injury news specifically
  async getInjuryNews(): Promise<NewsArticle[]> {
    const allNews = await this.getFantasyNews(20);
    return allNews.filter(article => article.category === 'injury');
  }
  
  // Get trade news
  async getTradeNews(): Promise<NewsArticle[]> {
    const allNews = await this.getFantasyNews(20);
    return allNews.filter(article => article.category === 'trade');
  }
  
  // Parse RSS feeds (would be used in production)
  async parseRSSFeed(feedUrl: string): Promise<NewsArticle[]> {
    // In production, use a library like rss-parser
    // const parser = new RSSParser();
    // const feed = await parser.parseURL(feedUrl);
    // return feed.items.map(item => ({ ... }));
    return [];
  }
  
  // Aggregate news from multiple sources
  async aggregateNews(): Promise<NewsArticle[]> {
    // In production, fetch from multiple sources in parallel
    const sources = [
      'https://www.espn.com/espn/rss/nfl/news',
      'https://www.rotoballer.com/feed',
      'https://www.fantasypros.com/nfl/rss/news.php',
      // Add more RSS feeds
    ];
    
    // const newsPromises = sources.map(url => this.parseRSSFeed(url));
    // const allNews = await Promise.all(newsPromises);
    // return allNews.flat().sort((a, b) => b.publishedAt - a.publishedAt);
    
    return this.getFantasyNews();
  }
}

export const newsService = new NewsService();