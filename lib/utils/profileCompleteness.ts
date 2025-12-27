/**
 * Profile Completeness Utility
 * Calculates profile completion score and tracks completed actions
 */

export interface ProfileCompletenessCheck {
  id: string;
  label: string;
  description: string;
  completed: boolean;
  weight: number; // Points awarded for completing this check
}

export interface ProfileCompletenessResult {
  percentage: number; // 0-100
  completedChecks: number;
  totalChecks: number;
  checks: ProfileCompletenessCheck[];
  level: 'beginner' | 'intermediate' | 'advanced' | 'complete';
  nextAction?: string; // Suggestion for next action to complete
}

interface ProfileData {
  display_name?: string;
  username?: string;
  bio?: string;
  avatar_type?: 'default' | 'predefined' | 'custom';
  social_links?: {
    twitter?: string;
    farcaster?: string;
    discord?: string;
  };
  total_points?: number;
  stats?: {
    gamesPlayed?: number;
  };
}

/**
 * Calculate profile completeness based on user data
 */
export function calculateProfileCompleteness(
  profile: ProfileData,
  t?: (key: string) => string
): ProfileCompletenessResult {
  const checks: ProfileCompletenessCheck[] = [
    {
      id: 'display_name',
      label: t?.('profile.completion.displayName') || 'Nom affiché défini',
      description: t?.('profile.completion.displayNameDesc') || 'Ajoutez un nom d\'affichage personnalisé avec espaces et émojis',
      completed: !!(profile.display_name && profile.display_name !== profile.username),
      weight: 15,
    },
    {
      id: 'custom_avatar',
      label: t?.('profile.completion.customAvatar') || 'Avatar personnalisé',
      description: t?.('profile.completion.customAvatarDesc') || 'Choisissez un avatar prédéfini ou téléchargez le vôtre',
      completed: profile.avatar_type === 'predefined' || profile.avatar_type === 'custom',
      weight: 15,
    },
    {
      id: 'bio',
      label: t?.('profile.completion.bioFilled') || 'Bio renseignée',
      description: t?.('profile.completion.bioDesc') || 'Décrivez-vous en quelques mots (min. 20 caractères)',
      completed: !!(profile.bio && profile.bio.trim().length >= 20),
      weight: 15,
    },
    {
      id: 'social_link',
      label: t?.('profile.completion.socialLink') || 'Lien social ajouté',
      description: t?.('profile.completion.socialLinkDesc') || 'Ajoutez au moins un lien social (Twitter, Farcaster, Discord)',
      completed: !!(
        profile.social_links &&
        (profile.social_links.twitter ||
          profile.social_links.farcaster ||
          profile.social_links.discord)
      ),
      weight: 15,
    },
    {
      id: 'first_game',
      label: t?.('profile.completion.firstGame') || 'Premier jeu joué',
      description: t?.('profile.completion.firstGameDesc') || 'Jouez à votre premier jeu et gagnez des points',
      completed: !!(profile.stats?.gamesPlayed && profile.stats.gamesPlayed > 0),
      weight: 20,
    },
    {
      id: 'points_milestone',
      label: t?.('profile.completion.pointsMilestone') || '100 points atteints',
      description: t?.('profile.completion.pointsMilestoneDesc') || 'Atteignez 100 points en jouant aux jeux',
      completed: !!(profile.total_points && profile.total_points >= 100),
      weight: 20,
    },
  ];

  // Calculate completion
  const completedChecks = checks.filter((c) => c.completed).length;
  const totalChecks = checks.length;
  const totalWeight = checks.reduce((sum, check) => sum + check.weight, 0);
  const earnedWeight = checks
    .filter((c) => c.completed)
    .reduce((sum, check) => sum + check.weight, 0);

  const percentage = Math.round((earnedWeight / totalWeight) * 100);

  // Determine level
  let level: ProfileCompletenessResult['level'];
  if (percentage === 100) {
    level = 'complete';
  } else if (percentage >= 70) {
    level = 'advanced';
  } else if (percentage >= 40) {
    level = 'intermediate';
  } else {
    level = 'beginner';
  }

  // Find next action (first incomplete check)
  const nextIncompleteCheck = checks.find((c) => !c.completed);
  const nextAction = nextIncompleteCheck?.description;

  return {
    percentage,
    completedChecks,
    totalChecks,
    checks,
    level,
    nextAction,
  };
}

/**
 * Get level badge emoji and text
 */
export function getLevelBadge(
  level: ProfileCompletenessResult['level'],
  t?: (key: string) => string
): {
  emoji: string;
  text: string;
  color: string;
} {
  switch (level) {
    case 'complete':
      return { emoji: '🏆', text: t?.('profile.completion.levelComplete') || 'Profil Complet', color: 'text-yellow-600' };
    case 'advanced':
      return { emoji: '⭐', text: t?.('profile.completion.levelAdvanced') || 'Avancé', color: 'text-blue-600' };
    case 'intermediate':
      return { emoji: '📈', text: t?.('profile.completion.levelIntermediate') || 'Intermédiaire', color: 'text-green-600' };
    case 'beginner':
      return { emoji: '🌱', text: t?.('profile.completion.levelBeginner') || 'Débutant', color: 'text-gray-600' };
  }
}

/**
 * Get motivational message based on completion level
 */
export function getMotivationalMessage(percentage: number, t?: (key: string) => string): string {
  if (percentage === 100) {
    return t?.('profile.completion.msg100') || 'Félicitations! Votre profil est parfait! 🎉';
  } else if (percentage >= 80) {
    return t?.('profile.completion.msg80') || 'Excellent! Encore quelques détails et c\'est parfait!';
  } else if (percentage >= 60) {
    return t?.('profile.completion.msg60') || 'Très bien! Vous êtes sur la bonne voie!';
  } else if (percentage >= 40) {
    return t?.('profile.completion.msg40') || 'Bon début! Continuez à compléter votre profil!';
  } else if (percentage >= 20) {
    return t?.('profile.completion.msg20') || 'C\'est un début! Complétez quelques actions pour améliorer votre profil.';
  } else {
    return t?.('profile.completion.msg0') || 'Bienvenue! Commencez par compléter votre profil.';
  }
}
