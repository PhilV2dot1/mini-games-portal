-- ============================================================
-- Migration 020: Login Streaks
-- ============================================================
-- Tracks daily logins to reward consistent players.
-- Bonus points: day 1=10, day 3=30, day 7=100, day 14=200, day 30=500

CREATE TABLE IF NOT EXISTS login_streaks (
  user_id           UUID        PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  current_streak    INTEGER     NOT NULL DEFAULT 0,
  best_streak       INTEGER     NOT NULL DEFAULT 0,
  last_login_date   DATE,
  total_login_days  INTEGER     NOT NULL DEFAULT 0,
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── Function: record daily login and return streak + bonus ───
-- Returns: current_streak, best_streak, bonus_points, is_new_day
CREATE OR REPLACE FUNCTION record_daily_login(p_user_id UUID)
RETURNS TABLE(
  current_streak  INTEGER,
  best_streak     INTEGER,
  bonus_points    INTEGER,
  is_new_day      BOOLEAN
)
LANGUAGE plpgsql
AS $$
DECLARE
  today           DATE := CURRENT_DATE;
  v_row           login_streaks%ROWTYPE;
  v_new_streak    INTEGER;
  v_best_streak   INTEGER;
  v_bonus         INTEGER := 0;
  v_is_new_day    BOOLEAN := false;
BEGIN
  -- Get or create streak row
  SELECT * INTO v_row FROM login_streaks WHERE user_id = p_user_id;

  IF NOT FOUND THEN
    -- First ever login
    INSERT INTO login_streaks(user_id, current_streak, best_streak, last_login_date, total_login_days)
    VALUES (p_user_id, 1, 1, today, 1);

    v_bonus := 10; -- Day 1 bonus
    v_is_new_day := true;

    RETURN QUERY SELECT 1::INTEGER, 1::INTEGER, v_bonus, v_is_new_day;
    RETURN;
  END IF;

  -- Already logged in today → return current state, no bonus
  IF v_row.last_login_date = today THEN
    RETURN QUERY SELECT v_row.current_streak, v_row.best_streak, 0::INTEGER, false;
    RETURN;
  END IF;

  v_is_new_day := true;

  -- Consecutive day → extend streak
  IF v_row.last_login_date = today - INTERVAL '1 day' THEN
    v_new_streak := v_row.current_streak + 1;
  ELSE
    -- Streak broken → reset
    v_new_streak := 1;
  END IF;

  v_best_streak := GREATEST(v_new_streak, v_row.best_streak);

  -- Calculate bonus based on streak milestone
  v_bonus := CASE
    WHEN v_new_streak >= 30 THEN 500
    WHEN v_new_streak >= 14 THEN 200
    WHEN v_new_streak >= 7  THEN 100
    WHEN v_new_streak >= 3  THEN 30
    ELSE 10
  END;

  -- Update streak
  UPDATE login_streaks
  SET current_streak  = v_new_streak,
      best_streak     = v_best_streak,
      last_login_date = today,
      total_login_days = total_login_days + 1,
      updated_at      = now()
  WHERE user_id = p_user_id;

  -- Award bonus points to user
  UPDATE users
  SET total_points = total_points + v_bonus
  WHERE id = p_user_id;

  RETURN QUERY SELECT v_new_streak, v_best_streak, v_bonus, v_is_new_day;
END;
$$;
