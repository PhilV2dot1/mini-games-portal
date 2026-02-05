# ConnectFive Smart Contract


### Core Gameplay
- **7×6 Grid**: Classic Connect Four board (7 columns × 6 rows)
- **Win Detection**: Automatic detection of wins (horizontal, vertical, diagonal)
- **Draw Detection**: Game ends in draw when board is full
- **Turn Management**: Enforces alternating turns between players

### Blockchain Features
- **Optional Betting**: Players can wager CELO on games
- **Winner Takes All**: Winner receives both players' bets
- **Refunds on Draw**: Automatic refund if game ends in draw
- **Timeout Protection**: Players can claim win if opponent doesn't move within 10 minutes
- **Player Statistics**: Tracks wins and losses on-chain

## Contract Structure

### Game States
```solidity
enum GameStatus {
    Waiting,    // Waiting for second player to join
    Playing,    // Game in progress
    Won,        // Game completed - player won
    Draw,       // Game completed - draw
    Cancelled   // Game cancelled (timeout/forfeit)
}
```

### Main Functions

#### `createGame()` (payable)
Create a new game with optional bet amount
- **msg.value**: Bet amount in wei (0 for free play)
- **Returns**: gameId

```solidity
// Create free game
uint256 gameId = connectFive.createGame();

// Create game with 0.01 CELO bet
uint256 gameId = connectFive.createGame{value: 0.01 ether}();
```

#### `joinGame(uint256 gameId)` (payable)
Join an existing game
- **gameId**: ID of game to join
- **msg.value**: Must match creator's bet amount

```solidity
// Join game with matching bet
connectFive.joinGame{value: 0.01 ether}(gameId);
```

#### `makeMove(uint256 gameId, uint8 column)`
Drop a piece in a column (0-6)
- **gameId**: ID of active game
- **column**: Column to drop piece (0-6)

```solidity
// Drop piece in column 3
connectFive.makeMove(gameId, 3);
```

#### `cancelGame(uint256 gameId)`
Cancel a game (waiting games or games with timeout)
- Waiting games: Refund creator
- Timed out games: Refund and award win to active player

```solidity
connectFive.cancelGame(gameId);
```

### View Functions

#### `getBoard(uint256 gameId)`
Get current board state
- **Returns**: 2D array of Cell enum (Empty/Player1/Player2)

#### `getGame(uint256 gameId)`
Get game details
- **Returns**: player1, player2, betAmount, currentPlayer, status, winner, moveCount

#### `getPlayerGames(address player)`
Get all game IDs for a player
- **Returns**: Array of game IDs

#### `getPlayerStats(address player)`
Get player win/loss statistics
- **Returns**: (wins, losses)

#### `isColumnPlayable(uint256 gameId, uint8 column)`
Check if a column can accept a piece
- **Returns**: true if column has empty space

## Game Flow

1. **Player 1 creates game**
   ```solidity
   uint256 gameId = connectFive.createGame{value: betAmount}();
   ```

2. **Player 2 joins game**
   ```solidity
   connectFive.joinGame{value: betAmount}(gameId);
   ```

3. **Players alternate making moves**
   ```solidity
   // Player 1's turn
   connectFive.makeMove(gameId, 3);

   // Player 2's turn
   connectFive.makeMove(gameId, 4);
   ```

4. **Game ends automatically when:**
   - A player connects 4 pieces → Winner receives payout
   - Board is full → Both players refunded
   - Timeout occurs → Active player can claim win

## Deployment

### Prerequisites
- Hardhat or Foundry
- Celo testnet/mainnet RPC URL
- Funded wallet for deployment

### Using Hardhat

1. **Install dependencies**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Create deployment script** (`scripts/deploy-connectfive.js`)
   ```javascript
   const hre = require("hardhat");

   async function main() {
     const ConnectFive = await hre.ethers.getContractFactory("ConnectFive");
     const connectFive = await ConnectFive.deploy();
     await connectFive.deployed();

     console.log("ConnectFive deployed to:", connectFive.address);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

3. **Deploy to Celo Alfajores (testnet)**
   ```bash
   npx hardhat run scripts/deploy-connectfive.js --network celo-testnet
   ```

4. **Deploy to Celo Mainnet**
   ```bash
   npx hardhat run scripts/deploy-connectfive.js --network celo
   ```

### Using Foundry

1. **Install Foundry**
   ```bash
   curl -L https://foundry.paradigm.xyz | bash
   foundryup
   ```

2. **Deploy**
   ```bash
   forge create --rpc-url $CELO_RPC_URL \
     --private-key $PRIVATE_KEY \
     contracts/ConnectFive.sol:ConnectFive
   ```

## Configuration

### Update games.ts
After deployment, update the contract address:

```typescript
// lib/types/games.ts
connectfive: {
  id: "connectfive",
  name: "Connect Five",
  description: "Connect 4 pieces in a row!",
  icon: "/icons/connectfive.png",
  route: "/games/connect-five",
  contractAddress: "0xYOUR_DEPLOYED_CONTRACT_ADDRESS", // Add this
  color: "from-blue-500 to-indigo-600",
  hasFee: false, // or true if you want to charge a fee
},
```

## Gas Optimization

The contract uses several gas optimization techniques:
- Packed storage with uint8 types
- View functions for read operations
- Efficient win detection algorithm
- Minimal storage operations

### Estimated Gas Costs (Celo Alfajores)
- Create Game: ~150,000 gas
- Join Game: ~100,000 gas
- Make Move: ~80,000 - 120,000 gas
- Cancel Game: ~50,000 gas

## Security Considerations

1. **Reentrancy Protection**: Uses checks-effects-interactions pattern
2. **Integer Overflow**: Solidity 0.8+ has built-in overflow protection
3. **Timeout Mechanism**: Prevents griefing by inactive players
4. **Access Control**: Only game players can interact with their games
5. **Input Validation**: All inputs validated before state changes

## Testing

Create comprehensive tests in `test/ConnectFive.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ConnectFive", function () {
  let connectFive;
  let player1, player2;

  beforeEach(async function () {
    [player1, player2] = await ethers.getSigners();
    const ConnectFive = await ethers.getContractFactory("ConnectFive");
    connectFive = await ConnectFive.deploy();
  });

  it("Should create a game", async function () {
    const tx = await connectFive.createGame();
    const receipt = await tx.wait();
    expect(receipt.events[0].args.gameId).to.equal(0);
  });

  it("Should allow player 2 to join", async function () {
    await connectFive.createGame();
    await connectFive.connect(player2).joinGame(0);
    const game = await connectFive.getGame(0);
    expect(game.status).to.equal(1); // Playing
  });

  // Add more tests...
});
```

## Events

The contract emits the following events:

```solidity
event GameCreated(uint256 indexed gameId, address indexed player1, uint256 betAmount);
event PlayerJoined(uint256 indexed gameId, address indexed player2);
event MoveMade(uint256 indexed gameId, address indexed player, uint8 column, uint8 row);
event GameWon(uint256 indexed gameId, address indexed winner, uint256 payout);
event GameDraw(uint256 indexed gameId);
event GameCancelled(uint256 indexed gameId, address indexed canceller, uint256 refund);
```

Listen to these events in your frontend to update the UI in real-time.

## Frontend Integration

Example using wagmi/viem:

```typescript
import { useContractWrite, useContractRead } from 'wagmi';

// Create game
const { write: createGame } = useContractWrite({
  address: CONNECTFIVE_ADDRESS,
  abi: ConnectFiveABI,
  functionName: 'createGame',
  value: parseEther('0.01'),
});

// Make move
const { write: makeMove } = useContractWrite({
  address: CONNECTFIVE_ADDRESS,
  abi: ConnectFiveABI,
  functionName: 'makeMove',
  args: [gameId, column],
});

// Get board
const { data: board } = useContractRead({
  address: CONNECTFIVE_ADDRESS,
  abi: ConnectFiveABI,
  functionName: 'getBoard',
  args: [gameId],
  watch: true,
});
```

## License

MIT
