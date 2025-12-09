-- Celo Games Portal Database Schema
-- Phase 2: Database & Leaderboards

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===================================
-- TABLE: users
-- ===================================
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  fid BIGINT UNIQUE,
  username TEXT,
  wallet_address TEXT,
  total_points INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_users_fid ON users(fid);
CREATE INDEX idx_users_wallet ON users(wallet_address);
CREATE INDEX idx_users_points ON users(total_points DESC);

-- ===================================
-- TABLE: games
-- ===================================
CREATE TABLE games (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  contract_address TEXT,
  icon TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert game data
INSERT INTO games (id, name, description, contract_address, icon) VALUES
  ('blackjack', 'Blackjack', 'Beat the dealer to 21!', '0x6cb9971850767026feBCb4801c0b8a946F28C9Ec', '/icons/blackjack.png'),
  ('rps', 'Rock Paper Scissors', 'Classic hand game!', '0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49', '/icons/rps.png'),
  ('tictactoe', 'Tic-Tac-Toe', 'Get three in a row!', '0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881', '/icons/tictactoe.png'),
  ('jackpot', 'Solo Jackpot', 'Spin the crypto wheel!', '0x07Bc49E8A2BaF7c68519F9a61FCD733490061644', '/icons/jackpot.png'),
  ('2048', '2048', 'Merge tiles to 2048!', '0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1', '/icons/2048.png'),
  ('mastermind', 'Crypto Mastermind', 'Crack the crypto code!', '0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9', '/icons/mastermind.png');

-- ===================================
-- TABLE: game_sessions
-- ===================================
CREATE TABLE game_sessions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  game_id TEXT NOT NULL REFERENCES games(id) ON DELETE CASCADE,
  mode TEXT NOT NULL CHECK (mode IN ('free', 'onchain')),
  result TEXT NOT NULL CHECK (result IN ('win', 'lose', 'draw', 'push')),
  points_earned INTEGER NOT NULL DEFAULT 0,
  tx_hash TEXT,
  played_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_sessions_user ON game_sessions(user_id);
CREATE INDEX idx_sessions_game ON game_sessions(game_id);
CREATE INDEX idx_sessions_played_at ON game_sessions(played_at DESC);
CREATE INDEX idx_sessions_user_game ON game_sessions(user_id, game_id);

-- ===================================
-- TABLE: badges
-- ===================================
CREATE TABLE badges (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('progression', 'performance', 'exploration', 'onchain', 'social')),
  requirement JSONB NOT NULL,
  points INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert badge definitions
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
  -- Progression badges
  ('rookie', 'Rookie', 'Play your first game', '🎮', 'progression', '{"games_played": 1}', 10),
  ('regular', 'Regular', 'Play 10 games', '🎯', 'progression', '{"games_played": 10}', 50),
  ('veteran', 'Veteran', 'Play 100 games', '⭐', 'progression', '{"games_played": 100}', 200),
  ('legend', 'Legend', 'Play 1000 games', '👑', 'progression', '{"games_played": 1000}', 1000),

  -- Performance badges
  ('first_blood', 'First Blood', 'Win your first game', '🏆', 'performance', '{"wins": 1}', 25),
  ('winning_streak', 'Winning Streak', 'Win 5 games in a row', '🔥', 'performance', '{"win_streak": 5}', 100),
  ('unstoppable', 'Unstoppable', 'Win 10 games in a row', '💪', 'performance', '{"win_streak": 10}', 250),
  ('champion', 'Champion', 'Reach top 10 on leaderboard', '🥇', 'performance', '{"leaderboard_rank": 10}', 500),

  -- Exploration badges
  ('explorer', 'Explorer', 'Try all 6 games', '🗺️', 'exploration', '{"unique_games": 6}', 100),
  ('all_rounder', 'All-Rounder', 'Win on each game', '🌟', 'exploration', '{"games_won_all": 6}', 300),
  ('og_player', 'OG Player', 'Play original 4 games', '🎲', 'exploration', '{"games_played_og": 4}', 50),
  ('new_blood', 'New Blood', 'Try 2048 and Mastermind', '✨', 'exploration', '{"games_played_new": 2}', 50),

  -- On-chain badges
  ('web3_native', 'Web3 Native', 'Play your first on-chain game', '⛓️', 'onchain', '{"onchain_games": 1}', 50),
  ('high_roller', 'High Roller', 'Wager 10 CELO cumulative', '💎', 'onchain', '{"celo_wagered": 10}', 200);

-- ===================================
-- TABLE: user_badges
-- ===================================
CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL REFERENCES badges(id) ON DELETE CASCADE,
  earned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE INDEX idx_user_badges_user ON user_badges(user_id);
CREATE INDEX idx_user_badges_earned ON user_badges(earned_at DESC);

-- ===================================
-- MATERIALIZED VIEW: leaderboard
-- ===================================
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  u.id as user_id,
  u.username,
  u.fid,
  u.total_points,
  COUNT(gs.id) as games_played,
  COUNT(CASE WHEN gs.result = 'win' THEN 1 END) as wins,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) as rank
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.username, u.fid, u.total_points, u.created_at
ORDER BY u.total_points DESC;

CREATE UNIQUE INDEX idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

-- ===================================
-- FUNCTION: get_game_leaderboard
-- ===================================
CREATE OR REPLACE FUNCTION get_game_leaderboard(p_game_id TEXT, p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  fid BIGINT,
  game_points BIGINT,
  games_played BIGINT,
  wins BIGINT,
  rank BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    u.id as user_id,
    u.username,
    u.fid,
    SUM(gs.points_earned) as game_points,
    COUNT(gs.id) as games_played,
    COUNT(CASE WHEN gs.result = 'win' THEN 1 END) as wins,
    ROW_NUMBER() OVER (ORDER BY SUM(gs.points_earned) DESC) as rank
  FROM users u
  INNER JOIN game_sessions gs ON u.id = gs.user_id
  WHERE gs.game_id = p_game_id
  GROUP BY u.id, u.username, u.fid
  ORDER BY game_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- FUNCTION: refresh_leaderboard
-- ===================================
CREATE OR REPLACE FUNCTION refresh_leaderboard()
RETURNS TRIGGER AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TRIGGER: refresh_leaderboard_on_session
-- ===================================
CREATE TRIGGER trigger_refresh_leaderboard
AFTER INSERT OR UPDATE OR DELETE ON game_sessions
FOR EACH STATEMENT
EXECUTE FUNCTION refresh_leaderboard();

-- ===================================
-- FUNCTION: update_user_timestamp
-- ===================================
CREATE OR REPLACE FUNCTION update_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ===================================
-- TRIGGER: update_users_updated_at
-- ===================================
CREATE TRIGGER trigger_update_users_timestamp
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_user_timestamp();

-- ===================================
-- ROW LEVEL SECURITY
-- ===================================

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;

-- Users: Anyone can read, users can update their own
CREATE POLICY "Users are viewable by everyone" ON users FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users FOR UPDATE USING (true);
CREATE POLICY "Users can insert their own profile" ON users FOR INSERT WITH CHECK (true);

-- Game sessions: Anyone can read, authenticated users can insert their own
CREATE POLICY "Game sessions are viewable by everyone" ON game_sessions FOR SELECT USING (true);
CREATE POLICY "Users can insert their own game sessions" ON game_sessions FOR INSERT WITH CHECK (true);

-- User badges: Anyone can read
CREATE POLICY "User badges are viewable by everyone" ON user_badges FOR SELECT USING (true);
CREATE POLICY "System can insert badges" ON user_badges FOR INSERT WITH CHECK (true);

-- Games and badges tables are public read-only
ALTER TABLE games ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Games are viewable by everyone" ON games FOR SELECT USING (true);
CREATE POLICY "Badges are viewable by everyone" ON badges FOR SELECT USING (true);

-- ===================================
-- INITIAL DATA SUMMARY
-- ===================================
-- This migration creates:
-- - 5 tables: users, games, game_sessions, badges, user_badges
-- - 6 games inserted
-- - 14 badges inserted
-- - 1 materialized view: leaderboard
-- - 2 functions: get_game_leaderboard, refresh_leaderboard
-- - Triggers for auto-refresh and timestamp updates
-- - RLS policies for security
