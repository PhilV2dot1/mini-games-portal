-- Migration: Connect 4 Badges and Difficulty Tracking
-- Purpose: Add difficulty tracking to game sessions and insert Connect 4 badges
-- Date: 2026-01-08

-- ========================================
-- STEP 1: Add difficulty column to game_sessions
-- ========================================

-- Add difficulty column with validation
ALTER TABLE game_sessions
ADD COLUMN difficulty VARCHAR(10) CHECK (difficulty IN ('easy', 'medium', 'hard'));

-- Add index for faster queries by difficulty
CREATE INDEX IF NOT EXISTS idx_game_sessions_difficulty
ON game_sessions(game_id, difficulty, result);

-- ========================================
-- STEP 2: Insert Connect 4 Badges
-- ========================================

-- Progression Badges (First Wins)
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('connect4_first_win_easy', 'Beginner''s Victory', 'Win your first Connect 4 game on Easy difficulty', '😊', 'progression', '{"game": "connectfive", "difficulty": "easy", "wins": 1}', 10),
('connect4_first_win_medium', 'Tactical Victory', 'Win your first Connect 4 game on Medium difficulty', '🤔', 'progression', '{"game": "connectfive", "difficulty": "medium", "wins": 1}', 25),
('connect4_first_win_hard', 'Master''s Victory', 'Win your first Connect 4 game on Hard difficulty', '😤', 'progression', '{"game": "connectfive", "difficulty": "hard", "wins": 1}', 50)
ON CONFLICT (id) DO NOTHING;

-- Performance Badges (Win Streaks)
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('connect4_streak_5_easy', 'Consistent Player', 'Win 5 consecutive games on Easy difficulty', '🎯', 'performance', '{"game": "connectfive", "difficulty": "easy", "win_streak": 5}', 25),
('connect4_streak_5_medium', 'Dominator', 'Win 5 consecutive games on Medium difficulty', '💪', 'performance', '{"game": "connectfive", "difficulty": "medium", "win_streak": 5}', 75),
('connect4_streak_5_hard', 'AI Slayer', 'Win 5 consecutive games on Hard difficulty', '👊', 'performance', '{"game": "connectfive", "difficulty": "hard", "win_streak": 5}', 150)
ON CONFLICT (id) DO NOTHING;

-- Elite Badges (Total Wins)
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('connect4_wins_50_easy', 'Easy Conqueror', 'Win 50 games on Easy difficulty', '🏅', 'elite', '{"game": "connectfive", "difficulty": "easy", "wins": 50}', 50),
('connect4_wins_50_medium', 'Strategic Mind', 'Win 50 games on Medium difficulty', '🧠', 'elite', '{"game": "connectfive", "difficulty": "medium", "wins": 50}', 150),
('connect4_wins_50_hard', 'Grandmaster', 'Win 50 games on Hard difficulty', '👑', 'elite', '{"game": "connectfive", "difficulty": "hard", "wins": 50}', 300)
ON CONFLICT (id) DO NOTHING;

-- Engagement Badges (Games Played)
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('connect4_games_100', 'Connect 4 Enthusiast', 'Play 100 Connect 4 games (any difficulty)', '🎮', 'engagement', '{"game": "connectfive", "games_played": 100}', 50),
('connect4_games_500', 'Connect 4 Veteran', 'Play 500 Connect 4 games (any difficulty)', '🏆', 'engagement', '{"game": "connectfive", "games_played": 500}', 150)
ON CONFLICT (id) DO NOTHING;

-- Collection Badges
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('connect4_all_difficulties', 'Triple Threat', 'Win at least one game on each difficulty level', '🎯', 'collection', '{"game": "connectfive", "all_difficulties": true}', 100),
('connect4_all_difficulties_streak', 'Perfect Champion', 'Achieve a 5-game win streak on all difficulty levels', '⭐', 'collection', '{"game": "connectfive", "all_difficulties_streak": true}', 250)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Verify column was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'game_sessions'
        AND column_name = 'difficulty'
    ) THEN
        RAISE NOTICE 'Column difficulty successfully added to game_sessions';
    END IF;
END $$;

-- Count Connect 4 badges
DO $$
DECLARE
    badge_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO badge_count
    FROM badges
    WHERE id LIKE 'connect4_%';

    RAISE NOTICE 'Total Connect 4 badges: %', badge_count;
END $$;
