-- Migration: Weekly Missions System
-- Purpose: 5 missions renewed every Monday, +100 XP each
-- Phase Z6.2

-- ========================================
-- STEP 1: weekly_missions table
-- ========================================
CREATE TABLE IF NOT EXISTS weekly_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  week_start DATE NOT NULL,        -- Monday of the week (UTC)
  mission_index INTEGER NOT NULL CHECK (mission_index BETWEEN 0 AND 4),
  type TEXT NOT NULL,              -- 'games_played' | 'wins' | 'points' | 'unique_games' | 'daily_challenges'
  game_id TEXT,                    -- NULL = any game
  target INTEGER NOT NULL,
  xp_reward INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (week_start, mission_index)
);

CREATE INDEX IF NOT EXISTS idx_weekly_missions_week ON weekly_missions(week_start DESC);

-- ========================================
-- STEP 2: user_weekly_progress table
-- ========================================
CREATE TABLE IF NOT EXISTS user_weekly_progress (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID NOT NULL REFERENCES weekly_missions(id) ON DELETE CASCADE,
  progress INTEGER NOT NULL DEFAULT 0,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  rewarded BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (user_id, mission_id)
);

CREATE INDEX IF NOT EXISTS idx_uwp_user ON user_weekly_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_uwp_mission ON user_weekly_progress(mission_id);

-- ========================================
-- STEP 3: RLS policies
-- ========================================
ALTER TABLE weekly_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_weekly_progress ENABLE ROW LEVEL SECURITY;

-- Anyone can read missions
CREATE POLICY "Anyone can read weekly_missions"
  ON weekly_missions FOR SELECT USING (true);

-- Users can read their own progress
CREATE POLICY "Users can view own weekly progress"
  ON user_weekly_progress FOR SELECT
  USING (
    user_id IN (
      SELECT id FROM users WHERE auth_user_id = auth.uid()::text
    )
  );

-- ========================================
-- STEP 4: get_or_create_weekly_missions function
-- Returns this week's 5 missions + user progress (if p_user_id provided)
-- ========================================
CREATE OR REPLACE FUNCTION get_or_create_weekly_missions(p_user_id UUID DEFAULT NULL)
RETURNS TABLE (
  mission_id UUID,
  mission_index INTEGER,
  type TEXT,
  game_id TEXT,
  target INTEGER,
  xp_reward INTEGER,
  week_start DATE,
  progress INTEGER,
  completed BOOLEAN,
  rewarded BOOLEAN
) AS $$
DECLARE
  v_week_start DATE;
  v_count INTEGER;
BEGIN
  -- Get Monday of current week (UTC)
  v_week_start := DATE_TRUNC('week', NOW() AT TIME ZONE 'UTC')::DATE;

  -- Check if missions exist for this week
  SELECT COUNT(*) INTO v_count FROM weekly_missions WHERE week_start = v_week_start;

  -- Generate missions if not yet created
  IF v_count < 5 THEN
    DELETE FROM weekly_missions WHERE week_start = v_week_start;
    INSERT INTO weekly_missions (week_start, mission_index, type, game_id, target, xp_reward) VALUES
      (v_week_start, 0, 'games_played',     NULL,         10,  100),
      (v_week_start, 1, 'wins',             NULL,          5,  100),
      (v_week_start, 2, 'points',           NULL,        500,  100),
      (v_week_start, 3, 'unique_games',     NULL,          3,  100),
      (v_week_start, 4, 'daily_challenges', NULL,          3,  100);
  END IF;

  -- Return missions + progress
  RETURN QUERY
  SELECT
    wm.id AS mission_id,
    wm.mission_index,
    wm.type,
    wm.game_id,
    wm.target,
    wm.xp_reward,
    wm.week_start,
    COALESCE(uwp.progress, 0)::INTEGER AS progress,
    COALESCE(uwp.completed, FALSE) AS completed,
    COALESCE(uwp.rewarded, FALSE) AS rewarded
  FROM weekly_missions wm
  LEFT JOIN user_weekly_progress uwp
    ON uwp.mission_id = wm.id AND (p_user_id IS NULL OR uwp.user_id = p_user_id)
  WHERE wm.week_start = v_week_start
  ORDER BY wm.mission_index;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 5: update_weekly_mission_progress function
-- ========================================
CREATE OR REPLACE FUNCTION update_weekly_mission_progress(
  p_user_id UUID,
  p_mission_id UUID,
  p_new_progress INTEGER
)
RETURNS TABLE (newly_completed BOOLEAN, xp_reward INTEGER) AS $$
DECLARE
  v_target INTEGER;
  v_xp_reward INTEGER;
  v_was_rewarded BOOLEAN;
  v_completed BOOLEAN;
BEGIN
  SELECT target, xp_reward INTO v_target, v_xp_reward
  FROM weekly_missions WHERE id = p_mission_id;

  v_completed := p_new_progress >= v_target;

  INSERT INTO user_weekly_progress (user_id, mission_id, progress, completed, updated_at)
  VALUES (p_user_id, p_mission_id, LEAST(p_new_progress, v_target), v_completed, NOW())
  ON CONFLICT (user_id, mission_id) DO UPDATE
    SET progress = LEAST(p_new_progress, v_target),
        completed = v_completed,
        updated_at = NOW()
  RETURNING rewarded INTO v_was_rewarded;

  -- Award XP + mark rewarded if newly completed
  IF v_completed AND NOT COALESCE(v_was_rewarded, FALSE) THEN
    UPDATE user_weekly_progress
      SET rewarded = TRUE
      WHERE user_id = p_user_id AND mission_id = p_mission_id;

    UPDATE users SET xp = xp + v_xp_reward WHERE id = p_user_id;

    INSERT INTO xp_log (user_id, amount, reason)
    VALUES (p_user_id, v_xp_reward, 'weekly_mission');

    RETURN QUERY SELECT TRUE, v_xp_reward;
  ELSE
    RETURN QUERY SELECT FALSE, 0;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
