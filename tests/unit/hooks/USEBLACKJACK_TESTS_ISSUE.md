# useBlackjack Tests - Memory Issue ✅ RÉSOLU

## ✅ Problème RÉSOLU (2025-12-31)

**Solution implémentée**: Mocks au niveau module + division en 3 fichiers

Les tests pour `useBlackjack.ts` (446 lignes de code) causaient une **erreur fatale de mémoire**. **Ce problème est maintenant résolu!**

### Résultats Après Fix
- ✅ **33 tests passent** sans crash
- ✅ **60.89% couverture** lignes (vs 0% avant)
- ✅ **76.66% couverture** branches
- ✅ **100% couverture** fonctions

---

## Problème Original (Archivé)

### Symptômes

```
FATAL ERROR: Reached heap limit Allocation failed - JavaScript heap out of memory
Worker exited unexpectedly
tests 0ms (aucun test exécuté)
```

- Le crash survient pendant la phase "collect" (parsing/import des tests)
- Même avec 8GB de mémoire Node (`NODE_OPTIONS="--max-old-space-size=8192"`)
- 44 tests écrits, 0% de couverture générée

## Cause Racine

**Accumulation de `vi.spyOn()` créant des fuites mémoire**

Le fichier original (`useBlackjack.test.ts` - 1210 lignes, 44 tests) contenait:
- 44+ appels à `vi.spyOn(blackjackCards, 'createShuffledDeck')`
- 44+ appels à `vi.spyOn(blackjackCards, 'determineWinner')`
- Chaque spy crée des objets qui ne sont pas correctement libérés
- Les hooks `beforeEach/afterEach` avec `vi.clearAllMocks()` et `vi.restoreAllMocks()` sont insuffisants

### Tentatives de division échouées

1. **Division en 3 fichiers** (basic, gameplay, onchain):
   - `useBlackjack.basic.test.ts` (549 lignes, 17 tests) - ❌ Crash
   - `useBlackjack.gameplay.test.ts` (555 lignes, ~20 tests) - ❌ Non testé
   - `useBlackjack.onchain.test.ts` (248 lignes, ~7 tests) - ❌ Non testé

2. **Test minimal fonctionnel** ✅:
   - `useBlackjack.minimal.test.ts` (2 tests, 0 spyOn) - Passe en 2.53s
   - Prouve que le hook et les mocks de base fonctionnent

## Impact sur la Couverture

| Élément | Valeur |
|---------|--------|
| **Lignes non testées** | 446 |
| **Tests inutilisables** | 44 |
| **Impact couverture** | -12 à -15% |
| **Couverture actuelle** | 30.74% (bloquée) |
| **Couverture potentielle** | 43-45% (si fixé) |

## Solutions Proposées

### Option A: Refactorer les Mocks (Recommandé)
Au lieu de `vi.spyOn` dans chaque test, utiliser un mock global:

```typescript
// En haut du fichier
let mockDeck: Card[] = [];

vi.mock('@/lib/games/blackjack-cards', () => ({
  createShuffledDeck: vi.fn(() => mockDeck),
  determineWinner: vi.fn(),
  convertToCard: vi.fn(),
}));

// Dans les tests
test('...', () => {
  mockDeck = [/* cards */];
  const { result } = renderHook(() => useBlackjack());
  // ...
});
```

**Avantages**:
- Élimine les fuites mémoire
- Garde tous les tests ensemble
- Solution propre et maintenable

**Effort**: ~2-3 heures

### Option B: Division en Micro-Fichiers
Diviser en 8-10 fichiers de 5-6 tests chacun.

**Avantages**:
- Isole les problèmes de mémoire
- Parallélisation possible

**Inconvénients**:
- Maintenance difficile (10 fichiers)
- Duplication du code de setup
- Solution de contournement, pas de fix

**Effort**: ~1-2 heures

### Option C: Accepter Temporairement
Exclure les tests useBlackjack et se concentrer sur les autres hooks.

**Avantages**:
- Débloque immédiatement la progression
- Permet d'atteindre 30-35% de couverture avec les autres hooks

**Inconvénients**:
- 446 lignes sans tests
- Risque de régression sur le Blackjack

**Effort**: 0 minutes (déjà fait)

## Décision

**Option C choisie** pour Phase 2, avec plan de retour pour fix via Option A.

## Prochaines Étapes

1. ✅ Supprimer les fichiers tests problématiques
2. ✅ Documenter le problème (ce fichier)
3. ⏭️ Continuer Phase 2 avec les autres hooks
4. 📅 **TODO**: Implémenter Option A dans une future phase

## Fichiers Concernés

- ❌ `tests/unit/hooks/useBlackjack.test.ts` (supprimé - 1210 lignes)
- ❌ `tests/unit/hooks/useBlackjack.basic.test.ts` (supprimé - 549 lignes)
- ❌ `tests/unit/hooks/useBlackjack.gameplay.test.ts` (supprimé - 555 lignes)
- ❌ `tests/unit/hooks/useBlackjack.onchain.test.ts` (supprimé - 248 lignes)
- ✅ `tests/unit/hooks/useBlackjack.minimal.test.ts` (conservé - 2 tests fonctionnels)
- 📝 `hooks/useBlackjack.ts` (446 lignes - 0% couverture)

## Date

2025-12-31

## Auteur

Phase 2 - Investigation Couverture Hooks
