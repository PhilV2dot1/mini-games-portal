# Snake Smart Contract

Solidity smart contract for Snake game on Celo blockchain with session tracking and statistics.

## Features

### Core Gameplay
- **Session-Based**: Track individual game sessions on-chain
- **Score Recording**: Record final scores and food eaten
- **Statistics Tracking**: Maintains player statistics across all games
- **Global Leaderboard**: Track the highest score achieved globally

### Blockchain Features
- **No Betting**: Free-to-play, gas fees only
- **Player Stats**: Track games played, high scores, total score, and food eaten
- **Global High Score**: See who holds the world record
- **Event Emission**: Real-time event tracking for frontend integration

## Contract Structure

### Player Statistics
```solidity
struct PlayerStats {
    uint256 gamesPlayed;
    uint256 highScore;
    uint256 totalScore;
    uint256 totalFoodEaten;
}
```

### Main Functions

#### `startGame()`
Start a new game session.
- **Requirements**: Player must not have an active game
- **Gas Cost**: ~45,000 gas

```solidity
// Start a new game
snake.startGame();
```

#### `endGame(uint256 score, uint256 foodEaten)`
End the current game and record the score.
- **Parameters**:
  - `score`: Final score achieved
  - `foodEaten`: Number of food items eaten
- **Requirements**: Player must have an active game
- **Updates**: Player stats, global high score (if applicable)
- **Gas Cost**: ~80,000 - 120,000 gas

```solidity
// End game with score 150 and 15 food eaten
snake.endGame(150, 15);
```

#### `getPlayerStats(address player)` (view)
Get player statistics.
- **Returns**:
  - `gamesPlayed`: Total number of games played
  - `highScore`: Personal best score
  - `totalScore`: Cumulative score across all games
  - `totalFoodEaten`: Total food eaten across all games

```solidity
// Get stats for a player
(uint256 games, uint256 high, uint256 total, uint256 food) = snake.getPlayerStats(playerAddress);
```

#### `isGameActive(address player)` (view)
Check if a player has an active game session.
- **Returns**: `true` if player has an active game

```solidity
bool isActive = snake.isGameActive(msg.sender);
```

#### `getGlobalHighScore()` (view)
Get the global high score information.
- **Returns**:
  - `score`: The global high score
  - `holder`: Address of the high score holder

```solidity
(uint256 worldRecord, address champion) = snake.getGlobalHighScore();
```

## Game Flow

1. **Player starts game**
   ```solidity
   snake.startGame();
   ```

2. **Player plays the game** (off-chain)
   - Frontend handles game logic
   - Snake movement, collision detection
   - Food generation and scoring

3. **Player finishes game** (Game Over)
   ```solidity
   // Record final score on-chain
   snake.endGame(finalScore, foodEaten);
   ```

4. **Stats are updated automatically**
   - Personal high score updated if beaten
   - Global high score updated if world record
   - Total games, score, and food incremented

## Events

The contract emits the following events:

```solidity
event GameStarted(address indexed player, uint256 timestamp);

event GameEnded(
    address indexed player,
    uint256 score,
    uint256 foodEaten,
    bool newHighScore,
    uint256 timestamp
);

event NewGlobalHighScore(
    address indexed player,
    uint256 score,
    uint256 timestamp
);
```

Listen to these events in your frontend to:
- Track when games start/end
- Celebrate new personal records
- Announce new world records

## Deployment

### Contract Address
**Celo Mainnet**: `0x5646fda34aaf8a95b9b0607db5ca02bdee267598` ([View on Celoscan](https://celoscan.io/address/0x5646fda34aaf8a95b9b0607db5ca02bdee267598))

### Deploy Your Own

#### Using Hardhat

1. **Install dependencies**
   ```bash
   npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
   ```

2. **Create deployment script** (`scripts/deploy-snake.js`)
   ```javascript
   const hre = require("hardhat");

   async function main() {
     const Snake = await hre.ethers.getContractFactory("Snake");
     const snake = await Snake.deploy();
     await snake.deployed();

     console.log("Snake deployed to:", snake.address);
   }

   main().catch((error) => {
     console.error(error);
     process.exitCode = 1;
   });
   ```

3. **Deploy to Celo Mainnet**
   ```bash
   npx hardhat run scripts/deploy-snake.js --network celo
   ```

#### Using Foundry

```bash
forge create --rpc-url $CELO_RPC_URL \
  --private-key $PRIVATE_KEY \
  contracts/Snake.sol:Snake
```

## Frontend Integration

### Using Wagmi/Viem

```typescript
import { useContractWrite, useContractRead } from 'wagmi';

const SNAKE_ADDRESS = "0x5646fda34aaf8a95b9b0607db5ca02bdee267598";

// Start game
const { write: startGame } = useContractWrite({
  address: SNAKE_ADDRESS,
  abi: SnakeABI,
  functionName: 'startGame',
});

// End game
const { write: endGame } = useContractWrite({
  address: SNAKE_ADDRESS,
  abi: SnakeABI,
  functionName: 'endGame',
  args: [score, foodEaten],
});

// Get player stats
const { data: stats } = useContractRead({
  address: SNAKE_ADDRESS,
  abi: SnakeABI,
  functionName: 'getPlayerStats',
  args: [playerAddress],
  watch: true,
});
```

### Example: Complete Game Flow

```typescript
// 1. Start game when user clicks "Start"
const handleStart = async () => {
  try {
    await startGame();
    // Begin game loop
    startGameLoop();
  } catch (error) {
    console.error("Failed to start game:", error);
  }
};

// 2. End game when player loses
const handleGameOver = async () => {
  try {
    await endGame(finalScore, totalFoodEaten);
    // Show final stats
    const newStats = await getPlayerStats(address);
    displayStats(newStats);
  } catch (error) {
    console.error("Failed to record score:", error);
  }
};
```

## Gas Optimization

The contract uses several gas optimization techniques:
- **Minimal storage**: Only essential data stored on-chain
- **Efficient mappings**: Direct address-to-stats mapping
- **Single writes**: Batch updates in endGame function
- **View functions**: Free reads for stats

### Estimated Gas Costs (Celo Mainnet)
- **Start Game**: ~45,000 gas (~$0.001)
- **End Game** (no records): ~80,000 gas (~$0.002)
- **End Game** (new personal high): ~95,000 gas (~$0.002)
- **End Game** (new world record): ~110,000 gas (~$0.003)

*Gas costs based on average Celo gas price. Actual costs may vary.*

## Security Considerations

1. **Session Management**: Prevents players from having multiple active games
2. **Integer Overflow**: Solidity 0.8+ has built-in overflow protection
3. **Access Control**: Only game player can end their own game
4. **No Reentrancy**: No external calls or fund transfers
5. **Input Validation**: All inputs validated before state changes

## Game Scoring

The Snake game uses the following scoring system:
- **+10 points** per food item eaten
- **Speed increases** every 5 food items
- **High score** based on maximum points achieved

## Statistics Tracked

### Personal Stats (Per Player)
- Games Played
- High Score
- Total Score (cumulative)
- Total Food Eaten

### Global Stats
- Global High Score
- Global High Score Holder

## Testing

Example test cases in `test/Snake.test.js`:

```javascript
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Snake", function () {
  let snake;
  let player1, player2;

  beforeEach(async function () {
    [player1, player2] = await ethers.getSigners();
    const Snake = await ethers.getContractFactory("Snake");
    snake = await Snake.deploy();
  });

  it("Should start a game", async function () {
    await snake.startGame();
    expect(await snake.isGameActive(player1.address)).to.be.true;
  });

  it("Should record score when game ends", async function () {
    await snake.startGame();
    await snake.endGame(150, 15);

    const stats = await snake.getPlayerStats(player1.address);
    expect(stats.gamesPlayed).to.equal(1);
    expect(stats.highScore).to.equal(150);
    expect(stats.totalFoodEaten).to.equal(15);
  });

  it("Should update global high score", async function () {
    await snake.startGame();
    await snake.endGame(200, 20);

    const [score, holder] = await snake.getGlobalHighScore();
    expect(score).to.equal(200);
    expect(holder).to.equal(player1.address);
  });

  it("Should prevent starting multiple games", async function () {
    await snake.startGame();
    await expect(snake.startGame()).to.be.revertedWith("Game already in progress");
  });
});
```

## Integration with Celo Games Portal

The Snake game is fully integrated with the Celo Games Portal:
- **Free Play Mode**: Local statistics without blockchain
- **OnChain Mode**: All scores recorded on Celo blockchain
- **Wallet Integration**: Connect with any Celo wallet
- **Real-time Stats**: View your progress and world records

### Configuration

```typescript
// lib/types/games.ts
snake: {
  id: "snake",
  name: "Snake",
  description: "Eat food and grow long!",
  icon: "/icons/snake.svg",
  route: "/games/snake",
  contractAddress: "0x5646fda34aaf8a95b9b0607db5ca02bdee267598",
  color: "from-green-500 to-green-700",
  hasFee: false,
}
```

## License

MIT
