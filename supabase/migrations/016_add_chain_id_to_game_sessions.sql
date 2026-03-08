-- Migration 016: Add chain_id to game_sessions for multi-chain leaderboard support
-- Chains: 42220 (Celo), 8453 (Base), 4326 (MegaETH), 1868 (Soneium)

ALTER TABLE game_sessions
  ADD COLUMN IF NOT EXISTS chain_id INTEGER DEFAULT 42220;

-- Index for chain-filtered leaderboard queries
CREATE INDEX IF NOT EXISTS idx_game_sessions_chain_id ON game_sessions(chain_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_user_chain ON game_sessions(user_id, chain_id);
CREATE INDEX IF NOT EXISTS idx_game_sessions_game_chain ON game_sessions(game_id, chain_id);

-- Update the get_game_leaderboard function to support chain filtering
CREATE OR REPLACE FUNCTION get_game_leaderboard(
  p_game_id TEXT,
  p_limit INTEGER DEFAULT 100,
  p_chain_id INTEGER DEFAULT NULL
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  fid INTEGER,
  avatar_type TEXT,
  avatar_url TEXT,
  theme_color TEXT,
  game_points BIGINT,
  games_played BIGINT,
  wins BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(gs.points_earned) DESC) AS rank,
    u.id AS user_id,
    u.username,
    u.display_name,
    u.fid,
    u.avatar_type::TEXT,
    u.avatar_url,
    u.theme_color::TEXT,
    SUM(gs.points_earned) AS game_points,
    COUNT(*)::BIGINT AS games_played,
    COUNT(*) FILTER (WHERE gs.result = 'win')::BIGINT AS wins
  FROM game_sessions gs
  JOIN users u ON gs.user_id = u.id
  WHERE gs.game_id = p_game_id
    AND (p_chain_id IS NULL OR gs.chain_id = p_chain_id)
  GROUP BY u.id, u.username, u.display_name, u.fid, u.avatar_type, u.avatar_url, u.theme_color
  ORDER BY game_points DESC
  LIMIT p_limit;
END;
$$;

-- Create a chain-filtered global leaderboard function
CREATE OR REPLACE FUNCTION get_global_leaderboard_by_chain(
  p_chain_id INTEGER DEFAULT NULL,
  p_limit INTEGER DEFAULT 100,
  p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  fid INTEGER,
  avatar_type TEXT,
  avatar_url TEXT,
  theme_color TEXT,
  total_points BIGINT,
  games_played BIGINT,
  wins BIGINT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY SUM(gs.points_earned) DESC) AS rank,
    u.id AS user_id,
    u.username,
    u.display_name,
    u.fid,
    u.avatar_type::TEXT,
    u.avatar_url,
    u.theme_color::TEXT,
    SUM(gs.points_earned) AS total_points,
    COUNT(*)::BIGINT AS games_played,
    COUNT(*) FILTER (WHERE gs.result = 'win')::BIGINT AS wins
  FROM game_sessions gs
  JOIN users u ON gs.user_id = u.id
  WHERE p_chain_id IS NULL OR gs.chain_id = p_chain_id
  GROUP BY u.id, u.username, u.display_name, u.fid, u.avatar_type, u.avatar_url, u.theme_color
  ORDER BY total_points DESC
  LIMIT p_limit
  OFFSET p_offset;
END;
$$;
