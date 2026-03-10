-- Migration 018: Streak & Summary Statistics
-- Adds RPC functions for win streaks and overall stats summary

-- Function to get current and best win streak per game for a user
CREATE OR REPLACE FUNCTION get_user_streaks(p_user_id UUID)
RETURNS TABLE (
  game_id UUID,
  game_name TEXT,
  game_icon TEXT,
  current_streak INTEGER,
  best_streak INTEGER
) AS $$
BEGIN
  RETURN QUERY
  WITH ordered_sessions AS (
    SELECT
      g.id as gid,
      g.name as gname,
      g.icon as gicon,
      gs.result,
      gs.played_at,
      ROW_NUMBER() OVER (PARTITION BY g.id ORDER BY gs.played_at DESC) as rn
    FROM game_sessions gs
    JOIN games g ON gs.game_id = g.id
    WHERE gs.user_id = p_user_id
      AND gs.result IN ('win', 'lose')
  ),
  -- Current streak: consecutive wins from latest session backwards
  streak_groups AS (
    SELECT
      gid, gname, gicon, result, played_at,
      rn,
      -- Group consecutive same results by detecting changes
      SUM(CASE WHEN result != LAG(result, 1, result) OVER (PARTITION BY gid ORDER BY played_at DESC) THEN 1 ELSE 0 END)
        OVER (PARTITION BY gid ORDER BY played_at DESC ROWS UNBOUNDED PRECEDING) as grp
    FROM ordered_sessions
  ),
  current_streaks AS (
    SELECT
      gid, gname, gicon,
      CASE WHEN result = 'win' AND rn = 1 THEN COUNT(*) ELSE 0 END as cur_streak
    FROM streak_groups
    WHERE grp = 0
    GROUP BY gid, gname, gicon, result, rn
  ),
  -- Best streak: longest consecutive wins ever
  all_sessions AS (
    SELECT
      g.id as gid,
      gs.result,
      gs.played_at,
      ROW_NUMBER() OVER (PARTITION BY g.id ORDER BY gs.played_at) as seq
    FROM game_sessions gs
    JOIN games g ON gs.game_id = g.id
    WHERE gs.user_id = p_user_id
      AND gs.result IN ('win', 'lose')
  ),
  win_sessions AS (
    SELECT
      gid, played_at, seq,
      seq - ROW_NUMBER() OVER (PARTITION BY gid ORDER BY seq) as island
    FROM all_sessions
    WHERE result = 'win'
  ),
  best_streaks AS (
    SELECT gid, MAX(cnt) as best_streak
    FROM (
      SELECT gid, island, COUNT(*) as cnt
      FROM win_sessions
      GROUP BY gid, island
    ) t
    GROUP BY gid
  )
  SELECT
    gs.gid as game_id,
    gs.gname as game_name,
    gs.gicon as game_icon,
    COALESCE(cs.cur_streak, 0)::INTEGER as current_streak,
    COALESCE(bs.best_streak, 0)::INTEGER as best_streak
  FROM (SELECT DISTINCT gid, gname, gicon FROM ordered_sessions) gs
  LEFT JOIN (
    SELECT gid, COALESCE(MAX(cur_streak), 0) as cur_streak
    FROM current_streaks
    GROUP BY gid
  ) cs ON cs.gid = gs.gid
  LEFT JOIN best_streaks bs ON bs.gid = gs.gid
  ORDER BY best_streak DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get overall stats summary for a user
CREATE OR REPLACE FUNCTION get_user_stats_summary(p_user_id UUID)
RETURNS TABLE (
  total_games BIGINT,
  total_wins BIGINT,
  total_losses BIGINT,
  overall_win_rate NUMERIC,
  total_points BIGINT,
  days_active BIGINT,
  favorite_game_name TEXT,
  favorite_game_icon TEXT,
  best_streak INTEGER,
  badges_earned BIGINT
) AS $$
BEGIN
  RETURN QUERY
  WITH session_stats AS (
    SELECT
      COUNT(*) as total_games,
      COUNT(*) FILTER (WHERE gs.result = 'win') as total_wins,
      COUNT(*) FILTER (WHERE gs.result = 'lose') as total_losses,
      COALESCE(SUM(gs.points_earned), 0)::BIGINT as total_points,
      COUNT(DISTINCT DATE(gs.played_at)) as days_active
    FROM game_sessions gs
    WHERE gs.user_id = p_user_id
  ),
  favorite AS (
    SELECT g.name as game_name, g.icon as game_icon
    FROM game_sessions gs
    JOIN games g ON gs.game_id = g.id
    WHERE gs.user_id = p_user_id
    GROUP BY g.id, g.name, g.icon
    ORDER BY COUNT(*) DESC
    LIMIT 1
  ),
  win_islands AS (
    SELECT
      gs.result,
      ROW_NUMBER() OVER (ORDER BY gs.played_at) as seq
    FROM game_sessions gs
    WHERE gs.user_id = p_user_id AND gs.result IN ('win', 'lose')
  ),
  win_groups AS (
    SELECT
      seq - ROW_NUMBER() OVER (ORDER BY seq) as island
    FROM win_islands
    WHERE result = 'win'
  ),
  best AS (
    SELECT COALESCE(MAX(cnt), 0)::INTEGER as best_streak
    FROM (
      SELECT COUNT(*) as cnt FROM win_groups GROUP BY island
    ) t
  ),
  badge_count AS (
    SELECT COUNT(*) as badges_earned
    FROM user_badges
    WHERE user_id = p_user_id
  )
  SELECT
    ss.total_games,
    ss.total_wins,
    ss.total_losses,
    ROUND(
      (ss.total_wins::NUMERIC / NULLIF(ss.total_games::NUMERIC, 0)) * 100,
      1
    ) as overall_win_rate,
    ss.total_points,
    ss.days_active,
    f.game_name as favorite_game_name,
    f.game_icon as favorite_game_icon,
    b.best_streak,
    bc.badges_earned
  FROM session_stats ss
  CROSS JOIN best b
  CROSS JOIN badge_count bc
  LEFT JOIN favorite f ON true;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_user_streaks IS 'Get current and best win streak per game';
COMMENT ON FUNCTION get_user_stats_summary IS 'Get overall statistics summary for a user';
