# Smart Contracts Documentation

This document provides detailed information about all smart contracts deployed on Celo Alfajores testnet for the Celo Games Portal.

## Network Information

- **Network**: Celo Alfajores Testnet
- **Chain ID**: 44787
- **RPC URL**: https://alfajores-forno.celo-testnet.org
- **Block Explorer**: https://alfajores.celoscan.io
- **Faucet**: https://faucet.celo.org
- **Native Currency**: CELO (18 decimals)

## Deployed Contracts

### 1. Blackjack Contract

**Game**: Classic Blackjack (21) card game

**Contract Address**: `0x6cb9971850767026feBCb4801c0b8a946F28C9Ec`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0x6cb9971850767026feBCb4801c0b8a946F28C9Ec)

**ABI Location**: `lib/contracts/blackjack-abi.ts`

**Key Functions**:
- `playGame()` - Play a game of blackjack
- `getStats(address player)` - Get player statistics
  - Returns: totalGames, wins, losses, pushes, blackjacks, winRate

**Events**:
- `GamePlayed(address indexed player, uint8[] playerCards, uint8[] dealerCards, uint8 playerTotal, uint8 dealerTotal, string outcome)`

**Gas Estimates**:
- Play game: ~200,000 - 500,000 gas
- Average cost: ~0.001 - 0.005 CELO per game

**Test Coverage**:
- ✅ Read tests: 14 tests
- ✅ Write tests: 15 tests
- ✅ Event parsing tests: 14 tests

---

### 2. Rock Paper Scissors (RPS) Contract

**Game**: Classic Rock Paper Scissors

**Contract Address**: `0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49)

**ABI Location**: `lib/contracts/rps-abi.ts`

**Key Functions**:
- `playGame(uint8 choice)` - Play RPS (0=Rock, 1=Paper, 2=Scissors)
- `getStats(address player)` - Get player statistics

**Events**:
- `GamePlayed(address indexed player, uint8 playerChoice, uint8 computerChoice, string outcome)`

**Test Coverage**:
- ✅ Read tests: Available
- ⏳ Write tests: In development

---

### 3. TicTacToe Contract

**Game**: Classic Tic-Tac-Toe (3x3 grid)

**Contract Address**: `0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881)

**ABI Location**: `lib/contracts/tictactoe-abi.ts`

**Key Functions**:
- `createGame()` - Start a new game
- `makeMove(uint256 gameId, uint8 position)` - Make a move (0-8)
- `getGameState(uint256 gameId)` - Get current game state

**Events**:
- `GameCreated(uint256 indexed gameId, address indexed player)`
- `MoveMade(uint256 indexed gameId, address indexed player, uint8 position)`
- `GameEnded(uint256 indexed gameId, address indexed winner, string outcome)`

**Test Coverage**:
- ✅ Read tests: Available
- ⏳ Write tests: In development

---

### 4. Jackpot Contract

**Game**: Crypto-themed slot machine/wheel game

**Contract Address**: `0x07Bc49E8A2BaF7c68519F9a61FCD733490061644`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0x07Bc49E8A2BaF7c68519F9a61FCD733490061644)

**ABI Location**: `lib/contracts/jackpot-abi.ts`

**Key Functions**:
- `startParty(uint256 fid)` - Start a jackpot session
- `submitScore(uint256 sessionId, uint256 score)` - Submit score for session
- `getSessionInfo(uint256 sessionId)` - Get session details

**Events**:
- `PartyStarted(uint256 indexed sessionId, address indexed player, uint256 fid)`
- `ScoreSubmitted(uint256 indexed sessionId, address indexed player, uint256 score)`

**Game Mechanics**:
- Weighted random outcomes based on crypto market cap
- Outcomes: BTC (1000pts), ETH (500pts), XRP (250pts), BNB (100pts), SOL (50pts), CELO (25pts), OP (10pts), MISS (0pts)

**Test Coverage**:
- ✅ Read tests: Available
- ✅ Hook tests: 36 tests (useJackpot)
- ⏳ Write tests: In development

---

### 5. 2048 Game Contract

**Game**: Classic 2048 tile merging puzzle

**Contract Address**: `0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1)

**ABI Location**: `lib/contracts/2048-abi.ts`

**Key Functions**:
- `startGame()` - Initialize a new 2048 game
- `makeMove(uint256 gameId, uint8 direction)` - Move tiles (0=Up, 1=Down, 2=Left, 3=Right)
- `getBoard(uint256 gameId)` - Get current board state
- `getHighScore(address player)` - Get player's high score

**Events**:
- `GameStarted(uint256 indexed gameId, address indexed player)`
- `MoveMade(uint256 indexed gameId, uint8 direction, uint256 score)`
- `GameOver(uint256 indexed gameId, uint256 finalScore)`

**Test Coverage**:
- ✅ Read tests: Available
- ⏳ Write tests: In development

---

### 6. Mastermind Contract

**Game**: Code-breaking logic game

**Contract Address**: `0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9`

**Explorer**: [View on CeloScan](https://alfajores.celoscan.io/address/0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9)

**ABI Location**: `lib/contracts/mastermind-abi.ts`

**Key Functions**:
- `startGame(uint8[] memory code)` - Start with a secret code
- `makeGuess(uint256 gameId, uint8[] memory guess)` - Submit a guess
- `getStats(address player)` - Get player statistics

**Events**:
- `GameStarted(uint256 indexed gameId, address indexed player)`
- `GuessMade(uint256 indexed gameId, uint8 correctPosition, uint8 correctColor)`
- `GameWon(uint256 indexed gameId, uint8 attempts)`

**Game Mechanics**:
- Secret code: 4 colors from palette of 6
- Feedback: Correct position (black pegs) and correct color (white pegs)
- Win condition: Guess all colors in correct positions

**Test Coverage**:
- ✅ Read tests: Available
- ⏳ Write tests: In development

---

## Contract Security

### Testnet Safety Measures

All contracts are deployed on **Alfajores testnet only**:

1. **Chain ID Verification**: Tests verify connection to chain ID 44787 (Alfajores)
2. **Mainnet Protection**: Tests explicitly fail if connected to mainnet (chain ID 42220)
3. **Test Wallets Only**: All interactions use dedicated test wallets with no real funds
4. **No Real Value**: CELO on Alfajores has no real-world value

### Best Practices

- ✅ Always verify chain ID before transactions
- ✅ Use dedicated test wallets (never production wallets)
- ✅ Keep private keys in `.env.test` (gitignored)
- ✅ Never commit real private keys to git
- ✅ Monitor gas costs and set reasonable limits
- ✅ Implement transaction timeouts (60s default)

---

## Gas Optimization

### Estimated Gas Costs (Alfajores)

| Operation | Gas Used | CELO Cost (est.) |
|-----------|----------|------------------|
| Blackjack play | 200k-500k | 0.001-0.005 |
| RPS play | 150k-300k | 0.0008-0.003 |
| TicTacToe move | 100k-200k | 0.0005-0.002 |
| Jackpot spin | 200k-400k | 0.001-0.004 |
| 2048 move | 150k-350k | 0.0008-0.0035 |
| Mastermind guess | 100k-250k | 0.0005-0.0025 |

**Note**: Gas costs vary based on:
- Network congestion
- Transaction complexity
- Storage operations (new game vs existing)
- Event emissions

### Gas Limits

Tests use these safety limits:
- Default gas limit: 1,000,000 (1M)
- Transaction timeout: 60 seconds
- Maximum wait time: 90 seconds for write tests

---

## Development Guide

### Adding a New Contract

1. **Deploy Contract** to Alfajores testnet
2. **Create ABI file** in `lib/contracts/[game]-abi.ts`:
   ```typescript
   export const GAME_CONTRACT_ADDRESS = '0x...' as const;
   export const GAME_CONTRACT_ABI = [...] as const;
   ```

3. **Add Helper Functions** in `tests/blockchain/helpers/contract-helpers.ts`:
   ```typescript
   export async function getGameStats(address?: `0x${string}`) {
     // Implementation
   }

   export async function playGame() {
     // Implementation
   }
   ```

4. **Create Test Files**:
   - `tests/blockchain/contracts/[game].read.test.ts` - Read operations
   - `tests/blockchain/contracts/[game].write.test.ts` - Write operations
   - `tests/blockchain/contracts/[game].events.test.ts` - Event parsing (optional)

5. **Update Documentation**:
   - Add contract to this file (CONTRACTS.md)
   - Update README.md with test counts
   - Update main repo README if applicable

### Testing Checklist

For each new contract, ensure tests cover:

- [ ] Read Operations
  - [ ] Contract is deployed (bytecode check)
  - [ ] Public functions return expected types
  - [ ] Default values for new addresses
  - [ ] Multiple calls return consistent data

- [ ] Write Operations
  - [ ] Transactions succeed and get mined
  - [ ] Gas costs are reasonable
  - [ ] Events are emitted correctly
  - [ ] State changes as expected
  - [ ] Edge cases handled properly

- [ ] Event Parsing
  - [ ] Events parse correctly
  - [ ] Indexed parameters work
  - [ ] Event data matches expectations

---

## Monitoring & Debugging

### View Contract Activity

Each contract can be monitored on CeloScan:

```
https://alfajores.celoscan.io/address/[CONTRACT_ADDRESS]
```

**Available Information**:
- Transaction history
- Contract source code (if verified)
- Events emitted
- Internal transactions
- Token transfers
- Gas usage analytics

### Test Wallet Monitoring

Monitor test wallet balance and transactions:

```typescript
import { getTestWalletBalance, TEST_WALLET_ADDRESS } from './setup/test-wallet';

const balance = await getTestWalletBalance();
console.log(`Balance: ${balance.toFixed(4)} CELO`);
console.log(`Address: ${TEST_WALLET_ADDRESS}`);
console.log(`Explorer: https://alfajores.celoscan.io/address/${TEST_WALLET_ADDRESS}`);
```

### Debugging Failed Transactions

If a transaction fails:

1. **Check transaction on CeloScan** - Look for revert reason
2. **Verify wallet balance** - Ensure sufficient CELO for gas
3. **Check gas limit** - Increase if "out of gas" error
4. **Verify contract address** - Ensure correct deployment
5. **Check function parameters** - Validate input types and ranges

---

## Contract Upgrades

### Version Management

Currently all contracts are **non-upgradeable** single deployments.

If a contract needs to be redeployed:

1. Deploy new version to Alfajores
2. Update contract address in `lib/contracts/[game]-abi.ts`
3. Run all tests to verify functionality
4. Update this documentation with new address
5. Archive old contract address for reference

### Migration Strategy

For future upgradeable contracts, consider:
- Proxy pattern (EIP-1967)
- Version tracking in contract
- Migration tests
- State preservation strategy

---

## Resources

- **Celo Documentation**: https://docs.celo.org
- **Alfajores Faucet**: https://faucet.celo.org
- **Alfajores Explorer**: https://alfajores.celoscan.io
- **Viem Documentation**: https://viem.sh
- **Wagmi Documentation**: https://wagmi.sh
- **Celo Forum**: https://forum.celo.org
- **Celo Discord**: https://chat.celo.org

---

## Support

For issues related to smart contracts:

1. Check contract on CeloScan for transaction details
2. Verify test wallet has sufficient CELO
3. Review test logs for specific error messages
4. Check network status: https://stats.celo.org
5. Create GitHub issue with transaction hash and logs

---

**Last Updated**: 2025-12-29
**Network**: Celo Alfajores Testnet (Chain ID: 44787)
**Total Contracts**: 6 (Blackjack, RPS, TicTacToe, Jackpot, 2048, Mastermind)
