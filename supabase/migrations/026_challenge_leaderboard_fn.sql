-- Migration: Challenge leaderboard SQL aggregation
-- Replaces JS-side aggregation of 500 rows with a proper SQL GROUP BY

CREATE OR REPLACE FUNCTION get_challenge_leaderboard(p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_type TEXT,
  avatar_url TEXT,
  completed BIGINT
)
LANGUAGE sql
STABLE
AS $$
  SELECT
    udp.user_id,
    u.username,
    u.display_name,
    u.avatar_type,
    u.avatar_url,
    COUNT(*) AS completed
  FROM user_daily_progress udp
  JOIN users u ON u.id = udp.user_id
  WHERE udp.completed = true
  GROUP BY udp.user_id, u.username, u.display_name, u.avatar_type, u.avatar_url
  ORDER BY completed DESC
  LIMIT p_limit;
$$;
