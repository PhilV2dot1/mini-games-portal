import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase/client';

export const runtime = 'edge';

/**
 * Calculate max win streak for a specific game difficulty
 */
function calculateWinStreak(sessions: any[], difficulty: string): number { // eslint-disable-line @typescript-eslint/no-explicit-any
  let currentStreak = 0;
  let maxStreak = 0;

  for (const session of sessions) {
    if (session.difficulty === difficulty && session.result === 'win') {
      currentStreak++;
      maxStreak = Math.max(maxStreak, currentStreak);
    } else if (session.difficulty === difficulty) {
      currentStreak = 0;
    }
  }

  return maxStreak;
}

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
  // Connect 4 specific
  game?: string;
  difficulty?: 'easy' | 'medium' | 'hard';
  all_difficulties?: boolean;
  all_difficulties_streak?: boolean;
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

    // Calculate Connect 4 stats by difficulty
    const connect4Sessions = sessions.filter(s => s.game_id === 'connectfive');
    const connect4Stats = {
      easy: {
        wins: connect4Sessions.filter(s => s.difficulty === 'easy' && s.result === 'win').length,
        streak: calculateWinStreak(connect4Sessions, 'easy'),
      },
      medium: {
        wins: connect4Sessions.filter(s => s.difficulty === 'medium' && s.result === 'win').length,
        streak: calculateWinStreak(connect4Sessions, 'medium'),
      },
      hard: {
        wins: connect4Sessions.filter(s => s.difficulty === 'hard' && s.result === 'win').length,
        streak: calculateWinStreak(connect4Sessions, 'hard'),
      },
      totalGames: connect4Sessions.length,
    };

    // Calculate Sudoku stats by difficulty
    const sudokuSessions = sessions.filter(s => s.game_id === 'sudoku');
    const sudokuStats = {
      easy: {
        wins: sudokuSessions.filter(s => s.difficulty === 'easy' && s.result === 'win').length,
        bestTime: Math.min(...sudokuSessions.filter(s => s.difficulty === 'easy' && s.result === 'win' && s.time_taken).map(s => s.time_taken), Infinity),
      },
      medium: {
        wins: sudokuSessions.filter(s => s.difficulty === 'medium' && s.result === 'win').length,
        bestTime: Math.min(...sudokuSessions.filter(s => s.difficulty === 'medium' && s.result === 'win' && s.time_taken).map(s => s.time_taken), Infinity),
      },
      hard: {
        wins: sudokuSessions.filter(s => s.difficulty === 'hard' && s.result === 'win').length,
        bestTime: Math.min(...sudokuSessions.filter(s => s.difficulty === 'hard' && s.result === 'win' && s.time_taken).map(s => s.time_taken), Infinity),
      },
      totalGames: sudokuSessions.length,
      perfectGames: sudokuSessions.filter(s => s.result === 'win' && s.hints_used === 0).length,
      winStreak: calculateWinStreak(sudokuSessions, ''),
      perfectStreak: (() => {
        let streak = 0;
        let maxStreak = 0;
        for (const session of sudokuSessions) {
          if (session.result === 'win' && session.hints_used === 0) {
            streak++;
            maxStreak = Math.max(maxStreak, streak);
          } else if (session.result === 'win') {
            streak = 0;
          }
        }
        return maxStreak;
      })(),
      hasAllDifficulties: sudokuSessions.filter(s => s.difficulty === 'easy' && s.result === 'win').length > 0 &&
                           sudokuSessions.filter(s => s.difficulty === 'medium' && s.result === 'win').length > 0 &&
                           sudokuSessions.filter(s => s.difficulty === 'hard' && s.result === 'win').length > 0,
    };

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
      connect4Stats,
      sudokuStats,
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

      // Check Connect 4 specific requirements
      if (req.game === 'connectfive') {
        // Check difficulty-specific badges
        if (req.difficulty) {
          const diffStats = userStats.connect4Stats[req.difficulty];

          if (req.wins !== undefined && diffStats.wins < req.wins) {
            qualifies = false;
          }
          if (req.win_streak !== undefined && diffStats.streak < req.win_streak) {
            qualifies = false;
          }
        }

        // Check all difficulties badge
        if (req.all_difficulties) {
          const hasWinOnEasy = userStats.connect4Stats.easy.wins > 0;
          const hasWinOnMedium = userStats.connect4Stats.medium.wins > 0;
          const hasWinOnHard = userStats.connect4Stats.hard.wins > 0;
          qualifies = hasWinOnEasy && hasWinOnMedium && hasWinOnHard;
        }

        // Check all difficulties streak badge
        if (req.all_difficulties_streak) {
          const hasStreakOnEasy = userStats.connect4Stats.easy.streak >= 5;
          const hasStreakOnMedium = userStats.connect4Stats.medium.streak >= 5;
          const hasStreakOnHard = userStats.connect4Stats.hard.streak >= 5;
          qualifies = hasStreakOnEasy && hasStreakOnMedium && hasStreakOnHard;
        }

        // Check total games played (for engagement badges)
        if (req.games_played !== undefined && userStats.connect4Stats.totalGames < req.games_played) {
          qualifies = false;
        }
      } else if (req.game === 'sudoku') {
        // Check Sudoku specific requirements
        // Check difficulty-specific badges (wins and speed)
        if (req.difficulty) {
          const diffStats = userStats.sudokuStats[req.difficulty];

          if (req.wins !== undefined && diffStats.wins < req.wins) {
            qualifies = false;
          }
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          if ((req as any).time_under !== undefined && (diffStats.bestTime === Infinity || diffStats.bestTime > (req as any).time_under)) {
            qualifies = false;
          }
        }

        // Check all difficulties badge
        if (req.all_difficulties) {
          qualifies = userStats.sudokuStats.hasAllDifficulties;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((req as any).perfect_game) {
          qualifies = userStats.sudokuStats.perfectGames > 0;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((req as any).perfect_streak !== undefined && userStats.sudokuStats.perfectStreak < (req as any).perfect_streak) {
          qualifies = false;
        }

        if (req.win_streak !== undefined && userStats.sudokuStats.winStreak < req.win_streak) {
          qualifies = false;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if ((req as any).speed_champion) {
          // User needs to have all 3 speed badges
          const hasSpeedEasy = userStats.sudokuStats.easy.bestTime < 180;
          const hasSpeedMedium = userStats.sudokuStats.medium.bestTime < 300;
          const hasSpeedHard = userStats.sudokuStats.hard.bestTime < 600;
          qualifies = hasSpeedEasy && hasSpeedMedium && hasSpeedHard;
        }

        // Check total games played (for engagement badges)
        if (req.games_played !== undefined && userStats.sudokuStats.totalGames < req.games_played) {
          qualifies = false;
        }
      } else {
        // Check general requirements (non-Connect4 badges)
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
