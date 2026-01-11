-- Yahtzee Game and Badges Migration
-- Total: 15 badges, 1210 points

-- Insert Yahtzee game into games table
INSERT INTO games (id, name, description, contract_address, icon)
VALUES (
  'yahtzee',
  'Yahtzee',
  'Roll dice and make legendary combos!',
  '0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0',
  '/icons/yahtzee.png'
) ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PROGRESSION BADGES (3 badges, 85 points)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, category, requirement, points)
VALUES
(
  'yahtzee_first_game',
  'First Roll',
  'Play your first Yahtzee game',
  '🎲',
  'progression',
  '{"game": "yahtzee", "games_played": 1}',
  10
),
(
  'yahtzee_first_win',
  'Lucky Start',
  'Score 200+ in your first game',
  '🍀',
  'progression',
  '{"game": "yahtzee", "first_game_score": 200}',
  25
),
(
  'yahtzee_games_50',
  'Dice Enthusiast',
  'Play 50 Yahtzee games',
  '🎮',
  'progression',
  '{"game": "yahtzee", "games_played": 50}',
  50
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PERFORMANCE - SCORE MILESTONES (4 badges, 350 points)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, category, requirement, points)
VALUES
(
  'yahtzee_score_200',
  'Rolling Hot',
  'Score 200+ in a single game',
  '🔥',
  'performance',
  '{"game": "yahtzee", "score_min": 200}',
  50
),
(
  'yahtzee_score_250',
  'Master Roller',
  'Score 250+ in a single game',
  '⭐',
  'performance',
  '{"game": "yahtzee", "score_min": 250}',
  100
),
(
  'yahtzee_score_300',
  'Legendary Dice',
  'Score 300+ in a single game',
  '🏆',
  'performance',
  '{"game": "yahtzee", "score_min": 300}',
  150
),
(
  'yahtzee_perfect_game',
  'Perfect 375',
  'Achieve the maximum possible score of 375',
  '💎',
  'performance',
  '{"game": "yahtzee", "score": 375}',
  50
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- PERFORMANCE - SPECIAL COMBOS (4 badges, 300 points)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, category, requirement, points)
VALUES
(
  'yahtzee_roll_yahtzee',
  'Yahtzee!',
  'Roll all 5 matching dice (Yahtzee)',
  '🎯',
  'performance',
  '{"game": "yahtzee", "yahtzee_rolled": true}',
  50
),
(
  'yahtzee_multiple_yahtzees',
  'Double Yahtzee',
  'Roll 2+ Yahtzees in one game',
  '⚡',
  'performance',
  '{"game": "yahtzee", "yahtzees_in_game": 2}',
  100
),
(
  'yahtzee_upper_bonus',
  'Bonus Seeker',
  'Achieve upper section bonus (score 63+ in upper section)',
  '💰',
  'performance',
  '{"game": "yahtzee", "upper_bonus": true}',
  75
),
(
  'yahtzee_all_categories',
  'Completionist',
  'Fill all 13 categories in one game',
  '✅',
  'performance',
  '{"game": "yahtzee", "categories_filled": 13}',
  75
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- MASTERY BADGES (2 badges, 200 points)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, category, requirement, points)
VALUES
(
  'yahtzee_wins_25',
  'Consistent Roller',
  'Score 200+ in 25 games',
  '🎖️',
  'performance',
  '{"game": "yahtzee", "high_scores": 25}',
  100
),
(
  'yahtzee_wins_100',
  'Dice Master',
  'Score 200+ in 100 games',
  '👑',
  'performance',
  '{"game": "yahtzee", "high_scores": 100}',
  100
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- EXPLORATION BADGES (2 badges, 275 points)
-- ============================================================================

INSERT INTO badges (id, name, description, icon, category, requirement, points)
VALUES
(
  'yahtzee_all_combos',
  'Combo Collector',
  'Score in all 13 categories at least once (across all games)',
  '🗂️',
  'exploration',
  '{"game": "yahtzee", "all_combos": true}',
  75
),
(
  'yahtzee_speed_demon',
  'Speed Roller',
  'Complete a game in under 3 minutes',
  '💨',
  'exploration',
  '{"game": "yahtzee", "time_under": 180}',
  200
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Count Yahtzee badges
DO $$
DECLARE
    badge_count INTEGER;
    total_points INTEGER;
BEGIN
    SELECT COUNT(*), SUM(points) INTO badge_count, total_points
    FROM badges
    WHERE id LIKE 'yahtzee_%';

    RAISE NOTICE 'Total Yahtzee badges: %', badge_count;
    RAISE NOTICE 'Total points available: %', total_points;
END $$;

-- Verify game was added
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM games
        WHERE id = 'yahtzee'
    ) THEN
        RAISE NOTICE 'Yahtzee game successfully added to games table';
    END IF;
END $$;

-- ============================================================================
-- BADGE SUMMARY
-- ============================================================================
-- Progression: 3 badges, 85 points
-- Performance - Scores: 4 badges, 350 points
-- Performance - Combos: 4 badges, 300 points
-- Mastery: 2 badges, 200 points
-- Exploration: 2 badges, 275 points
-- ============================================================================
-- TOTAL: 15 badges, 1210 points
-- ============================================================================
