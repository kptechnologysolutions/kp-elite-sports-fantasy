export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  teams?: Team[]; // Multiple teams support
  activeTeamId?: string; // Currently selected team
  preferences?: UserPreferences;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserPreferences {
  defaultView: 'single' | 'multi' | 'consolidated';
  notifications: boolean;
  theme: 'light' | 'dark' | 'auto';
  favoriteTeamId?: string;
}

export interface Team {
  id: string;
  userId: string;
  name: string;
  platform: 'ESPN' | 'Yahoo' | 'Sleeper' | 'NFL' | 'CBS' | 'DraftKings' | 'Custom';
  platformTeamId?: string;
  platformCredentials?: PlatformCredentials; // OAuth tokens for direct management
  leagueName?: string;
  leagueId?: string;
  leagueSize?: number;
  scoringType?: 'PPR' | 'Half-PPR' | 'Standard';
  record?: TeamRecord;
  rank?: number;
  players: Player[];
  liveScore?: LiveScore;
  color?: string; // Team color for UI theming
  logo?: string; // Team logo URL
  createdAt: Date;
  updatedAt: Date;
}

export interface PlatformCredentials {
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: Date;
  platformUserId?: string;
}

export interface TeamRecord {
  wins: number;
  losses: number;
  ties: number;
  pointsFor: number;
  pointsAgainst: number;
  streak?: string; // W3, L2, etc.
}

export interface LiveScore {
  teamScore: number;
  opponentScore: number;
  opponentName: string;
  week: number;
  isLive: boolean;
  timeRemaining?: string;
  projectedScore?: number;
  winProbability?: number;
}

export interface Player {
  id: string;
  name: string;
  position: 'QB' | 'RB' | 'WR' | 'TE' | 'K' | 'DEF';
  team: string;
  jerseyNumber?: number;
  avatar?: string;
  status: PlayerStatus;
  injuryStatus?: InjuryStatus;
  stats?: PlayerStats;
  news?: NewsItem[];
  aiInsights?: AIInsight[];
}

export interface PlayerStatus {
  isActive: boolean;
  gameStatus: 'playing' | 'questionable' | 'doubtful' | 'out' | 'ir';
  lastUpdated: Date;
}

export interface InjuryStatus {
  type: string;
  description: string;
  severity: 'minor' | 'moderate' | 'severe';
  estimatedReturn?: string;
  practiceStatus?: 'full' | 'limited' | 'dnp';
}

export interface PlayerStats {
  season: number;
  week: number;
  passingYards?: number;
  passingTDs?: number;
  rushingYards?: number;
  rushingTDs?: number;
  receivingYards?: number;
  receivingTDs?: number;
  receptions?: number;
  targets?: number;
  fantasyPoints: number;
  projectedPoints?: number;
}

export interface NewsItem {
  id: string;
  playerId: string;
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
  publishedAt: Date;
  sentiment: 'positive' | 'negative' | 'neutral';
  relevanceScore: number;
  tags: string[];
}

export interface AIInsight {
  id: string;
  playerId: string;
  type: 'performance' | 'injury' | 'trade' | 'matchup' | 'trend';
  title: string;
  content: string;
  confidence: number;
  generatedAt: Date;
  recommendations?: string[];
}

export interface LineupRecommendation {
  teamId: string;
  week: number;
  recommendations: {
    position: string;
    player: Player;
    reasoning: string;
    confidence: number;
  }[];
  benchSuggestions: {
    player: Player;
    reasoning: string;
  }[];
  generatedAt: Date;
}

export interface TradeAnalysis {
  id: string;
  teamId: string;
  givePlayers: Player[];
  receivePlayers: Player[];
  score: number;
  recommendation: 'accept' | 'decline' | 'counter';
  analysis: string;
  fairnessRating: number;
  generatedAt: Date;
}