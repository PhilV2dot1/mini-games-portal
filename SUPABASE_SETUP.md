# Supabase Setup Guide - Phase 2

This guide will help you set up Supabase for the Celo Games Portal (Phase 2: Database & Leaderboards).

## 1. Create Supabase Project

1. Go to [supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in:
   - **Name**: `celo-games-portal`
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose closest to your users
   - **Pricing Plan**: Free tier is fine for now
4. Click "Create new project"
5. Wait 2-3 minutes for provisioning

## 2. Run Database Migration

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase/migrations/001_initial_schema.sql`
4. Paste into the SQL editor
5. Click "Run" (or press Ctrl+Enter)
6. You should see "Success. No rows returned" - this is good!

### What this creates:
- ✅ 5 tables: `users`, `games`, `game_sessions`, `badges`, `user_badges`
- ✅ 6 games pre-inserted
- ✅ 14 badges pre-inserted
- ✅ 1 materialized view: `leaderboard`
- ✅ 2 functions: `get_game_leaderboard()`, `refresh_leaderboard()`
- ✅ Triggers for auto-updates
- ✅ Row Level Security (RLS) policies

## 3. Get API Keys

1. In Supabase dashboard, go to **Settings** → **API** (left sidebar)
2. Copy the following:
   - **Project URL**: `https://xxxxx.supabase.co`
   - **anon public key**: Long string starting with `eyJ...`
   - **service_role key**: Different long string starting with `eyJ...` (keep this secret!)

## 4. Configure Environment Variables

1. In your project root, copy `.env.example` to `.env.local`:
   ```bash
   cp .env.example .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGc...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGc... (keep secret!)
   ```

3. Keep existing values for WalletConnect and Celo RPC

## 5. Verify Setup

### Test Database Connection

1. Start your dev server:
   ```bash
   npm run dev
   ```

2. Open browser console and test:
   ```javascript
   // Test fetching games
   fetch('/api/leaderboard/global?limit=10')
     .then(r => r.json())
     .then(console.log)
   ```

3. You should see an empty leaderboard (expected - no users yet!)

### Test Game Session Recording

1. Play a game in Free Mode
2. The game should automatically record to Supabase
3. Check Supabase dashboard → **Table Editor** → `game_sessions`
4. You should see a new row!

## 6. Optional: Create Helper RPC Function

The API uses a helper function that wasn't in the initial migration. Add it:

1. Go to SQL Editor in Supabase
2. Run this query:

```sql
CREATE OR REPLACE FUNCTION increment_user_points(p_user_id UUID, p_points INTEGER)
RETURNS VOID AS $$
BEGIN
  UPDATE users
  SET total_points = total_points + p_points,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 7. Refresh Materialized View (Optional)

The leaderboard view auto-refreshes via trigger, but you can manually refresh:

```sql
REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;
```

## 8. Monitor Database

### Check Tables
- **Table Editor** → View/edit data directly
- **Database** → **Tables** → See table structure

### Check Functions
- **Database** → **Functions** → See custom functions

### Check Logs
- **Logs** → **Postgres Logs** → See queries and errors

## API Endpoints Now Available

- `POST /api/game/session` - Record game session
- `GET /api/user/profile?fid=123` - Get user profile
- `GET /api/leaderboard/global` - Global leaderboard
- `GET /api/leaderboard/game/blackjack` - Per-game leaderboard
- `POST /api/user/migrate` - Migrate localStorage to database

## Troubleshooting

### Issue: "Missing Supabase environment variables"
**Solution**: Make sure `.env.local` exists with `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Issue: "Failed to create game session"
**Solution**:
1. Check Supabase **Table Editor** → `games` - should have 6 rows
2. If empty, re-run the INSERT statements from the migration

### Issue: "User not found" in profile API
**Solution**: This is expected if user hasn't played any games yet. Play a game to create user.

### Issue: Leaderboard not updating
**Solution**:
1. Check if trigger exists: **Database** → **Triggers**
2. Should see `trigger_refresh_leaderboard` on `game_sessions`
3. Manually refresh: `REFRESH MATERIALIZED VIEW CONCURRENTLY leaderboard;`

## Next Steps

✅ **Phase 2 Complete!** You now have:
- Database for persistent storage
- API endpoints for all operations
- Leaderboards (global + per-game)
- User profiles with stats
- Badge system ready

🚀 **Phase 3**: Gamification & Polish
- Implement badge checking logic
- Create leaderboard UI components
- Add user profile page
- Enhanced sharing with OG images
- Notification system

---

For issues or questions, check:
- [Supabase Docs](https://supabase.com/docs)
- [Next.js API Routes](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
