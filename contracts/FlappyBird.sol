// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title FlappyBird
 * @dev Game session tracking for Flappy Bitcoin on Celo
 * @notice Tracks game sessions, pipes cleared, levels reached, and high scores
 */
contract FlappyBird {
    // ========================================
    // STRUCTS
    // ========================================

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 highScore;     // highest pipes cleared in a single run
        uint256 totalScore;    // cumulative pipes cleared across all runs
        uint256 highestLevel;  // highest level ever reached
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasActiveGame;

    uint256 public totalGames;
    uint256 public globalHighScore;
    address public globalHighScoreHolder;

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(address indexed player, uint256 timestamp);

    event GameEnded(
        address indexed player,
        uint256 score,
        uint8 level,
        bool newHighScore,
        uint256 timestamp
    );

    event GameAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalHighScore(
        address indexed player,
        uint256 score,
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
     * @dev End the current game and record score
     * @param score Number of pipes cleared in this run
     * @param level Level reached (1 = first 30 pipes, 2 = pipes 31-60, etc.)
     */
    function endGame(uint256 score, uint8 level) external {
        require(hasActiveGame[msg.sender], "No active game");

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;
        stats.totalScore += score;

        bool newHighScore = false;

        if (score > stats.highScore) {
            stats.highScore = score;
            newHighScore = true;
        }

        if (level > stats.highestLevel) {
            stats.highestLevel = level;
        }

        if (score > globalHighScore) {
            globalHighScore = score;
            globalHighScoreHolder = msg.sender;
            emit NewGlobalHighScore(msg.sender, score, block.timestamp);
        }

        hasActiveGame[msg.sender] = false;
        totalGames++;

        emit GameEnded(msg.sender, score, level, newHighScore, block.timestamp);
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
            uint256 highScore,
            uint256 totalScore,
            uint256 highestLevel
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.highScore,
            stats.totalScore,
            stats.highestLevel
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
        returns (uint256 score, address holder)
    {
        return (globalHighScore, globalHighScoreHolder);
    }
}
