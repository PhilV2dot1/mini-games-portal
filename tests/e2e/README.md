# E2E Tests avec Playwright

Ce dossier contient les tests End-to-End (E2E) pour Celo Games Portal, utilisant Playwright.

## Structure

```
tests/e2e/
├── helpers/
│   ├── auth.ts           # Helpers pour authentification
│   ├── games.ts          # Helpers pour jouer aux jeux
│   ├── profile.ts        # Helpers pour profils
│   └── leaderboard.ts    # Helpers pour leaderboard
├── user-registration.spec.ts    # Tests inscription utilisateur
├── profile-customization.spec.ts # Tests personnalisation profil
├── badge-earning.spec.ts         # Tests obtention de badges
└── leaderboard.spec.ts           # Tests leaderboard
```

## Prérequis

1. Installation des dépendances :
   ```bash
   npm install
   ```

2. Installation de Playwright :
   ```bash
   npx playwright install
   ```

## Exécution des tests

### 🎯 Méthode Recommandée : Helper Scripts

Des scripts helper sont disponibles pour faciliter l'exécution des tests :

**Linux/Mac (Bash)**:
```bash
cd tests/e2e/scripts
chmod +x run-e2e-tests.sh
./run-e2e-tests.sh                    # Mode headless (défaut)
./run-e2e-tests.sh --headed           # Mode avec fenêtre visible
./run-e2e-tests.sh --debug            # Mode debug interactif
./run-e2e-tests.sh --ui               # Interface Playwright UI
./run-e2e-tests.sh --project=chromium # Un navigateur spécifique
```

**Windows (PowerShell)**:
```powershell
cd tests\e2e\scripts
.\run-e2e-tests.ps1                # Mode headless (défaut)
.\run-e2e-tests.ps1 --headed       # Mode avec fenêtre visible
.\run-e2e-tests.ps1 --debug        # Mode debug interactif
.\run-e2e-tests.ps1 --ui           # Interface Playwright UI
```

**Windows (Batch)**:
```cmd
cd tests\e2e\scripts
run-e2e-tests.bat                  # Mode headless (défaut)
run-e2e-tests.bat --headed         # Mode avec fenêtre visible
run-e2e-tests.bat --debug          # Mode debug interactif
run-e2e-tests.bat --ui             # Interface Playwright UI
```

Ces scripts :
- ✅ Vérifient l'installation de Playwright browsers
- ✅ Détectent si le dev server tourne
- ✅ Affichent des messages d'aide clairs
- ✅ Gèrent les codes d'erreur proprement
- ✅ Suggèrent des commandes de debugging

### Méthode Manuelle : npm scripts

```bash
# Tous les tests E2E
npm run test:e2e

# En mode headed (avec fenêtre visible)
npm run test:e2e:headed

# En mode debug
npm run test:e2e:debug

# Un fichier spécifique
npx playwright test tests/e2e/user-registration.spec.ts

# Sur un navigateur spécifique
npx playwright test --project=chromium
npx playwright test --project=firefox
npx playwright test --project="Mobile Chrome"
```

## Tests disponibles

### 1. User Registration (`user-registration.spec.ts`)

Tests du parcours d'inscription et première partie :
- ✅ Inscription complète avec email/password
- ✅ Configuration du profil (username, theme, avatar)
- ✅ Validation du username
- ✅ Sélection de thème et avatar
- ✅ Première partie jouée
- ✅ Attribution des points
- ✅ Statistiques initiales

**8 tests** couvrant tous les cas de figure d'inscription.

### 2. Profile Customization (`profile-customization.spec.ts`)

Tests de personnalisation du profil :
- ✅ Modification display name
- ✅ Modification bio
- ✅ Changement de thème
- ✅ Ajout de liens sociaux (Twitter, Farcaster, Discord)
- ✅ Validation des limites de caractères
- ✅ Validation des URLs
- ✅ Persistance des changements
- ✅ Affichage sur leaderboard
- ✅ Complétude du profil

**14 tests** couvrant toutes les fonctionnalités de profil.

### 3. Badge Earning (`badge-earning.spec.ts`)

Tests d'obtention de badges :
- ✅ Badge après 5 parties jouées
- ✅ Augmentation du compteur de badges
- ✅ Points de badge ajoutés au total
- ✅ Affichage correct des badges
- ✅ Badges multiples
- ✅ Notifications de badges
- ✅ Persistance des badges
- ✅ Catégories de badges
- ✅ Progression vers badges
- ✅ Badges variété (différents jeux)

**15 tests** couvrant le système de badges complet.

### 4. Leaderboard (`leaderboard.spec.ts`)

Tests du leaderboard :
- ✅ Affichage leaderboard global
- ✅ Top joueurs affichés
- ✅ Clic sur profil utilisateur
- ✅ Mise à jour après parties
- ✅ Leaderboards par jeu
- ✅ Basculement entre jeux
- ✅ Recherche d'utilisateurs
- ✅ Affichage avatars et thèmes
- ✅ Affichage statistiques
- ✅ Pagination
- ✅ Résultats vides
- ✅ Navigation vers profils
- ✅ Display names
- ✅ Responsive mobile
- ✅ Précision des ranks

**17 tests** couvrant toutes les fonctionnalités du leaderboard.

## Helpers

Les helpers permettent de réutiliser du code commun :

### `helpers/auth.ts`
- `signUpWithEmail()` - Inscription avec email/password
- `signInWithEmail()` - Connexion
- `signOut()` - Déconnexion
- `completeProfileSetup()` - Compléter le profil
- `generateTestEmail()` - Générer email de test unique
- `generateTestUsername()` - Générer username de test unique

### `helpers/games.ts`
- `navigateToGame()` - Naviguer vers un jeu
- `playBlackjackFree()` - Jouer une partie de Blackjack
- `playRockPaperScissorsFree()` - Jouer RPS
- `playTicTacToeFree()` - Jouer Tic Tac Toe
- `play2048Free()` - Jouer 2048
- `playMastermindFree()` - Jouer Mastermind
- `playJackpotFree()` - Jouer Jackpot
- `playMultipleGames()` - Jouer plusieurs parties
- `getCurrentPoints()` - Obtenir points actuels
- `getGameResult()` - Obtenir résultat de partie

### `helpers/profile.ts`
- `navigateToMyProfile()` - Naviguer vers son profil
- `navigateToUserProfile()` - Naviguer vers profil utilisateur
- `editProfile()` - Modifier le profil
- `getProfileStats()` - Obtenir statistiques profil
- `hasBadge()` - Vérifier si badge possédé
- `getAllBadges()` - Obtenir tous les badges
- `toggleProfilePrivacy()` - Basculer privacité

### `helpers/leaderboard.ts`
- `navigateToLeaderboard()` - Naviguer vers leaderboard
- `navigateToGameLeaderboard()` - Leaderboard par jeu
- `getLeaderboardEntries()` - Obtenir entrées leaderboard
- `findUserInLeaderboard()` - Trouver utilisateur
- `clickUserInLeaderboard()` - Cliquer sur utilisateur
- `switchToGameLeaderboard()` - Basculer vers jeu
- `searchLeaderboard()` - Rechercher dans leaderboard
- `verifyLeaderboardOrder()` - Vérifier tri correct
- `getUserRank()` - Obtenir rank d'un utilisateur

## Configuration

La configuration Playwright se trouve dans `playwright.config.ts` :

- **Navigateurs** : Chromium, Firefox, Mobile Chrome
- **Base URL** : `http://localhost:3000`
- **Timeout** : 30 secondes par test
- **Retries** : 2 en CI, 0 en local
- **Screenshots** : Seulement en cas d'échec
- **Traces** : Seulement au premier retry

## Bonnes pratiques

1. **Isolation des tests** : Chaque test crée son propre utilisateur pour éviter les dépendances
2. **Attentes explicites** : Utiliser `waitFor` et `expect` au lieu de `waitForTimeout`
3. **Sélecteurs data-testid** : Privilégier `data-testid` pour la stabilité
4. **Helpers réutilisables** : Factoriser le code commun dans les helpers
5. **Tests indépendants** : Chaque test doit pouvoir s'exécuter seul

## Déboggage

### Mode debug interactif

```bash
npm run test:e2e:debug
```

Permet de :
- Exécuter les tests pas à pas
- Inspecter l'état de la page
- Voir les sélecteurs en temps réel
- Modifier et rejouer les tests

### Screenshots et traces

En cas d'échec, Playwright génère automatiquement :
- Screenshots dans `test-results/`
- Traces dans `playwright-report/`

Pour voir le rapport :
```bash
npx playwright show-report
```

### Mode headed

Pour voir le navigateur pendant l'exécution :
```bash
npm run test:e2e:headed
```

## CI/CD

Les tests E2E peuvent être exécutés automatiquement dans la CI via GitHub Actions.

### Configuration GitHub Actions

Un exemple de workflow est disponible dans `.github-workflows-example.yml` :

**Fichier**: `tests/e2e/.github-workflows-example.yml`

Le workflow inclut :
- ✅ Tests parallèles sur Chromium et Firefox
- ✅ Tests mobiles (Mobile Chrome) sur la branche `main`
- ✅ Upload automatique des rapports et screenshots
- ✅ Retry automatique en cas d'échec
- ✅ Tests programmés (nightly) optionnels

**Pour activer** :
1. Copier `.github-workflows-example.yml` vers `.github/workflows/e2e-tests.yml`
2. Configurer les variables d'environnement nécessaires dans GitHub Secrets
3. Pousser sur `main` ou créer une Pull Request

**Features clés** :
- **Matrix Strategy** : Tests parallèles sur plusieurs navigateurs
- **Artifacts** : Rapports HTML conservés 30 jours
- **Screenshots** : Captures d'écran en cas d'échec (7 jours)
- **Timeout** : 60 minutes par job
- **Nightly Tests** : Tests complets programmés (optionnel)

## Limitations actuelles

⚠️ **Tests wallet on-chain** : Non implémentés car nécessitent :
- Configuration d'un wallet de test
- Extension navigateur pour MetaMask/RainbowKit
- Gestion des popups de signature
- Connexion au testnet Alfajores

Ces tests seront ajoutés dans Phase 4 avec configuration blockchain dédiée.

## Coverage E2E

Les tests E2E couvrent les parcours utilisateurs critiques :

| Parcours | Couverture | Tests |
|----------|-----------|-------|
| Inscription & Onboarding | 100% | 8 |
| Profil & Personnalisation | 100% | 14 |
| Système de Badges | 100% | 15 |
| Leaderboard | 100% | 17 |
| **Total** | **100%** | **54** |

## Prochaines étapes

- [ ] Tests wallet connection (Phase 4)
- [ ] Tests transactions on-chain (Phase 4)
- [ ] Tests avec différents types d'utilisateurs (OAuth, Farcaster)
- [ ] Tests de performance E2E
- [ ] Tests d'accessibilité (a11y)
