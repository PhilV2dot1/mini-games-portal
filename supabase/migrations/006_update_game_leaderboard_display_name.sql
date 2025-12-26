-- ============================================================================
-- Migration: Update get_game_leaderboard to include display_name
-- Description: Add display_name field to the game leaderboard function
-- Created: 2025-12-26
-- ============================================================================

-- Drop and recreate the function with display_name
DROP FUNCTION IF EXISTS get_game_leaderboard(TEXT, INTEGER);

CREATE OR REPLACE FUNCTION get_game_leaderboard(p_game_id TEXT, p_limit INTEGER DEFAULT 100)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  fid BIGINT,
  avatar_type TEXT,
  avatar_url TEXT,
  theme_color TEXT,
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
    u.display_name,
    u.fid,
    u.avatar_type,
    u.avatar_url,
    u.theme_color,
    SUM(gs.points_earned) as game_points,
    COUNT(gs.id) as games_played,
    COUNT(CASE WHEN gs.result = 'win' THEN 1 END) as wins,
    ROW_NUMBER() OVER (ORDER BY SUM(gs.points_earned) DESC) as rank
  FROM users u
  INNER JOIN game_sessions gs ON u.id = gs.user_id
  WHERE gs.game_id = p_game_id
  GROUP BY u.id, u.username, u.display_name, u.fid, u.avatar_type, u.avatar_url, u.theme_color
  ORDER BY game_points DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- Migration Complete
-- ============================================================================
