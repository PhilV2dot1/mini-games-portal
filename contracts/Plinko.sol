// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Plinko
 * @dev Game session tracking for Plinko Crypto on Celo
 * @notice Tracks game sessions, peak coins reached, wins (1 BTC target), and high scores
 *         Coins are stored as internal units (1 BTC = 10,000,000 coins)
 */
contract Plinko {
    // ========================================
    // STRUCTS
    // ========================================

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;           // times player reached 1 BTC (10,000,000 coins)
        uint256 highScore;      // highest coins reached in a single session
        uint256 totalScore;     // cumulative coins earned across all sessions
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasActiveGame;

    uint256 public totalGames;
    uint256 public globalHighScore;
    address public globalHighScoreHolder;

    uint256 public constant WIN_TARGET = 10000000; // 1 BTC in internal coins

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(address indexed player, uint256 timestamp);

    event GameEnded(
        address indexed player,
        uint256 finalCoins,
        bool won,
        bool newHighScore,
        uint256 timestamp
    );

    event GameAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalHighScore(
        address indexed player,
        uint256 coins,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Start a new game session (silent replace if already active)
     */
    function startGame() external {
        hasActiveGame[msg.sender] = true;
        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev End the current game and record result
     * @param finalCoins Peak coins reached during the session (internal units)
     */
    function endGame(uint256 finalCoins) external {
        require(hasActiveGame[msg.sender], "No active game");

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;
        stats.totalScore += finalCoins;

        bool won = finalCoins >= WIN_TARGET;
        bool newHighScore = false;

        if (won) {
            stats.wins++;
        }

        if (finalCoins > stats.highScore) {
            stats.highScore = finalCoins;
            newHighScore = true;
        }

        if (finalCoins > globalHighScore) {
            globalHighScore = finalCoins;
            globalHighScoreHolder = msg.sender;
            emit NewGlobalHighScore(msg.sender, finalCoins, block.timestamp);
        }

        hasActiveGame[msg.sender] = false;
        totalGames++;

        emit GameEnded(msg.sender, finalCoins, won, newHighScore, block.timestamp);
    }

    /**
     * @dev Abandon the current active game
     */
    function abandonGame() external {
        require(hasActiveGame[msg.sender], "No active game");
        hasActiveGame[msg.sender] = false;
        emit GameAbandoned(msg.sender, block.timestamp);
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 highScore,
            uint256 totalScore
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.highScore,
            stats.totalScore
        );
    }

    /**
     * @dev Check if player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return hasActiveGame[player];
    }

    /**
     * @dev Get global high score information
     */
    function getGlobalHighScore()
        external
        view
        returns (uint256 coins, address holder)
    {
        return (globalHighScore, globalHighScoreHolder);
    }
}
