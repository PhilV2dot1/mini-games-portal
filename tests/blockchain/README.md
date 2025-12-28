# Tests Blockchain - Alfajores Testnet

Ce dossier contient les tests blockchain pour les smart contracts déployés sur le testnet Alfajores de Celo.

## ⚠️ Important

**Ces tests interagissent avec de vrais smart contracts sur Alfajores testnet.**
- Les tests de lecture (`read`) n'ont pas besoin de CELO
- Les tests d'écriture (`write`) nécessitent du CELO testnet pour le gas
- Aucune transaction n'est envoyée sur le mainnet

## Structure

```
tests/blockchain/
├── setup/
│   └── test-wallet.ts        # Configuration wallet de test
├── helpers/
│   └── contract-helpers.ts   # Helpers pour interactions contrats
└── contracts/
    ├── blackjack.read.test.ts     # Tests lecture Blackjack
    ├── blackjack.write.test.ts    # Tests écriture Blackjack
    ├── event-parsing.test.ts      # Tests parsing events
    └── chain-validation.test.ts   # Tests validation réseau
```

## Prérequis

### 1. Variables d'environnement

Créer un fichier `.env.test` (déjà existant) :

```bash
TEST_WALLET_PRIVATE_KEY=0x...  # Clé privée du wallet de test
TEST_WALLET_ADDRESS=0x...      # Adresse du wallet de test
```

**⚠️ IMPORTANT:** Utilisez un wallet de TEST uniquement. Ne JAMAIS utiliser un wallet avec de vrais fonds.

### 2. Obtenir du CELO testnet

Pour exécuter les tests d'écriture, le wallet doit avoir du CELO Alfajores :

1. Aller sur https://faucet.celo.org
2. Entrer l'adresse du wallet de test
3. Demander des tokens testnet
4. Attendre la confirmation (~30 secondes)

**Montant recommandé:** Au moins 0.1 CELO pour ~100 transactions

### 3. Installer les dépendances

```bash
npm install
```

## Exécution des tests

### Tous les tests blockchain

```bash
npm run test:blockchain
```

### Tests par catégorie

```bash
# Tests de lecture uniquement (pas besoin de CELO)
npx vitest run tests/blockchain/contracts/blackjack.read.test.ts

# Tests d'écriture (nécessite CELO)
npx vitest run tests/blockchain/contracts/blackjack.write.test.ts

# Tests parsing events
npx vitest run tests/blockchain/contracts/event-parsing.test.ts

# Tests validation réseau
npx vitest run tests/blockchain/contracts/chain-validation.test.ts
```

### Mode watch

```bash
npx vitest tests/blockchain --watch
```

## Tests disponibles

### 1. Chain Validation (`chain-validation.test.ts`)

Tests de validation du réseau et des contrats :
- ✅ Connexion à Alfajores (pas mainnet)
- ✅ Chain ID correct (44787)
- ✅ Production de blocs active
- ✅ RPC endpoint accessible
- ✅ Tous les contrats déployés
- ✅ Adresses de contrats valides
- ✅ Gas price raisonnable
- ✅ Capabilities RPC disponibles

**13 tests** de validation réseau.

### 2. Blackjack Read (`blackjack.read.test.ts`)

Tests de lecture du contrat Blackjack :
- ✅ Contrat déployé sur Alfajores
- ✅ `getStats()` retourne structure correcte
- ✅ Tous les champs de stats présents
- ✅ Types corrects (bigint)
- ✅ Valeurs non-négatives
- ✅ TotalGames = wins + losses + pushes
- ✅ Blackjacks ≤ wins
- ✅ WinRate entre 0 et 100
- ✅ Stats nouvelles adresses = 0
- ✅ Lecture cohérente
- ✅ Balance contrat accessible

**14 tests** de lecture.

**Aucun CELO requis** - Ces tests ne font que lire la blockchain.

### 3. Blackjack Write (`blackjack.write.test.ts`)

Tests d'écriture (transactions) :
- ✅ Transaction `playGame()` réussit
- ✅ Transaction minée avec succès
- ✅ Résultat de jeu valide
- ✅ Stats mises à jour après partie
- ✅ Outcome valide (win/lose/push/blackjack)
- ✅ Cartes joueur valides (2-52)
- ✅ Cartes dealer valides
- ✅ Totaux de cartes corrects
- ✅ Plusieurs parties séquentielles
- ✅ Win incrémente stats
- ✅ Coût gas raisonnable (< 0.01 CELO)
- ✅ Balance contrat stable
- ✅ Gas utilisé < 1M
- ✅ Block number avance

**15 tests** d'écriture.

**⚠️ Nécessite CELO testnet** - Ces tests seront SKIPPED si balance insuffisante.

### 4. Event Parsing (`event-parsing.test.ts`)

Tests de parsing des events blockchain :
- ✅ Event `GamePlayed` émis
- ✅ Données event correctes
- ✅ Adresse joueur correspond
- ✅ Cartes joueur array valide
- ✅ Cartes dealer array valide
- ✅ Total joueur valide
- ✅ Total dealer valide
- ✅ Outcome string valide
- ✅ Parsing cohérent multi-parties
- ✅ Indexed player dans logs
- ✅ Événements multiples parsés
- ✅ Raw logs correspondent à parsed data

**14 tests** de parsing events.

**⚠️ Nécessite CELO testnet** - Même logique que write tests.

## Contrats testés

| Contrat | Adresse Alfajores | Tests |
|---------|------------------|-------|
| **Blackjack** | `0x6cb9971850767026feBCb4801c0b8a946F28C9Ec` | ✅ Complets |
| **RPS** | `0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49` | ⏳ Helpers créés |
| **TicTacToe** | `0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881` | ⏳ Helpers créés |
| **Jackpot** | `0x07Bc49E8A2BaF7c68519F9a61FCD733490061644` | ⏳ Helpers créés |
| **2048** | `0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1` | ⏳ Helpers créés |
| **Mastermind** | `0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9` | ⏳ Helpers créés |

## Configuration

### Test Wallet Setup

Le fichier `setup/test-wallet.ts` configure :
- **Account** : Créé depuis private key
- **Public Client** : Pour read operations
- **Wallet Client** : Pour write operations
- **Chain** : Celo Alfajores (44787)
- **RPC** : https://alfajores-forno.celo-testnet.org

### Helpers disponibles

Le fichier `helpers/contract-helpers.ts` fournit :

```typescript
// Blackjack
getBlackjackStats(address?)        // Lire stats
playBlackjackGame()                // Jouer partie
parseGamePlayedEvent(logs)         // Parser event

// RPS
getRPSStats(address?)              // Lire stats
playRPSGame(choice)                // Jouer (0=rock, 1=paper, 2=scissors)

// Mastermind
getMastermindStats(address?)       // Lire stats

// Utilitaires
getContractBalance(address)        // Balance contrat
isTransactionMined(hash)           // Vérifier si miné
getEventLogs(address, abi, ...)    // Récupérer logs
estimateContractGas(...)           // Estimer gas
isContractDeployed(address)        // Vérifier déploiement
waitForTransactions(hashes)        // Attendre plusieurs txs
```

## Gestion des erreurs

### Balance insuffisante

Si le wallet n'a pas assez de CELO :
```
⚠️  SKIPPING WRITE TESTS - Insufficient CELO balance
   Fund wallet at: https://faucet.celo.org
   Address: 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
```

**Solution :**
1. Aller sur https://faucet.celo.org
2. Entrer l'adresse affichée
3. Demander des tokens
4. Relancer les tests après 30 secondes

### Mauvais réseau

Si connecté au mauvais réseau :
```
⚠️  Not connected to Alfajores testnet
   These tests will be skipped
```

**Solution :** Vérifier la configuration RPC dans `test-wallet.ts`

### Timeout

Si les transactions timeout après 60 secondes :
- Le réseau Alfajores peut être congestionné
- Augmenter le timeout dans les tests
- Réessayer plus tard

## Sécurité

### ✅ Bonnes pratiques

- ✅ Wallet de test dédié (pas de vrais fonds)
- ✅ Connexion Alfajores uniquement (vérification chain ID)
- ✅ Pas de private key hardcodée dans le code
- ✅ Private key dans .env.test (gitignored)
- ✅ Warnings si connecté à mainnet

### ❌ À NE JAMAIS FAIRE

- ❌ Utiliser un wallet avec de vrais fonds
- ❌ Commiter le .env.test avec vraie private key
- ❌ Exécuter ces tests sur mainnet
- ❌ Partager la private key du wallet de test

## Timeouts

Les tests blockchain ont des timeouts adaptés :

- **Read tests** : 10 secondes (défaut Vitest)
- **Write tests** : 90 secondes par transaction
- **Multi-game tests** : 180-300 secondes

Les timeouts tiennent compte de :
- Temps de minage (~5 secondes/block Celo)
- Latence RPC
- Confirmation des transactions

## CI/CD

Dans GitHub Actions, les tests blockchain sont :
- ✅ Exécutés uniquement sur `master` (pas sur PRs)
- ✅ Avec wallet de test dédié (secret GitHub)
- ✅ Read tests toujours exécutés
- ✅ Write tests seulement si balance suffisante

Configuration `.github/workflows/test.yml` :
```yaml
blockchain-tests:
  runs-on: ubuntu-latest
  if: github.event_name == 'push' && github.ref == 'refs/heads/master'
  steps:
    - name: Run blockchain tests
      run: npm run test:blockchain
      env:
        TEST_WALLET_PRIVATE_KEY: ${{ secrets.TEST_WALLET_PRIVATE_KEY }}
```

## Monitoring

### Vérifier balance wallet

```typescript
import { getTestWalletBalance } from './setup/test-wallet';

const balance = await getTestWalletBalance();
console.log(`Balance: ${balance.toFixed(4)} CELO`);
```

### Explorer transactions

Toutes les transactions sont visibles sur :
https://alfajores.celoscan.io/address/0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf

### Logs détaillés

Les tests affichent :
- ✅ Balance du wallet au démarrage
- ⚠️ Warnings si balance faible
- ⏭️ Skip messages si tests sautés
- 📊 Résumé des tests exécutés/skip

## Développement

### Ajouter tests pour nouveau contrat

1. Créer `helpers` dans `contract-helpers.ts` :
```typescript
export async function getNewContractStats(address) {
  // ...
}

export async function playNewContractGame() {
  // ...
}
```

2. Créer fichier de tests :
```typescript
// tests/blockchain/contracts/newcontract.read.test.ts
import { getNewContractStats } from '../helpers/contract-helpers';

describe('NewContract - Read', () => {
  test('getStats should work', async () => {
    const stats = await getNewContractStats();
    expect(stats).toBeDefined();
  });
});
```

3. Ajouter tests write si applicable

### Déboguer

Mode verbose :
```bash
npx vitest tests/blockchain --reporter=verbose
```

Voir les logs blockchain :
```typescript
const { receipt } = await playBlackjackGame();
console.log('Transaction:', receipt);
console.log('Logs:', receipt.logs);
```

## Ressources

- **Faucet Alfajores** : https://faucet.celo.org
- **Explorer Alfajores** : https://alfajores.celoscan.io
- **Celo Docs** : https://docs.celo.org
- **Viem Docs** : https://viem.sh
- **Wagmi Docs** : https://wagmi.sh

## Limitations

1. **Rate limiting** : Le faucet limite à 1 requête toutes les 24h
2. **Gas fluctuations** : Les coûts gas peuvent varier
3. **Network congestion** : Alfajores peut ralentir aux heures de pointe
4. **Faucet availability** : Le faucet peut être temporairement indisponible

## Support

Si problèmes avec les tests blockchain :

1. Vérifier balance wallet
2. Vérifier connexion Alfajores
3. Vérifier contrats déployés
4. Voir les logs détaillés
5. Créer une issue GitHub avec logs

## Prochaines étapes

- [ ] Tests pour les 5 autres contrats (RPS, TicTacToe, etc.)
- [ ] Tests de gas optimization
- [ ] Tests de concurrent transactions
- [ ] Tests de edge cases spécifiques à chaque jeu
- [ ] Monitoring automatique balance wallet
- [ ] Auto-refill depuis faucet si balance faible
