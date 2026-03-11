-- ============================================================
-- Migration 019: Daily Challenges
-- ============================================================
-- Tables: daily_challenges, user_daily_progress
-- Each day one challenge is "active" (selected by rotating through pool).
-- Progress is tracked per user per day.

-- ── daily_challenges (pool of challenge definitions) ────────
CREATE TABLE IF NOT EXISTS daily_challenges (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  game_id      TEXT        NOT NULL,  -- e.g. 'blackjack', 'snake', 'poker'
  description  TEXT        NOT NULL,  -- e.g. 'Win 3 Blackjack hands'
  description_fr TEXT      NOT NULL,
  target       INTEGER     NOT NULL,  -- e.g. 3
  metric       TEXT        NOT NULL,  -- 'wins' | 'games_played' | 'points'
  bonus_points INTEGER     NOT NULL DEFAULT 100,
  is_active    BOOLEAN     NOT NULL DEFAULT true,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── daily_schedule (one entry per calendar day) ──────────────
CREATE TABLE IF NOT EXISTS daily_challenge_schedule (
  challenge_date DATE        PRIMARY KEY,
  challenge_id   UUID        NOT NULL REFERENCES daily_challenges(id),
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── user_daily_progress (per-user per-day progress) ──────────
CREATE TABLE IF NOT EXISTS user_daily_progress (
  id             UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  challenge_date DATE        NOT NULL,
  challenge_id   UUID        NOT NULL REFERENCES daily_challenges(id),
  progress       INTEGER     NOT NULL DEFAULT 0,
  completed      BOOLEAN     NOT NULL DEFAULT false,
  completed_at   TIMESTAMPTZ,
  rewarded       BOOLEAN     NOT NULL DEFAULT false,
  created_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, challenge_date)
);

CREATE INDEX IF NOT EXISTS idx_user_daily_progress_user_date
  ON user_daily_progress(user_id, challenge_date);

-- ── Seed challenge pool ───────────────────────────────────────
INSERT INTO daily_challenges (game_id, description, description_fr, target, metric, bonus_points) VALUES
  ('blackjack',    'Win 3 Blackjack hands',         'Gagnez 3 mains de Blackjack',          3,  'wins',         150),
  ('blackjack',    'Play 5 Blackjack hands',         'Jouez 5 mains de Blackjack',           5,  'games_played', 100),
  ('snake',        'Score 500 points in Snake',      'Marquez 500 points à Snake',           500,'points',       200),
  ('snake',        'Play 3 games of Snake',          'Jouez 3 parties de Snake',             3,  'games_played', 100),
  ('rps',          'Win 5 Rock Paper Scissors',      'Gagnez 5 fois à Pierre Feuille Ciseaux', 5, 'wins',        150),
  ('tictactoe',    'Win 2 Tic-Tac-Toe games',        'Gagnez 2 parties de Morpion',          2,  'wins',         120),
  ('2048',         'Reach 1024 in 2048',             'Atteignez 1024 dans 2048',             1024,'points',      250),
  ('mastermind',   'Crack 2 Mastermind codes',       'Craquez 2 codes Mastermind',           2,  'wins',         180),
  ('memory',       'Win 3 Memory games',             'Gagnez 3 parties de Mémory',           3,  'wins',         150),
  ('tetris',       'Score 300 points in Tetris',     'Marquez 300 points à Tetris',          300,'points',       200),
  ('minesweeper',  'Clear 2 Minesweeper boards',     'Déminez 2 plateaux',                   2,  'wins',         200),
  ('poker',        'Win 3 Poker hands',              'Gagnez 3 mains de Poker',              3,  'wins',         180),
  ('connect-five', 'Win 2 Connect 5 games',          'Gagnez 2 parties de Connect 5',        2,  'wins',         150),
  ('maze',         'Complete 3 Mazes',               'Complétez 3 Labyrinthes',              3,  'wins',         130);

-- ── Function: get or create today's challenge ─────────────────
CREATE OR REPLACE FUNCTION get_or_create_daily_challenge()
RETURNS TABLE(
  challenge_id   UUID,
  game_id        TEXT,
  description    TEXT,
  description_fr TEXT,
  target         INTEGER,
  metric         TEXT,
  bonus_points   INTEGER,
  challenge_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
  today DATE := CURRENT_DATE;
  v_challenge_id UUID;
  v_count INTEGER;
BEGIN
  -- Check if today already has a scheduled challenge
  SELECT s.challenge_id INTO v_challenge_id
  FROM daily_challenge_schedule s
  WHERE s.challenge_date = today;

  IF v_challenge_id IS NULL THEN
    -- Pick a challenge by rotating through pool based on day-of-year
    SELECT dc.id INTO v_challenge_id
    FROM daily_challenges dc
    WHERE dc.is_active = true
    ORDER BY dc.id  -- deterministic order
    LIMIT 1
    OFFSET (EXTRACT(DOY FROM today)::INTEGER % (SELECT COUNT(*) FROM daily_challenges WHERE is_active = true));

    -- Schedule it
    INSERT INTO daily_challenge_schedule(challenge_date, challenge_id)
    VALUES (today, v_challenge_id)
    ON CONFLICT (challenge_date) DO NOTHING;
  END IF;

  -- Return challenge details
  RETURN QUERY
  SELECT
    dc.id,
    dc.game_id,
    dc.description,
    dc.description_fr,
    dc.target,
    dc.metric,
    dc.bonus_points,
    today
  FROM daily_challenges dc
  WHERE dc.id = v_challenge_id;
END;
$$;

-- ── Function: get user progress for today's challenge ─────────
CREATE OR REPLACE FUNCTION get_user_daily_progress(p_user_id UUID)
RETURNS TABLE(
  challenge_id   UUID,
  game_id        TEXT,
  description    TEXT,
  description_fr TEXT,
  target         INTEGER,
  metric         TEXT,
  bonus_points   INTEGER,
  progress       INTEGER,
  completed      BOOLEAN,
  rewarded       BOOLEAN,
  challenge_date DATE
)
LANGUAGE plpgsql
AS $$
DECLARE
  today DATE := CURRENT_DATE;
BEGIN
  -- Ensure today's challenge exists
  PERFORM get_or_create_daily_challenge();

  RETURN QUERY
  SELECT
    dc.id,
    dc.game_id,
    dc.description,
    dc.description_fr,
    dc.target,
    dc.metric,
    dc.bonus_points,
    COALESCE(udp.progress, 0)::INTEGER,
    COALESCE(udp.completed, false),
    COALESCE(udp.rewarded, false),
    today
  FROM daily_challenge_schedule s
  JOIN daily_challenges dc ON dc.id = s.challenge_id
  LEFT JOIN user_daily_progress udp
    ON udp.user_id = p_user_id
    AND udp.challenge_date = today
    AND udp.challenge_id = dc.id
  WHERE s.challenge_date = today;
END;
$$;
