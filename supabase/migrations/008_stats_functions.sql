-- Migration 008: Statistics Functions
-- Adds RPC functions for user statistics and charts

-- Function to get win rate by game for a user
CREATE OR REPLACE FUNCTION get_user_win_rate_by_game(p_user_id UUID)
RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  game_icon TEXT,
  total_games BIGINT,
  wins BIGINT,
  losses BIGINT,
  win_rate NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.id as game_id,
    g.name as game_name,
    g.icon as game_icon,
    COUNT(*) as total_games,
    COUNT(*) FILTER (WHERE gs.result = 'win') as wins,
    COUNT(*) FILTER (WHERE gs.result = 'lose') as losses,
    ROUND(
      (COUNT(*) FILTER (WHERE gs.result = 'win')::NUMERIC / NULLIF(COUNT(*)::NUMERIC, 0)) * 100,
      1
    ) as win_rate
  FROM game_sessions gs
  JOIN games g ON gs.game_id = g.id
  WHERE gs.user_id = p_user_id
  GROUP BY g.id, g.name, g.icon
  ORDER BY total_games DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get points progress over time (last 30 days)
CREATE OR REPLACE FUNCTION get_user_points_progress(p_user_id UUID, p_days INTEGER DEFAULT 30)
RETURNS TABLE (
  date DATE,
  daily_points INTEGER,
  cumulative_points INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH daily_stats AS (
    SELECT
      DATE(gs.played_at) as game_date,
      SUM(gs.points_earned) as points
    FROM game_sessions gs
    WHERE gs.user_id = p_user_id
      AND gs.played_at >= CURRENT_DATE - (p_days || ' days')::INTERVAL
    GROUP BY DATE(gs.played_at)
  )
  SELECT
    game_date::DATE as date,
    points::INTEGER as daily_points,
    SUM(points) OVER (ORDER BY game_date)::INTEGER as cumulative_points
  FROM daily_stats
  ORDER BY game_date;
END;
$$ LANGUAGE plpgsql;

-- Function to get user activity timeline
CREATE OR REPLACE FUNCTION get_user_activity_timeline(p_user_id UUID, p_limit INTEGER DEFAULT 20)
RETURNS TABLE (
  activity_type TEXT,
  activity_id TEXT,
  timestamp TIMESTAMPTZ,
  game_name TEXT,
  game_icon TEXT,
  result TEXT,
  points_earned INTEGER,
  badge_name TEXT,
  badge_icon TEXT
) AS $$
BEGIN
  RETURN QUERY
  (
    -- Game sessions
    SELECT
      'game'::TEXT as activity_type,
      gs.id::TEXT as activity_id,
      gs.played_at as timestamp,
      g.name as game_name,
      g.icon as game_icon,
      gs.result::TEXT,
      gs.points_earned,
      NULL::TEXT as badge_name,
      NULL::TEXT as badge_icon
    FROM game_sessions gs
    JOIN games g ON gs.game_id = g.id
    WHERE gs.user_id = p_user_id
  )
  UNION ALL
  (
    -- Badge earnings
    SELECT
      'badge'::TEXT as activity_type,
      ub.badge_id::TEXT as activity_id,
      ub.earned_at as timestamp,
      NULL::TEXT as game_name,
      NULL::TEXT as game_icon,
      NULL::TEXT as result,
      b.points as points_earned,
      b.name as badge_name,
      b.icon as badge_icon
    FROM user_badges ub
    JOIN badges b ON ub.badge_id = b.id
    WHERE ub.user_id = p_user_id
  )
  ORDER BY timestamp DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Add comments for documentation
COMMENT ON FUNCTION get_user_win_rate_by_game IS 'Get win rate statistics by game for charts';
COMMENT ON FUNCTION get_user_points_progress IS 'Get daily and cumulative points over time';
COMMENT ON FUNCTION get_user_activity_timeline IS 'Get combined timeline of games and badges';
