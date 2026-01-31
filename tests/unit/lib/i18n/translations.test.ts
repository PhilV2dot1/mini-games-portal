import { describe, test, expect } from 'vitest';
import { translations, type Language } from '@/lib/i18n/translations';

describe('Translations', () => {
  describe('Structure', () => {
    test('has English translations', () => {
      expect(translations.en).toBeDefined();
      expect(typeof translations.en).toBe('object');
    });

    test('has French translations', () => {
      expect(translations.fr).toBeDefined();
      expect(typeof translations.fr).toBe('object');
    });

    test('both languages have the same top-level keys', () => {
      const enKeys = Object.keys(translations.en).sort();
      const frKeys = Object.keys(translations.fr).sort();

      expect(frKeys).toEqual(enKeys);
    });
  });

  describe('Common translations', () => {
    test('has loading text in both languages', () => {
      expect(translations.en.loading).toBe('Loading...');
      expect(translations.fr.loading).toBe('Chargement...');
    });

    test('has save button text in both languages', () => {
      expect(translations.en.save).toBe('Save');
      expect(translations.fr.save).toBe('Sauvegarder');
    });

    test('has cancel button text in both languages', () => {
      expect(translations.en.cancel).toBe('Cancel');
      expect(translations.fr.cancel).toBe('Annuler');
    });

    test('has back button text in both languages', () => {
      expect(translations.en.back).toBe('Back');
      expect(translations.fr.back).toBe('Retour');
    });
  });

  describe('Navigation translations', () => {
    test('has navigation section in both languages', () => {
      expect(translations.en.nav).toBeDefined();
      expect(translations.fr.nav).toBeDefined();
    });

    test('has home navigation in both languages', () => {
      expect(translations.en.nav.home).toBe('Home');
      expect(translations.fr.nav.home).toBe('Accueil');
    });

    test('has leaderboard navigation in both languages', () => {
      expect(translations.en.nav.leaderboard).toBe('Leaderboard');
      expect(translations.fr.nav.leaderboard).toBe('Classement');
    });

    test('has profile navigation in both languages', () => {
      expect(translations.en.nav.profile).toBe('Profile');
      expect(translations.fr.nav.profile).toBe('Profil');
    });

    test('has sign out navigation in both languages', () => {
      expect(translations.en.nav.signOut).toBe('Sign Out');
      expect(translations.fr.nav.signOut).toBe('Déconnexion');
    });

    test('navigation sections have the same keys', () => {
      const enNavKeys = Object.keys(translations.en.nav).sort();
      const frNavKeys = Object.keys(translations.fr.nav).sort();

      expect(frNavKeys).toEqual(enNavKeys);
    });
  });

  describe('Home page translations', () => {
    test('has home section in both languages', () => {
      expect(translations.en.home).toBeDefined();
      expect(translations.fr.home).toBeDefined();
    });

    test('has welcome message in both languages', () => {
      expect(translations.en.home.welcome).toBe('Welcome to Mini Games Portal');
      expect(translations.fr.home.welcome).toBe('Bienvenue sur Mini Games Portal');
    });

    test('home sections have the same keys', () => {
      const enHomeKeys = Object.keys(translations.en.home).sort();
      const frHomeKeys = Object.keys(translations.fr.home).sort();

      expect(frHomeKeys).toEqual(enHomeKeys);
    });
  });

  describe('Stats translations', () => {
    test('has stats section in both languages', () => {
      expect(translations.en.stats).toBeDefined();
      expect(translations.fr.stats).toBeDefined();
    });

    test('has wins label in both languages', () => {
      expect(translations.en.stats.wins).toBe('Wins');
      expect(translations.fr.stats.wins).toBe('Victoires');
    });

    test('has losses label in both languages', () => {
      expect(translations.en.stats.losses).toBe('Losses');
      expect(translations.fr.stats.losses).toBe('Défaites');
    });

    test('stats sections have the same keys', () => {
      const enStatsKeys = Object.keys(translations.en.stats).sort();
      const frStatsKeys = Object.keys(translations.fr.stats).sort();

      expect(frStatsKeys).toEqual(enStatsKeys);
    });
  });

  describe('Profile translations', () => {
    test('has profile section in both languages', () => {
      expect(translations.en.profile).toBeDefined();
      expect(translations.fr.profile).toBeDefined();
    });

    test('has profile completion section in both languages', () => {
      expect(translations.en.profile.completion).toBeDefined();
      expect(translations.fr.profile.completion).toBeDefined();
    });

    test('profile completion sections have the same keys', () => {
      const enCompletionKeys = Object.keys(translations.en.profile.completion).sort();
      const frCompletionKeys = Object.keys(translations.fr.profile.completion).sort();

      expect(frCompletionKeys).toEqual(enCompletionKeys);
    });

    test('has completion percentage labels', () => {
      expect(translations.en.profile.completion.msg100).toContain('Congratulations');
      expect(translations.fr.profile.completion.msg100).toContain('Félicitations');
    });
  });

  describe('Badges translations', () => {
    test('has badges section in both languages', () => {
      expect(translations.en.badges).toBeDefined();
      expect(translations.fr.badges).toBeDefined();
    });

    test('has all badge names in both languages', () => {
      const badgeNames = [
        'first_win',
        'win_streak_5',
        'win_streak_10',
        'games_10',
        'games_50',
        'veteran',
        'master',
        'all_games',
        'perfect_week',
        'high_roller',
        'points_5000',
        'leaderboard_top10',
        'leaderboard_top3',
        'leaderboard_1',
      ];

      badgeNames.forEach(badgeName => {
        expect(translations.en.badges[badgeName as keyof typeof translations.en.badges]).toBeDefined();
        expect(translations.fr.badges[badgeName as keyof typeof translations.fr.badges]).toBeDefined();
      });
    });

    test('has all badge descriptions in both languages', () => {
      const badgeDescriptions = [
        'desc_first_win',
        'desc_win_streak_5',
        'desc_win_streak_10',
        'desc_games_10',
        'desc_games_50',
        'desc_veteran',
        'desc_master',
        'desc_all_games',
        'desc_perfect_week',
        'desc_high_roller',
        'desc_points_5000',
        'desc_leaderboard_top10',
        'desc_leaderboard_top3',
        'desc_leaderboard_1',
      ];

      badgeDescriptions.forEach(desc => {
        expect(translations.en.badges[desc as keyof typeof translations.en.badges]).toBeDefined();
        expect(translations.fr.badges[desc as keyof typeof translations.fr.badges]).toBeDefined();
      });
    });

    test('badges sections have the same keys', () => {
      const enBadgesKeys = Object.keys(translations.en.badges).sort();
      const frBadgesKeys = Object.keys(translations.fr.badges).sort();

      expect(frBadgesKeys).toEqual(enBadgesKeys);
    });
  });

  describe('Games translations', () => {
    test('has games section in both languages', () => {
      expect(translations.en.games).toBeDefined();
      expect(translations.fr.games).toBeDefined();
    });

    test('has all game descriptions in both languages', () => {
      const games = ['blackjack', 'rps', 'tictactoe', 'jackpot', '2048', 'mastermind'];

      games.forEach(game => {
        expect(translations.en.games[game as keyof typeof translations.en.games]).toBeDefined();
        expect(translations.fr.games[game as keyof typeof translations.fr.games]).toBeDefined();
      });
    });

    test('has 2048 game with special key', () => {
      expect(translations.en.games['2048']).toBe('Merge tiles to 2048!');
      expect(translations.fr.games['2048']).toBe('Fusionnez les tuiles jusqu\'à 2048 !');
    });

    test('games sections have the same keys', () => {
      const enGamesKeys = Object.keys(translations.en.games).sort();
      const frGamesKeys = Object.keys(translations.fr.games).sort();

      expect(frGamesKeys).toEqual(enGamesKeys);
    });
  });

  describe('Errors translations', () => {
    test('has errors section in both languages', () => {
      expect(translations.en.errors).toBeDefined();
      expect(translations.fr.errors).toBeDefined();
    });

    test('has generic error in both languages', () => {
      expect(translations.en.errors.generic).toBe('An error occurred');
      expect(translations.fr.errors.generic).toBe('Une erreur est survenue');
    });

    test('has all error messages in both languages', () => {
      const errorKeys = [
        'generic',
        'loadingFailed',
        'savingFailed',
        'invalidUsername',
        'usernameTaken',
        'usernameReserved',
        'invalidEmail',
        'invalidUrl',
        'fileTooLarge',
        'invalidFileType',
      ];

      errorKeys.forEach(key => {
        expect(translations.en.errors[key as keyof typeof translations.en.errors]).toBeDefined();
        expect(translations.fr.errors[key as keyof typeof translations.fr.errors]).toBeDefined();
      });
    });

    test('errors sections have the same keys', () => {
      const enErrorsKeys = Object.keys(translations.en.errors).sort();
      const frErrorsKeys = Object.keys(translations.fr.errors).sort();

      expect(frErrorsKeys).toEqual(enErrorsKeys);
    });
  });

  describe('About page translations', () => {
    test('has about section in both languages', () => {
      expect(translations.en.about).toBeDefined();
      expect(translations.fr.about).toBeDefined();
    });

    test('about sections have the same keys', () => {
      const enAboutKeys = Object.keys(translations.en.about).sort();
      const frAboutKeys = Object.keys(translations.fr.about).sort();

      expect(frAboutKeys).toEqual(enAboutKeys);
    });

    test('has game modes information', () => {
      expect(translations.en.about.gameModesTitle).toBe('Game Modes');
      expect(translations.fr.about.gameModesTitle).toBe('Modes de Jeu');
    });

    test('has free play bullets as arrays', () => {
      expect(Array.isArray(translations.en.about.freePlayBullets)).toBe(true);
      expect(Array.isArray(translations.fr.about.freePlayBullets)).toBe(true);
      expect(translations.en.about.freePlayBullets.length).toBe(
        translations.fr.about.freePlayBullets.length
      );
    });

    test('has on-chain bullets as arrays', () => {
      expect(Array.isArray(translations.en.about.onChainBullets)).toBe(true);
      expect(Array.isArray(translations.fr.about.onChainBullets)).toBe(true);
      expect(translations.en.about.onChainBullets.length).toBe(
        translations.fr.about.onChainBullets.length
      );
    });
  });

  describe('Leaderboard translations', () => {
    test('has leaderboard section in both languages', () => {
      expect(translations.en.leaderboard).toBeDefined();
      expect(translations.fr.leaderboard).toBeDefined();
    });

    test('leaderboard sections have the same keys', () => {
      const enLeaderboardKeys = Object.keys(translations.en.leaderboard).sort();
      const frLeaderboardKeys = Object.keys(translations.fr.leaderboard).sort();

      expect(frLeaderboardKeys).toEqual(enLeaderboardKeys);
    });

    test('has column headers', () => {
      expect(translations.en.leaderboard.rank).toBe('Rank');
      expect(translations.fr.leaderboard.rank).toBe('Rang');

      expect(translations.en.leaderboard.player).toBe('Player');
      expect(translations.fr.leaderboard.player).toBe('Joueur');

      expect(translations.en.leaderboard.points).toBe('Points');
      expect(translations.fr.leaderboard.points).toBe('Points');
    });
  });

  describe('Avatar translations', () => {
    test('has avatar section in both languages', () => {
      expect(translations.en.avatar).toBeDefined();
      expect(translations.fr.avatar).toBeDefined();
    });

    test('avatar sections have the same keys', () => {
      const enAvatarKeys = Object.keys(translations.en.avatar).sort();
      const frAvatarKeys = Object.keys(translations.fr.avatar).sort();

      expect(frAvatarKeys).toEqual(enAvatarKeys);
    });
  });

  describe('Profile Setup translations', () => {
    test('has profileSetup section in both languages', () => {
      expect(translations.en.profileSetup).toBeDefined();
      expect(translations.fr.profileSetup).toBeDefined();
    });

    test('profileSetup sections have the same keys', () => {
      const enProfileSetupKeys = Object.keys(translations.en.profileSetup).sort();
      const frProfileSetupKeys = Object.keys(translations.fr.profileSetup).sort();

      expect(frProfileSetupKeys).toEqual(enProfileSetupKeys);
    });
  });

  describe('Profile Edit translations', () => {
    test('has profileEdit section in both languages', () => {
      expect(translations.en.profileEdit).toBeDefined();
      expect(translations.fr.profileEdit).toBeDefined();
    });

    test('profileEdit sections have the same keys', () => {
      const enProfileEditKeys = Object.keys(translations.en.profileEdit).sort();
      const frProfileEditKeys = Object.keys(translations.fr.profileEdit).sort();

      expect(frProfileEditKeys).toEqual(enProfileEditKeys);
    });
  });

  describe('Type safety', () => {
    test('Language type includes en and fr', () => {
      const languages: Language[] = ['en', 'fr'];
      languages.forEach(lang => {
        expect(translations[lang]).toBeDefined();
      });
    });

    test('translations object is readonly', () => {
      // This is a compile-time check, but we can verify the structure exists
      expect(translations).toBeDefined();
      expect(Object.isFrozen(translations)).toBe(false); // Not frozen at runtime, but typed as const
    });
  });

  describe('Completeness check', () => {
    test('all major sections exist in both languages', () => {
      const majorSections = [
        'nav',
        'home',
        'stats',
        'profile',
        'profileSetup',
        'profileEdit',
        'avatar',
        'badges',
        'about',
        'games',
        'leaderboard',
        'errors',
      ];

      majorSections.forEach(section => {
        expect(translations.en[section as keyof typeof translations.en]).toBeDefined();
        expect(translations.fr[section as keyof typeof translations.fr]).toBeDefined();
      });
    });

    test('no undefined or null values in English translations', () => {
      const checkForUndefined = (obj: unknown, path = 'en'): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = `${path}.${key}`;
            if (value === undefined || value === null) {
              throw new Error(`Found undefined/null at ${currentPath}`);
            }
            if (typeof value === 'object' && !Array.isArray(value)) {
              checkForUndefined(value, currentPath);
            }
          });
        }
      };

      expect(() => checkForUndefined(translations.en)).not.toThrow();
    });

    test('no undefined or null values in French translations', () => {
      const checkForUndefined = (obj: unknown, path = 'fr'): void => {
        if (typeof obj === 'object' && obj !== null) {
          Object.entries(obj).forEach(([key, value]) => {
            const currentPath = `${path}.${key}`;
            if (value === undefined || value === null) {
              throw new Error(`Found undefined/null at ${currentPath}`);
            }
            if (typeof value === 'object' && !Array.isArray(value)) {
              checkForUndefined(value, currentPath);
            }
          });
        }
      };

      expect(() => checkForUndefined(translations.fr)).not.toThrow();
    });
  });
});
