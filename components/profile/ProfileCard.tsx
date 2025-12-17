'use client';

/**
 * ProfileCard - Reusable profile display component
 *
 * Shows user avatar, username, rank, points, and badges.
 * Used in leaderboard, game sessions, and profile pages.
 */

import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';

interface ProfileCardProps {
  user: {
    id?: string;
    username: string;
    avatar_url?: string;
    avatar_type?: 'default' | 'predefined' | 'custom';
    total_points?: number;
    rank?: number;
    fid?: number;
  };
  badges?: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
  size?: 'sm' | 'md' | 'lg';
  showBadges?: boolean;
  showPoints?: boolean;
  showRank?: boolean;
  className?: string;
  onClick?: () => void;
}

export function ProfileCard({
  user,
  badges = [],
  size = 'md',
  showBadges = true,
  showPoints = true,
  showRank = true,
  className = '',
  onClick,
}: ProfileCardProps) {
  const avatarUrl = user.avatar_url || '/avatars/predefined/default-player.svg';

  // Size mappings
  const sizeClasses = {
    sm: {
      container: 'p-3',
      avatar: 'w-12 h-12',
      username: 'text-sm',
      points: 'text-xs',
      rank: 'text-xs',
      badge: 'text-lg',
    },
    md: {
      container: 'p-4',
      avatar: 'w-16 h-16',
      username: 'text-base',
      points: 'text-sm',
      rank: 'text-sm',
      badge: 'text-xl',
    },
    lg: {
      container: 'p-6',
      avatar: 'w-24 h-24',
      username: 'text-xl',
      points: 'text-base',
      rank: 'text-base',
      badge: 'text-2xl',
    },
  };

  const classes = sizeClasses[size];

  return (
    <motion.div
      whileHover={onClick ? { scale: 1.02 } : {}}
      onClick={onClick}
      className={`bg-white/90 backdrop-blur-sm rounded-xl border-2 border-gray-300 ${
        onClick ? 'cursor-pointer hover:border-yellow-400 hover:shadow-lg' : ''
      } transition-all ${classes.container} ${className}`}
    >
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className={`relative ${classes.avatar} flex-shrink-0`}>
          <div className="relative w-full h-full rounded-full overflow-hidden border-4 border-yellow-400 shadow-md">
            <Image
              src={avatarUrl}
              alt={user.username}
              fill
              className="object-cover"
            />
          </div>

          {/* Rank badge */}
          {showRank && user.rank && user.rank <= 3 && (
            <div className="absolute -top-1 -right-1 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full w-6 h-6 flex items-center justify-center border-2 border-white shadow-md">
              <span className="text-xs font-bold text-gray-900">
                {user.rank === 1 ? '🥇' : user.rank === 2 ? '🥈' : '🥉'}
              </span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Username and rank */}
          <div className="flex items-center gap-2 mb-1">
            <h3 className={`font-bold text-gray-900 truncate ${classes.username}`}>
              {user.username}
            </h3>
            {showRank && user.rank && user.rank > 3 && (
              <span className={`text-gray-500 font-semibold ${classes.rank}`}>
                #{user.rank}
              </span>
            )}
          </div>

          {/* Points */}
          {showPoints && user.total_points !== undefined && (
            <div className={`text-gray-600 ${classes.points} mb-1`}>
              <span className="font-semibold">{user.total_points.toLocaleString()}</span> points
            </div>
          )}

          {/* Badges */}
          {showBadges && badges && badges.length > 0 && (
            <div className="flex gap-1 mt-2">
              {badges.slice(0, 5).map((badge) => (
                <span
                  key={badge.id}
                  className={`${classes.badge}`}
                  title={badge.name}
                >
                  {badge.icon}
                </span>
              ))}
              {badges.length > 5 && (
                <span className={`text-gray-500 ${classes.badge}`} title={`+${badges.length - 5} more`}>
                  +{badges.length - 5}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}
