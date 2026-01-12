-- Migration: Sudoku Game and Badges
-- Purpose: Add Sudoku game to games table and insert all Sudoku badges
-- Date: 2026-01-11

-- ========================================
-- STEP 1: Add Sudoku to games table
-- ========================================

-- Insert Sudoku game with deployed contract address
INSERT INTO games (id, name, description, contract_address, icon) VALUES
('sudoku', 'Sudoku', 'Classic number puzzle game - fill the 9×9 grid!', '0xB404882d0eb3A7c1022071559ab149e38d60cbE1', '/icons/sudoku.png')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STEP 2: Insert Sudoku Badges
-- ========================================

-- Progression Badges (First Wins) - 3 badges, 85 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('sudoku_first_win_easy', 'Number Novice', 'Win your first Sudoku game on Easy difficulty', '😊', 'progression', '{"game": "sudoku", "difficulty": "easy", "wins": 1}', 10),
('sudoku_first_win_medium', 'Logic Learner', 'Win your first Sudoku game on Medium difficulty', '🤔', 'progression', '{"game": "sudoku", "difficulty": "medium", "wins": 1}', 25),
('sudoku_first_win_hard', 'Puzzle Master', 'Win your first Sudoku game on Hard difficulty', '🔥', 'progression', '{"game": "sudoku", "difficulty": "hard", "wins": 1}', 50)
ON CONFLICT (id) DO NOTHING;

-- Performance Badges (Speed) - 3 badges, 250 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('sudoku_speed_easy_180s', 'Quick Solver', 'Win Easy difficulty in under 3 minutes', '⚡', 'performance', '{"game": "sudoku", "difficulty": "easy", "time_under": 180}', 25),
('sudoku_speed_medium_300s', 'Speed Thinker', 'Win Medium difficulty in under 5 minutes', '🏃', 'performance', '{"game": "sudoku", "difficulty": "medium", "time_under": 300}', 75),
('sudoku_speed_hard_600s', 'Lightning Brain', 'Win Hard difficulty in under 10 minutes', '🚀', 'performance', '{"game": "sudoku", "difficulty": "hard", "time_under": 600}', 150)
ON CONFLICT (id) DO NOTHING;

-- Mastery Badges (Total Wins) - 3 badges, 400 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('sudoku_wins_25_easy', 'Easy Expert', 'Win 25 games on Easy difficulty', '🏅', 'performance', '{"game": "sudoku", "difficulty": "easy", "wins": 25}', 50),
('sudoku_wins_25_medium', 'Medium Master', 'Win 25 games on Medium difficulty', '🧠', 'performance', '{"game": "sudoku", "difficulty": "medium", "wins": 25}', 100),
('sudoku_wins_25_hard', 'Hard Hero', 'Win 25 games on Hard difficulty', '👑', 'performance', '{"game": "sudoku", "difficulty": "hard", "wins": 25}', 250)
ON CONFLICT (id) DO NOTHING;

-- Performance Badges (Perfect Play) - 3 badges, 325 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('sudoku_perfect_game', 'Flawless Logic', 'Win a game without using any hints', '🎯', 'performance', '{"game": "sudoku", "perfect_game": true}', 50),
('sudoku_perfect_streak_5', 'Pure Genius', 'Win 5 perfect games (no hints) in a row', '⭐', 'performance', '{"game": "sudoku", "perfect_streak": 5}', 150),
('sudoku_win_streak_10', 'Unstoppable Mind', 'Win 10 games in a row (any difficulty)', '🔥', 'performance', '{"game": "sudoku", "win_streak": 10}', 125)
ON CONFLICT (id) DO NOTHING;

-- Exploration Badges - 2 badges, 275 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('sudoku_all_difficulties', 'Number Master', 'Win at least one game on each difficulty', '🎖️', 'exploration', '{"game": "sudoku", "all_difficulties": true}', 75),
('sudoku_speed_champion', 'Speed Legend', 'Unlock all 3 speed badges', '💨', 'exploration', '{"game": "sudoku", "speed_champion": true}', 200)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Count Sudoku badges
DO $$
DECLARE
    badge_count INTEGER;
    total_points INTEGER;
BEGIN
    SELECT COUNT(*), SUM(points) INTO badge_count, total_points
    FROM badges
    WHERE id LIKE 'sudoku_%';

    RAISE NOTICE 'Total Sudoku badges: %', badge_count;
    RAISE NOTICE 'Total points available: %', total_points;
END $$;

-- Verify game was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM games
        WHERE id = 'sudoku'
    ) THEN
        RAISE NOTICE 'Sudoku game successfully added to games table';
    END IF;
END $$;
