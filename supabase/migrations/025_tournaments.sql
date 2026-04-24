-- Migration: Tournament System
-- Purpose: Single-elimination tournaments with brackets, matches, and prize points

-- ========================================
-- STEP 1: tournaments table
-- ========================================
CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  game_id TEXT NOT NULL,
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'registration'
    CHECK (status IN ('registration', 'in_progress', 'completed', 'cancelled')),
  format TEXT NOT NULL DEFAULT 'single_elimination'
    CHECK (format IN ('single_elimination')),
  max_players INTEGER NOT NULL CHECK (max_players IN (8, 16)),
  current_players INTEGER NOT NULL DEFAULT 0,
  created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  starts_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  finished_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID REFERENCES users(id),
  prize_points INTEGER NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tournaments_status ON tournaments(status);
CREATE INDEX IF NOT EXISTS idx_tournaments_game ON tournaments(game_id);
CREATE INDEX IF NOT EXISTS idx_tournaments_created_at ON tournaments(created_at DESC);

-- ========================================
-- STEP 2: tournament_participants table
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_participants (
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  seed INTEGER NOT NULL,
  eliminated BOOLEAN NOT NULL DEFAULT FALSE,
  final_position INTEGER,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (tournament_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_tp_tournament ON tournament_participants(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tp_user ON tournament_participants(user_id);

-- ========================================
-- STEP 3: tournament_matches table
-- ========================================
CREATE TABLE IF NOT EXISTS tournament_matches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  tournament_id UUID NOT NULL REFERENCES tournaments(id) ON DELETE CASCADE,
  round INTEGER NOT NULL,
  match_number INTEGER NOT NULL,
  player1_id UUID REFERENCES users(id),
  player2_id UUID REFERENCES users(id),
  winner_id UUID REFERENCES users(id),
  room_id TEXT,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'playing', 'completed', 'bye')),
  scheduled_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (tournament_id, round, match_number)
);

CREATE INDEX IF NOT EXISTS idx_tm_tournament ON tournament_matches(tournament_id);
CREATE INDEX IF NOT EXISTS idx_tm_players ON tournament_matches(player1_id, player2_id);

-- ========================================
-- STEP 4: RLS Policies
-- ========================================
ALTER TABLE tournaments ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tournament_matches ENABLE ROW LEVEL SECURITY;

-- Anyone can read tournaments
CREATE POLICY "Tournaments are public"
  ON tournaments FOR SELECT USING (true);

-- Authenticated users can create tournaments
CREATE POLICY "Users can create tournaments"
  ON tournaments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Creator can update their tournament
CREATE POLICY "Creator can update tournament"
  ON tournaments FOR UPDATE
  USING (created_by = auth.uid()::text::uuid OR auth.role() = 'service_role');

-- Anyone can read participants
CREATE POLICY "Participants are public"
  ON tournament_participants FOR SELECT USING (true);

-- Authenticated users can join tournaments
CREATE POLICY "Users can join tournaments"
  ON tournament_participants FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can leave their own tournament
CREATE POLICY "Users can leave tournaments"
  ON tournament_participants FOR DELETE
  USING (user_id::text = auth.uid()::text);

-- Anyone can read matches
CREATE POLICY "Matches are public"
  ON tournament_matches FOR SELECT USING (true);

-- Service role can manage matches
CREATE POLICY "Service role manages matches"
  ON tournament_matches FOR ALL
  USING (auth.role() = 'service_role');

-- ========================================
-- STEP 5: Function — auto-start tournament when full
-- ========================================
CREATE OR REPLACE FUNCTION check_tournament_auto_start()
RETURNS TRIGGER AS $$
DECLARE
  v_tournament tournaments%ROWTYPE;
BEGIN
  SELECT * INTO v_tournament FROM tournaments WHERE id = NEW.tournament_id;

  -- Auto-start when max_players reached
  IF v_tournament.current_players >= v_tournament.max_players
     AND v_tournament.status = 'registration' THEN
    UPDATE tournaments
    SET status = 'in_progress', started_at = NOW()
    WHERE id = NEW.tournament_id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_participant_joined
  AFTER INSERT ON tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION check_tournament_auto_start();

-- ========================================
-- STEP 6: Function — update current_players count
-- ========================================
CREATE OR REPLACE FUNCTION update_tournament_player_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE tournaments
    SET current_players = current_players + 1
    WHERE id = NEW.tournament_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE tournaments
    SET current_players = GREATEST(0, current_players - 1)
    WHERE id = OLD.tournament_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_participant_count_change
  AFTER INSERT OR DELETE ON tournament_participants
  FOR EACH ROW
  EXECUTE FUNCTION update_tournament_player_count();

-- ========================================
-- STEP 7: Seed — first open tournament
-- ========================================
-- Note: created_by must reference a real user; insert after first user is created via app.
-- This seed creates a registration-open tournament for TicTacToe (8-player).
-- Run manually in Supabase SQL Editor after deploying, replacing <admin_user_id>:
--
-- INSERT INTO tournaments (game_id, name, max_players, prize_points, created_by)
-- VALUES ('tictactoe', 'First Mini Games Tournament', 8, 500, '<admin_user_id>');
