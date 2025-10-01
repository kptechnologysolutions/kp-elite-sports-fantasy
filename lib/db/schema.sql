-- Supabase PostgreSQL Schema for Fantasy Football App

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sleeper_username VARCHAR(255) UNIQUE NOT NULL,
  sleeper_user_id VARCHAR(255) UNIQUE NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  avatar_url TEXT,
  settings JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leagues table
CREATE TABLE leagues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  sleeper_league_id VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  season VARCHAR(4) NOT NULL,
  status VARCHAR(50) NOT NULL,
  sport VARCHAR(50) DEFAULT 'nfl',
  settings JSONB DEFAULT '{}',
  scoring_settings JSONB DEFAULT '{}',
  roster_positions TEXT[] DEFAULT '{}',
  total_rosters INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rosters table (many-to-many between users and leagues)
CREATE TABLE rosters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  sleeper_roster_id INTEGER NOT NULL,
  players TEXT[] DEFAULT '{}',
  starters TEXT[] DEFAULT '{}',
  wins INTEGER DEFAULT 0,
  losses INTEGER DEFAULT 0,
  ties INTEGER DEFAULT 0,
  points_for DECIMAL(10, 2) DEFAULT 0,
  points_against DECIMAL(10, 2) DEFAULT 0,
  waiver_position INTEGER,
  waiver_budget_used INTEGER DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(sleeper_roster_id, league_id)
);

-- Players table (cached player data)
CREATE TABLE players (
  player_id VARCHAR(255) PRIMARY KEY,
  first_name VARCHAR(255) NOT NULL,
  last_name VARCHAR(255) NOT NULL,
  position VARCHAR(10) NOT NULL,
  team VARCHAR(10),
  status VARCHAR(50) DEFAULT 'Active',
  injury_status VARCHAR(50),
  injury_notes TEXT,
  fantasy_points_season DECIMAL(10, 2),
  projected_points_week DECIMAL(10, 2),
  stats JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Matchups table
CREATE TABLE matchups (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  matchup_id INTEGER NOT NULL,
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  points DECIMAL(10, 2) DEFAULT 0,
  starters_points DECIMAL(10, 2)[] DEFAULT '{}',
  players_points JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(league_id, week, roster_id)
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL, -- 'trade', 'waiver', 'free_agent'
  roster_ids INTEGER[] DEFAULT '{}',
  adds JSONB DEFAULT '{}', -- { player_id: roster_id }
  drops JSONB DEFAULT '{}', -- { player_id: roster_id }
  waiver_budget_amount INTEGER,
  status VARCHAR(50) DEFAULT 'complete',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lineup history table
CREATE TABLE lineup_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  week INTEGER NOT NULL,
  season VARCHAR(4) NOT NULL,
  starters TEXT[] DEFAULT '{}',
  bench TEXT[] DEFAULT '{}',
  points_scored DECIMAL(10, 2) DEFAULT 0,
  optimal_lineup TEXT[] DEFAULT '{}',
  optimal_points DECIMAL(10, 2) DEFAULT 0,
  efficiency_rating DECIMAL(5, 2), -- percentage of optimal points scored
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(roster_id, week, season)
);

-- Trade analysis table
CREATE TABLE trade_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  league_id UUID REFERENCES leagues(id) ON DELETE CASCADE,
  proposing_roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  receiving_roster_id UUID REFERENCES rosters(id) ON DELETE CASCADE,
  giving_players TEXT[] DEFAULT '{}',
  receiving_players TEXT[] DEFAULT '{}',
  value_difference DECIMAL(10, 2),
  ai_recommendation VARCHAR(50), -- 'accept', 'reject', 'counter'
  ai_reasoning TEXT,
  status VARCHAR(50) DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Player news/alerts table
CREATE TABLE player_alerts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player_id VARCHAR(255) REFERENCES players(player_id) ON DELETE CASCADE,
  alert_type VARCHAR(50) NOT NULL, -- 'injury', 'trade', 'performance', 'news'
  severity VARCHAR(20), -- 'high', 'medium', 'low'
  title VARCHAR(255) NOT NULL,
  description TEXT,
  source_url TEXT,
  impact_analysis TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User preferences table
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  notifications_enabled BOOLEAN DEFAULT true,
  lineup_optimizer_enabled BOOLEAN DEFAULT true,
  trade_analyzer_enabled BOOLEAN DEFAULT true,
  alert_types TEXT[] DEFAULT '{injury,trade,waiver}',
  theme VARCHAR(20) DEFAULT 'dark',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Create indexes for better query performance
CREATE INDEX idx_rosters_user_id ON rosters(user_id);
CREATE INDEX idx_rosters_league_id ON rosters(league_id);
CREATE INDEX idx_matchups_week ON matchups(week);
CREATE INDEX idx_transactions_league_id ON transactions(league_id);
CREATE INDEX idx_lineup_history_roster_week ON lineup_history(roster_id, week);
CREATE INDEX idx_player_alerts_player_id ON player_alerts(player_id);
CREATE INDEX idx_player_alerts_created ON player_alerts(created_at DESC);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at triggers to tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_leagues_updated_at BEFORE UPDATE ON leagues
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rosters_updated_at BEFORE UPDATE ON rosters
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_players_updated_at BEFORE UPDATE ON players
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) Policies
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leagues ENABLE ROW LEVEL SECURITY;
ALTER TABLE rosters ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own data
CREATE POLICY "Users can view own profile" ON users
    FOR SELECT USING (auth.uid()::text = id::text);

CREATE POLICY "Users can update own profile" ON users
    FOR UPDATE USING (auth.uid()::text = id::text);

-- Anyone can view leagues (public data)
CREATE POLICY "Leagues are viewable by everyone" ON leagues
    FOR SELECT USING (true);

-- Users can view rosters in their leagues
CREATE POLICY "Users can view rosters in their leagues" ON rosters
    FOR SELECT USING (
        user_id IN (
            SELECT user_id FROM rosters 
            WHERE league_id = rosters.league_id
        )
    );

-- Users can only modify their own preferences
CREATE POLICY "Users can manage own preferences" ON user_preferences
    FOR ALL USING (auth.uid()::text = user_id::text);