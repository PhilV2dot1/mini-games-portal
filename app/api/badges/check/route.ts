import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

interface BadgeRequirement {
  games_played?: number;
  wins?: number;
  win_streak?: number;
  leaderboard_rank?: number;
  unique_games?: number;
  games_won_all?: number;
  games_played_og?: number;
  games_played_new?: number;
  onchain_games?: number;
  celo_wagered?: number;
}

interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement: BadgeRequirement;
  points: number;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId } = body;

    if (!userId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      );
    }

    console.log('[Badge Check] Checking badges for user:', userId);

    // Get all badge definitions
    const { data: allBadges, error: badgesError } = await supabase
      .from('badges')
      .select('*') as { data: any[] | null; error: any }; // eslint-disable-line @typescript-eslint/no-explicit-any

    if (badgesError) {
      console.error('[Badge Check] Error fetching badges:', badgesError);
      return NextResponse.json(
        { error: 'Failed to fetch badges' },
        { status: 500 }
      );
    }

    // Get user's existing badges
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', userId) as { data: any[] | null }; // eslint-disable-line @typescript-eslint/no-explicit-any

    const existingBadgeIds = new Set(
      existingBadges?.map((b: any) => b.badge_id) || [] // eslint-disable-line @typescript-eslint/no-explicit-any
    );

    // Get user stats
    const { data: sessions } = await supabase
      .from('game_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('played_at', { ascending: false }) as { data: any[] | null }; // eslint-disable-line @typescript-eslint/no-explicit-any

    // Get user's leaderboard rank
    const { data: leaderboardEntry } = await supabase
      .from('leaderboard')
      .select('rank')
      .eq('user_id', userId)
      .maybeSingle<{ rank: number }>();

    if (!sessions) {
      return NextResponse.json({ newBadges: [] });
    }

    // Calculate user stats
    const gamesPlayed = sessions.length;
    const wins = sessions.filter(s => s.result === 'win').length;
    const uniqueGames = new Set(sessions.map(s => s.game_id)).size;
    const onchainGames = sessions.filter(s => s.mode === 'onchain').length;

    // Check which games have been won
    const gamesWon = new Set(
      sessions.filter(s => s.result === 'win').map(s => s.game_id)
    ).size;

    // Check OG games (original 4): blackjack, rps, tictactoe, jackpot
    const ogGames = new Set(['blackjack', 'rps', 'tictactoe', 'jackpot']);
    const ogGamesPlayed = new Set(
      sessions.filter(s => ogGames.has(s.game_id)).map(s => s.game_id)
    ).size;

    // Check new games: 2048, mastermind
    const newGames = new Set(['2048', 'mastermind']);
    const newGamesPlayed = new Set(
      sessions.filter(s => newGames.has(s.game_id)).map(s => s.game_id)
    ).size;

    // Calculate win streak
    let currentStreak = 0;
    let maxStreak = 0;
    for (const session of sessions) {
      if (session.result === 'win') {
        currentStreak++;
        maxStreak = Math.max(maxStreak, currentStreak);
      } else if (session.result === 'lose') {
        currentStreak = 0;
      }
    }

    const userStats = {
      games_played: gamesPlayed,
      wins,
      win_streak: maxStreak,
      leaderboard_rank: leaderboardEntry?.rank || 999999,
      unique_games: uniqueGames,
      games_won_all: gamesWon,
      games_played_og: ogGamesPlayed,
      games_played_new: newGamesPlayed,
      onchain_games: onchainGames,
      celo_wagered: onchainGames * 0.01, // Simplified: each on-chain game = 0.01 CELO
    };

    console.log('[Badge Check] User stats:', userStats);

    // Check which badges the user qualifies for
    const earnedBadges: Badge[] = [];

    for (const badge of (allBadges || [])) {
      // Skip if user already has this badge
      if (existingBadgeIds.has(badge.id)) {
        continue;
      }

      const req = badge.requirement as BadgeRequirement;
      let qualifies = true;

      // Check each requirement
      if (req.games_played !== undefined && userStats.games_played < req.games_played) {
        qualifies = false;
      }
      if (req.wins !== undefined && userStats.wins < req.wins) {
        qualifies = false;
      }
      if (req.win_streak !== undefined && userStats.win_streak < req.win_streak) {
        qualifies = false;
      }
      if (req.leaderboard_rank !== undefined && userStats.leaderboard_rank > req.leaderboard_rank) {
        qualifies = false;
      }
      if (req.unique_games !== undefined && userStats.unique_games < req.unique_games) {
        qualifies = false;
      }
      if (req.games_won_all !== undefined && userStats.games_won_all < req.games_won_all) {
        qualifies = false;
      }
      if (req.games_played_og !== undefined && userStats.games_played_og < req.games_played_og) {
        qualifies = false;
      }
      if (req.games_played_new !== undefined && userStats.games_played_new < req.games_played_new) {
        qualifies = false;
      }
      if (req.onchain_games !== undefined && userStats.onchain_games < req.onchain_games) {
        qualifies = false;
      }
      if (req.celo_wagered !== undefined && userStats.celo_wagered < req.celo_wagered) {
        qualifies = false;
      }

      if (qualifies) {
        earnedBadges.push(badge as Badge);
      }
    }

    console.log('[Badge Check] New badges earned:', earnedBadges.length);

    // Insert new badges
    if (earnedBadges.length > 0) {
      const badgeInserts = earnedBadges.map(badge => ({
        user_id: userId,
        badge_id: badge.id,
      }));

      const { error: insertError } = await supabase
        .from('user_badges')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .insert(badgeInserts as any);

      if (insertError) {
        console.error('[Badge Check] Error inserting badges:', insertError);
        // Don't fail the whole request if badge insertion fails
      } else {
        // Update user total points with badge points
        const totalBadgePoints = earnedBadges.reduce((sum, b) => sum + b.points, 0);

        if (totalBadgePoints > 0) {
          const { data: userData } = await supabase
            .from('users')
            .select('total_points')
            .eq('id', userId)
            .single<{ total_points: number }>();

          if (userData) {
            await supabase
              .from('users')
              // @ts-expect-error - Supabase type inference issue in Edge runtime
              .update({ total_points: userData.total_points + totalBadgePoints })
              .eq('id', userId);
          }
        }
      }
    }

    return NextResponse.json({
      newBadges: earnedBadges,
      stats: userStats,
    });
  } catch (error) {
    console.error('[Badge Check] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
