// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Wordle
 * @dev Game session tracking for the Wordle word-guessing game
 * @notice Tracks game sessions, player statistics, win streaks, and best attempt counts
 *
 * Rules:
 *   - Player guesses a 5-letter English word in up to 6 attempts
 *   - won=true  → success (1 to 6 attempts used)
 *   - won=false → failure (6 attempts exhausted)
 *   - No fee required to play
 */
contract Wordle {

    // ========================================
    // STRUCTS
    // ========================================

    struct GameSession {
        uint256 startTime;
        bool isActive;
    }

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;
        uint256 currentStreak;
        uint256 bestStreak;
        uint256 bestAttempts;        // lowest attempt count on a win (0 = no win yet)
        uint256[6] distribution;     // wins[0] = won in 1 attempt, wins[5] = won in 6
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => GameSession) public activeGames;

    uint256 public totalGames;
    uint256 public totalWins;

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(address indexed player, uint256 timestamp);

    event GameEnded(
        address indexed player,
        bool won,
        uint8 attempts,
        uint256 timestamp
    );

    event GameAbandoned(address indexed player, uint256 timestamp);

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Start a new game session.
     *      Abandons any existing active session (not counted as a loss).
     */
    function startGame() external {
        // Silently replace any existing session
        activeGames[msg.sender] = GameSession({
            startTime: block.timestamp,
            isActive: true
        });

        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev End the current game and record the result.
     * @param won     true if the player guessed the word
     * @param attempts Number of guesses used (1–6)
     */
    function endGame(bool won, uint8 attempts) external {
        require(activeGames[msg.sender].isActive, "No active game");
        require(attempts >= 1 && attempts <= 6, "Invalid attempt count");
        if (won) {
            require(attempts >= 1 && attempts <= 6, "Won games need 1-6 attempts");
        }

        activeGames[msg.sender].isActive = false;

        PlayerStats storage stats = playerStats[msg.sender];
        stats.gamesPlayed++;
        totalGames++;

        if (won) {
            stats.wins++;
            totalWins++;

            // Streak
            stats.currentStreak++;
            if (stats.currentStreak > stats.bestStreak) {
                stats.bestStreak = stats.currentStreak;
            }

            // Best attempt count (lower is better)
            if (stats.bestAttempts == 0 || attempts < stats.bestAttempts) {
                stats.bestAttempts = attempts;
            }

            // Distribution (attempts is 1-based, array is 0-based)
            stats.distribution[attempts - 1]++;
        } else {
            // Reset streak on loss
            stats.currentStreak = 0;
        }

        emit GameEnded(msg.sender, won, attempts, block.timestamp);
    }

    /**
     * @dev Abandon the current active game (not recorded in stats).
     */
    function abandonGame() external {
        require(activeGames[msg.sender].isActive, "No active game");
        activeGames[msg.sender].isActive = false;
        emit GameAbandoned(msg.sender, block.timestamp);
    }

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    /**
     * @dev Get full player statistics.
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 currentStreak,
            uint256 bestStreak,
            uint256 bestAttempts,
            uint256[6] memory distribution
        )
    {
        PlayerStats storage stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.currentStreak,
            stats.bestStreak,
            stats.bestAttempts,
            stats.distribution
        );
    }

    /**
     * @dev Check whether a player currently has an active game.
     */
    function isGameActive(address player) external view returns (bool) {
        return activeGames[player].isActive;
    }

    /**
     * @dev Get global counters.
     */
    function getGlobalStats()
        external
        view
        returns (uint256 _totalGames, uint256 _totalWins)
    {
        return (totalGames, totalWins);
    }
}
