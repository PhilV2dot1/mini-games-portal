-- Migration: Minesweeper Game and Badges
-- Purpose: Add Minesweeper game to games table and insert all Minesweeper badges
-- Date: 2026-01-10

-- ========================================
-- STEP 1: Add Minesweeper to games table
-- ========================================

-- Insert Minesweeper game with deployed contract address
INSERT INTO games (id, name, description, contract_address, icon) VALUES
('minesweeper', 'Minesweeper', 'Classic mine-sweeping puzzle game!', '0x62798e5246169e655901C546c0496bb2C6158041', '/icons/minesweeper.png')
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- STEP 2: Insert Minesweeper Badges
-- ========================================

-- Progression Badges (First Wins) - 3 badges, 85 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_first_win_easy', 'Beginner Sweeper', 'Win your first Minesweeper game on Easy difficulty', '😊', 'progression', '{"game": "minesweeper", "difficulty": "easy", "wins": 1}', 10),
('minesweeper_first_win_medium', 'Intermediate Sweeper', 'Win your first Minesweeper game on Medium difficulty', '🤔', 'progression', '{"game": "minesweeper", "difficulty": "medium", "wins": 1}', 25),
('minesweeper_first_win_hard', 'Expert Sweeper', 'Win your first Minesweeper game on Hard difficulty', '😤', 'progression', '{"game": "minesweeper", "difficulty": "hard", "wins": 1}', 50)
ON CONFLICT (id) DO NOTHING;

-- Performance Badges (Speed) - 3 badges, 250 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_speed_easy_30s', 'Lightning Sweeper', 'Win Easy difficulty in under 30 seconds', '⚡', 'performance', '{"game": "minesweeper", "difficulty": "easy", "time_under": 30}', 25),
('minesweeper_speed_medium_120s', 'Swift Tactician', 'Win Medium difficulty in under 2 minutes', '🏃', 'performance', '{"game": "minesweeper", "difficulty": "medium", "time_under": 120}', 75),
('minesweeper_speed_hard_300s', 'Speed Demon', 'Win Hard difficulty in under 5 minutes', '🚀', 'performance', '{"game": "minesweeper", "difficulty": "hard", "time_under": 300}', 150)
ON CONFLICT (id) DO NOTHING;

-- Mastery Badges (Total Wins) - 3 badges, 400 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_wins_25_easy', 'Easy Master', 'Win 25 games on Easy difficulty', '🏅', 'performance', '{"game": "minesweeper", "difficulty": "easy", "wins": 25}', 50),
('minesweeper_wins_25_medium', 'Tactical Mind', 'Win 25 games on Medium difficulty', '🧠', 'performance', '{"game": "minesweeper", "difficulty": "medium", "wins": 25}', 100),
('minesweeper_wins_25_hard', 'Grandmaster', 'Win 25 games on Hard difficulty', '👑', 'performance', '{"game": "minesweeper", "difficulty": "hard", "wins": 25}', 250)
ON CONFLICT (id) DO NOTHING;

-- Performance Badges (Precision) - 3 badges, 300 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_perfect_game', 'Perfect Precision', 'Win a game with no incorrect flags', '🎯', 'performance', '{"game": "minesweeper", "perfect_game": true}', 50),
('minesweeper_perfect_streak_5', 'Flawless Streak', 'Win 5 perfect games in a row', '⭐', 'performance', '{"game": "minesweeper", "perfect_streak": 5}', 150),
('minesweeper_win_streak_10', 'Unstoppable Sweeper', 'Win 10 games in a row (any difficulty)', '🔥', 'performance', '{"game": "minesweeper", "win_streak": 10}', 100)
ON CONFLICT (id) DO NOTHING;

-- Exploration Badges - 2 badges, 275 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_all_difficulties', 'Triple Threat', 'Win at least one game on each difficulty', '🎖️', 'exploration', '{"game": "minesweeper", "all_difficulties": true}', 75),
('minesweeper_speed_master', 'Speed Master', 'Unlock all 3 speed badges', '💨', 'exploration', '{"game": "minesweeper", "speed_master": true}', 200)
ON CONFLICT (id) DO NOTHING;

-- Progression Badges (Games Played) - 2 badges, 200 points total
INSERT INTO badges (id, name, description, icon, category, requirement, points) VALUES
('minesweeper_games_100', 'Minesweeper Enthusiast', 'Play 100 Minesweeper games (any difficulty)', '🎮', 'progression', '{"game": "minesweeper", "games_played": 100}', 50),
('minesweeper_games_500', 'Minesweeper Veteran', 'Play 500 Minesweeper games (any difficulty)', '🏆', 'progression', '{"game": "minesweeper", "games_played": 500}', 150)
ON CONFLICT (id) DO NOTHING;

-- ========================================
-- VERIFICATION
-- ========================================

-- Count Minesweeper badges
DO $$
DECLARE
    badge_count INTEGER;
    total_points INTEGER;
BEGIN
    SELECT COUNT(*), SUM(points) INTO badge_count, total_points
    FROM badges
    WHERE id LIKE 'minesweeper_%';

    RAISE NOTICE 'Total Minesweeper badges: %', badge_count;
    RAISE NOTICE 'Total points available: %', total_points;
END $$;

-- Verify game was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM games
        WHERE id = 'minesweeper'
    ) THEN
        RAISE NOTICE 'Minesweeper game successfully added to games table';
    END IF;
END $$;
