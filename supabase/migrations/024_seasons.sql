-- Migration: Seasons System
-- Purpose: 30-day competitive seasons with per-season leaderboard
-- Phase Z6.3

-- ========================================
-- STEP 1: seasons table
-- ========================================
CREATE TABLE IF NOT EXISTS seasons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  number INTEGER NOT NULL UNIQUE,        -- Season 1, 2, 3...
  name TEXT NOT NULL,                    -- "Season 1", "Season 2"...
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
  ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_seasons_active ON seasons(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_seasons_dates ON seasons(starts_at, ends_at);

-- ========================================
-- STEP 2: season_scores table
-- Accumulates points per user per season (updated via trigger)
-- ========================================
CREATE TABLE IF NOT EXISTS season_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  season_id UUID NOT NULL REFERENCES seasons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL DEFAULT 0,
  games_played INTEGER NOT NULL DEFAULT 0,
  wins INTEGER NOT NULL DEFAULT 0,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (season_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_season_scores_season ON season_scores(season_id, points DESC);
CREATE INDEX IF NOT EXISTS idx_season_scores_user ON season_scores(user_id);

-- ========================================
-- STEP 3: RLS policies
-- ========================================
ALTER TABLE seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE season_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read seasons" ON seasons FOR SELECT USING (true);
CREATE POLICY "Anyone can read season_scores" ON season_scores FOR SELECT USING (true);

-- ========================================
-- STEP 4: Seed Season 1 (starts 2026-03-13, 30 days)
-- ========================================
INSERT INTO seasons (number, name, starts_at, ends_at, is_active)
VALUES (
  1,
  'Season 1',
  '2026-03-13 00:00:00+00',
  '2026-04-12 23:59:59+00',
  TRUE
) ON CONFLICT (number) DO NOTHING;

-- ========================================
-- STEP 5: get_current_season function
-- ========================================
CREATE OR REPLACE FUNCTION get_current_season()
RETURNS TABLE (
  season_id UUID,
  number INTEGER,
  name TEXT,
  starts_at TIMESTAMP WITH TIME ZONE,
  ends_at TIMESTAMP WITH TIME ZONE,
  days_remaining INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    s.id,
    s.number,
    s.name,
    s.starts_at,
    s.ends_at,
    GREATEST(0, EXTRACT(DAY FROM (s.ends_at - NOW()))::INTEGER) AS days_remaining
  FROM seasons s
  WHERE s.is_active = TRUE
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 6: get_season_leaderboard function
-- ========================================
CREATE OR REPLACE FUNCTION get_season_leaderboard(p_season_id UUID, p_limit INTEGER DEFAULT 50)
RETURNS TABLE (
  rank BIGINT,
  user_id UUID,
  username TEXT,
  display_name TEXT,
  avatar_type TEXT,
  avatar_url TEXT,
  points INTEGER,
  games_played INTEGER,
  wins INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    ROW_NUMBER() OVER (ORDER BY ss.points DESC, ss.updated_at ASC) AS rank,
    u.id AS user_id,
    u.username,
    u.display_name,
    u.avatar_type,
    u.avatar_url,
    ss.points,
    ss.games_played,
    ss.wins
  FROM season_scores ss
  JOIN users u ON u.id = ss.user_id
  WHERE ss.season_id = p_season_id
  ORDER BY ss.points DESC, ss.updated_at ASC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ========================================
-- STEP 7: record_season_score function
-- Called after each game session to update season score
-- ========================================
CREATE OR REPLACE FUNCTION record_season_score(
  p_user_id UUID,
  p_points INTEGER,
  p_won BOOLEAN
)
RETURNS VOID AS $$
DECLARE
  v_season_id UUID;
BEGIN
  SELECT id INTO v_season_id FROM seasons WHERE is_active = TRUE LIMIT 1;
  IF v_season_id IS NULL THEN RETURN; END IF;

  INSERT INTO season_scores (season_id, user_id, points, games_played, wins, updated_at)
  VALUES (v_season_id, p_user_id, GREATEST(0, p_points), 1, CASE WHEN p_won THEN 1 ELSE 0 END, NOW())
  ON CONFLICT (season_id, user_id) DO UPDATE
    SET points = season_scores.points + GREATEST(0, p_points),
        games_played = season_scores.games_played + 1,
        wins = season_scores.wins + CASE WHEN p_won THEN 1 ELSE 0 END,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
