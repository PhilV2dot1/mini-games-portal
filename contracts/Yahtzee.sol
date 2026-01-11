// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Yahtzee
 * @notice Yahtzee game contract for Celo Games Portal
 * @dev Tracks game sessions and player statistics on-chain
 *
 * This contract follows a results-only pattern - the game logic runs client-side,
 * and only final scores are recorded on-chain for gas efficiency.
 */
contract Yahtzee {
    // ============================================================================
    // STRUCTS
    // ============================================================================

    struct PlayerStats {
        uint256 gamesPlayed;    // Total games completed
        uint256 totalScore;     // Sum of all game scores
        uint256 highScore;      // Best single game score
    }

    struct GameSession {
        uint256 startTime;      // When the game started
        bool isActive;          // Whether game is currently active
    }

    // ============================================================================
    // STATE VARIABLES
    // ============================================================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => GameSession) public activeGames;
    uint256 public totalGames;

    // Maximum possible Yahtzee score (theoretical perfect game)
    uint256 public constant MAX_SCORE = 375;

    // ============================================================================
    // EVENTS
    // ============================================================================

    event GameStarted(address indexed player, uint256 timestamp);
    event GameEnded(address indexed player, uint256 score, uint256 timestamp);
    event GameAbandoned(address indexed player, uint256 timestamp);

    // ============================================================================
    // ERRORS
    // ============================================================================

    error GameAlreadyActive();
    error NoActiveGame();
    error InvalidScore();

    // ============================================================================
    // GAME FUNCTIONS
    // ============================================================================

    /**
     * @notice Start a new Yahtzee game
     * @dev Creates a game session for the player
     */
    function startGame() external {
        if (activeGames[msg.sender].isActive) {
            revert GameAlreadyActive();
        }

        activeGames[msg.sender] = GameSession({
            startTime: block.timestamp,
            isActive: true
        });

        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @notice End the current game and record the score
     * @param score Final score achieved in the game
     * @dev Validates score and updates player statistics
     */
    function endGame(uint256 score) external {
        if (!activeGames[msg.sender].isActive) {
            revert NoActiveGame();
        }

        // Validate score (max possible is 375)
        if (score > MAX_SCORE) {
            revert InvalidScore();
        }

        // Update player stats
        PlayerStats storage stats = playerStats[msg.sender];
        stats.gamesPlayed++;
        stats.totalScore += score;

        if (score > stats.highScore) {
            stats.highScore = score;
        }

        // Mark game as complete
        activeGames[msg.sender].isActive = false;
        totalGames++;

        emit GameEnded(msg.sender, score, block.timestamp);
    }

    /**
     * @notice Abandon the current active game
     * @dev Allows player to cancel a game without recording stats
     */
    function abandonGame() external {
        if (!activeGames[msg.sender].isActive) {
            revert NoActiveGame();
        }

        activeGames[msg.sender].isActive = false;

        emit GameAbandoned(msg.sender, block.timestamp);
    }

    // ============================================================================
    // VIEW FUNCTIONS
    // ============================================================================

    /**
     * @notice Get statistics for a player
     * @param player Address of the player
     * @return gamesPlayed Total games completed
     * @return totalScore Sum of all scores
     * @return highScore Best single game score
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 totalScore,
            uint256 highScore
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (stats.gamesPlayed, stats.totalScore, stats.highScore);
    }

    /**
     * @notice Get average score for a player
     * @param player Address of the player
     * @return Average score (0 if no games played)
     */
    function getAverageScore(address player) external view returns (uint256) {
        PlayerStats memory stats = playerStats[player];
        if (stats.gamesPlayed == 0) {
            return 0;
        }
        return stats.totalScore / stats.gamesPlayed;
    }

    /**
     * @notice Check if a player has an active game
     * @param player Address of the player
     * @return Whether the player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return activeGames[player].isActive;
    }

    /**
     * @notice Get the start time of a player's active game
     * @param player Address of the player
     * @return Start timestamp (0 if no active game)
     */
    function getGameStartTime(address player) external view returns (uint256) {
        return activeGames[player].startTime;
    }
}
