-- ============================================================================
-- Migration 003: User Profiles and Authentication
-- ============================================================================
-- Adds authentication fields, profile customization, and avatar system
-- Supports both anonymous free play and authenticated accounts

-- ============================================================================
-- 1. Add Authentication Columns
-- ============================================================================

-- Email and auth provider
ALTER TABLE users ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider TEXT; -- 'email', 'google', 'twitter', 'anonymous'
ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_user_id TEXT UNIQUE; -- Supabase Auth UUID
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_anonymous BOOLEAN DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS claimed_at TIMESTAMP WITH TIME ZONE;

-- ============================================================================
-- 2. Add Profile Customization Columns
-- ============================================================================

-- Avatar system
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_type TEXT DEFAULT 'default'; -- 'default', 'predefined', 'custom'
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_unlocked BOOLEAN DEFAULT FALSE;

-- Profile fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{}';

-- ============================================================================
-- 3. Create Indexes for Performance
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_auth_provider ON users(auth_provider);
CREATE INDEX IF NOT EXISTS idx_users_auth_user_id ON users(auth_user_id);
CREATE INDEX IF NOT EXISTS idx_users_is_anonymous ON users(is_anonymous);

-- ============================================================================
-- 4. Functions for Avatar Unlock System
-- ============================================================================

-- Check if user is eligible for custom avatar upload (100+ games played)
CREATE OR REPLACE FUNCTION can_unlock_custom_avatar(p_user_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  has_veteran_badge BOOLEAN;
  games_played_count INTEGER;
BEGIN
  -- Check for Veteran badge (100 games played)
  SELECT EXISTS (
    SELECT 1 FROM user_badges
    WHERE user_id = p_user_id AND badge_id = 'veteran'
  ) INTO has_veteran_badge;

  -- Fallback: Count total games played
  SELECT COUNT(*) INTO games_played_count
  FROM game_sessions WHERE user_id = p_user_id;

  RETURN has_veteran_badge OR games_played_count >= 100;
END;
$$ LANGUAGE plpgsql;

-- Trigger function to auto-unlock custom avatar when eligible
CREATE OR REPLACE FUNCTION auto_unlock_avatar()
RETURNS TRIGGER AS $$
BEGIN
  -- Check if user just became eligible for custom avatar
  IF can_unlock_custom_avatar(NEW.user_id) THEN
    UPDATE users
    SET avatar_unlocked = TRUE
    WHERE id = NEW.user_id AND avatar_unlocked = FALSE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- 5. Create Triggers
-- ============================================================================

-- Auto-unlock avatar when user earns 100th game session
DROP TRIGGER IF EXISTS trigger_auto_unlock_avatar_on_session ON game_sessions;
CREATE TRIGGER trigger_auto_unlock_avatar_on_session
AFTER INSERT ON game_sessions
FOR EACH ROW
EXECUTE FUNCTION auto_unlock_avatar();

-- Auto-unlock avatar when user earns veteran badge
DROP TRIGGER IF EXISTS trigger_auto_unlock_avatar_on_badge ON user_badges;
CREATE TRIGGER trigger_auto_unlock_avatar_on_badge
AFTER INSERT ON user_badges
FOR EACH ROW
EXECUTE FUNCTION auto_unlock_avatar();

-- ============================================================================
-- 6. Update Leaderboard Materialized View
-- ============================================================================

-- Drop and recreate leaderboard with avatar fields
DROP MATERIALIZED VIEW IF EXISTS leaderboard;

CREATE MATERIALIZED VIEW leaderboard AS
SELECT
  u.id as user_id,
  u.username,
  u.fid,
  u.avatar_type,
  u.avatar_url,
  u.total_points,
  COUNT(gs.id) as games_played,
  COUNT(CASE WHEN gs.result = 'win' THEN 1 END) as wins,
  ROW_NUMBER() OVER (ORDER BY u.total_points DESC, u.created_at ASC) as rank
FROM users u
LEFT JOIN game_sessions gs ON u.id = gs.user_id
GROUP BY u.id, u.username, u.fid, u.avatar_type, u.avatar_url, u.total_points, u.created_at
ORDER BY u.total_points DESC;

-- Create indexes on materialized view
CREATE UNIQUE INDEX idx_leaderboard_user ON leaderboard(user_id);
CREATE INDEX idx_leaderboard_rank ON leaderboard(rank);

-- ============================================================================
-- 7. Row Level Security (RLS) Policies
-- ============================================================================

-- Enable RLS on users table if not already enabled
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Allow users to view all profiles (for leaderboard)
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON users;
CREATE POLICY "Public profiles are viewable by everyone" ON users
FOR SELECT
USING (true);

-- Allow users to update their own profile
DROP POLICY IF EXISTS "Users can update their own profile" ON users;
CREATE POLICY "Users can update their own profile" ON users
FOR UPDATE
USING (
  auth.uid()::text = auth_user_id::text -- Supabase Auth match
  OR
  auth.jwt() ->> 'role' = 'service_role' -- Service role for API
);

-- Allow authenticated users to insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON users;
CREATE POLICY "Users can insert their own profile" ON users
FOR INSERT
WITH CHECK (
  auth.uid()::text = auth_user_id::text
  OR
  auth.jwt() ->> 'role' = 'service_role'
);

-- ============================================================================
-- 8. Comments for Documentation
-- ============================================================================

COMMENT ON COLUMN users.email IS 'User email address for authentication';
COMMENT ON COLUMN users.auth_provider IS 'Authentication provider: email, google, twitter, or anonymous';
COMMENT ON COLUMN users.auth_user_id IS 'Supabase Auth user ID (UUID)';
COMMENT ON COLUMN users.is_anonymous IS 'Whether user is playing anonymously (localStorage only)';
COMMENT ON COLUMN users.claimed_at IS 'Timestamp when anonymous profile was claimed';
COMMENT ON COLUMN users.avatar_type IS 'Avatar type: default, predefined, or custom';
COMMENT ON COLUMN users.avatar_url IS 'URL or path to user avatar image';
COMMENT ON COLUMN users.avatar_unlocked IS 'Whether user has unlocked custom avatar upload (100+ games)';
COMMENT ON COLUMN users.bio IS 'User bio/description (max 200 chars)';
COMMENT ON COLUMN users.social_links IS 'JSON object with social media links (twitter, farcaster, discord)';

-- ============================================================================
-- Migration Complete
-- ============================================================================
