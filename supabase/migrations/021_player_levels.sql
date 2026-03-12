-- Migration: Player Levels (XP System)
-- Purpose: Add XP tracking to users table + xp_log table for history
-- Phase Z6.1

-- ========================================
-- STEP 1: Add xp column to users table
-- ========================================
ALTER TABLE users ADD COLUMN IF NOT EXISTS xp INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_users_xp ON users(xp DESC);

-- ========================================
-- STEP 2: Create xp_log table
-- ========================================
CREATE TABLE IF NOT EXISTS xp_log (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  reason TEXT NOT NULL, -- 'game_win' | 'daily_challenge' | 'login_streak' | 'onboarding'
  game_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_xp_log_user ON xp_log(user_id);
CREATE INDEX IF NOT EXISTS idx_xp_log_created ON xp_log(created_at DESC);

-- ========================================
-- STEP 3: increment_user_xp function
-- ========================================
CREATE OR REPLACE FUNCTION increment_user_xp(p_user_id UUID, p_amount INTEGER)
RETURNS INTEGER AS $$
DECLARE
  v_new_xp INTEGER;
BEGIN
  UPDATE users SET xp = xp + p_amount WHERE id = p_user_id
  RETURNING xp INTO v_new_xp;
  RETURN v_new_xp;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 4: RLS policies
-- ========================================
ALTER TABLE xp_log ENABLE ROW LEVEL SECURITY;

-- Users can read their own XP log
CREATE POLICY "Users can view own xp_log"
  ON xp_log FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    )
  );

-- Only server (service role) can insert XP log entries
-- (INSERT via API routes using service role key)

-- ========================================
-- STEP 5: Refresh materialized leaderboard view to include xp
-- ========================================
-- Drop and recreate the leaderboard materialized view with xp column
DROP MATERIALIZED VIEW IF EXISTS leaderboard;
CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  u.id as user_id,
  u.username,
  u.display_name,
  u.fid,
  u.avatar_type,
  u.avatar_url,
  u.theme_color,
  u.total_points,
  u.xp,
  COUNT(gs.id) as games_played,
  COUNT(CASE WHEN gs.result = 'win' THEN 1 END) as wins,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) as rank
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.username, u.display_name, u.fid, u.avatar_type, u.avatar_url, u.theme_color, u.total_points, u.xp, u.created_at
ORDER BY u.total_points DESC;

CREATE UNIQUE INDEX idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);
