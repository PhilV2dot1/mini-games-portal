// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Sudoku
 * @dev Game session tracking for Sudoku on Celo
 * @notice This contract tracks game sessions, player statistics, best times per difficulty, and perfect games
 */
contract Sudoku {
    // ========================================
    // ENUMS & STRUCTS
    // ========================================

    enum GameResult {
        WIN
    }

    enum Difficulty {
        EASY,
        MEDIUM,
        HARD
    }

    struct GameSession {
        Difficulty difficulty;
        uint256 startTime;
        bool isActive;
    }

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;
        uint256 bestTimeEasy;      // Best time in seconds for Easy (0 = no record)
        uint256 bestTimeMedium;    // Best time in seconds for Medium (0 = no record)
        uint256 bestTimeHard;      // Best time in seconds for Hard (0 = no record)
        uint256 perfectGames;      // Games completed without using hints
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => GameSession) public activeGames;

    uint256 public totalGames;

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(
        address indexed player,
        Difficulty difficulty,
        uint256 timestamp
    );

    event GameEnded(
        address indexed player,
        GameResult result,
        Difficulty difficulty,
        uint256 timeTaken,
        uint8 hintsUsed,
        uint256 timestamp
    );

    event GameAbandoned(
        address indexed player,
        Difficulty difficulty,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Start a new game session
     * @param difficulty The difficulty level (EASY, MEDIUM, or HARD)
     * @notice Player must not have an active game
     */
    function startGame(Difficulty difficulty) external {
        require(!activeGames[msg.sender].isActive, "Game already in progress");

        activeGames[msg.sender] = GameSession({
            difficulty: difficulty,
            startTime: block.timestamp,
            isActive: true
        });

        emit GameStarted(msg.sender, difficulty, block.timestamp);
    }

    /**
     * @dev End the current game and record result
     * @param result The game result (only WIN for Sudoku)
     * @param difficulty The difficulty that was played (must match active game)
     * @param timeTaken Time taken in seconds to complete the game
     * @param hintsUsed Number of hints used (0-3)
     * @notice Player must have an active game and difficulty must match
     */
    function endGame(
        GameResult result,
        Difficulty difficulty,
        uint256 timeTaken,
        uint8 hintsUsed
    ) external {
        require(activeGames[msg.sender].isActive, "No active game");
        require(
            activeGames[msg.sender].difficulty == difficulty,
            "Difficulty mismatch"
        );
        require(hintsUsed <= 3, "Invalid hints count");

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;

        if (result == GameResult.WIN) {
            stats.wins++;

            // Track perfect games (no hints used)
            if (hintsUsed == 0) {
                stats.perfectGames++;
            }

            // Update best time for this difficulty if it's a new record
            if (difficulty == Difficulty.EASY) {
                if (stats.bestTimeEasy == 0 || timeTaken < stats.bestTimeEasy) {
                    stats.bestTimeEasy = timeTaken;
                }
            } else if (difficulty == Difficulty.MEDIUM) {
                if (stats.bestTimeMedium == 0 || timeTaken < stats.bestTimeMedium) {
                    stats.bestTimeMedium = timeTaken;
                }
            } else if (difficulty == Difficulty.HARD) {
                if (stats.bestTimeHard == 0 || timeTaken < stats.bestTimeHard) {
                    stats.bestTimeHard = timeTaken;
                }
            }
        }

        activeGames[msg.sender].isActive = false;
        totalGames++;

        emit GameEnded(msg.sender, result, difficulty, timeTaken, hintsUsed, block.timestamp);
    }

    /**
     * @dev Abandon the current active game
     * @notice Player must have an active game. Game is not recorded in stats.
     */
    function abandonGame() external {
        require(activeGames[msg.sender].isActive, "No active game");

        Difficulty difficulty = activeGames[msg.sender].difficulty;
        activeGames[msg.sender].isActive = false;

        emit GameAbandoned(msg.sender, difficulty, block.timestamp);
    }

    /**
     * @dev Get player statistics
     * @param player The player address
     * @return gamesPlayed Total games played
     * @return wins Total wins
     * @return bestTimeEasy Best time for Easy difficulty (0 if none)
     * @return bestTimeMedium Best time for Medium difficulty (0 if none)
     * @return bestTimeHard Best time for Hard difficulty (0 if none)
     * @return perfectGames Total perfect games (no hints used)
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 bestTimeEasy,
            uint256 bestTimeMedium,
            uint256 bestTimeHard,
            uint256 perfectGames
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.bestTimeEasy,
            stats.bestTimeMedium,
            stats.bestTimeHard,
            stats.perfectGames
        );
    }

    /**
     * @dev Check if player has an active game
     * @param player The player address
     * @return isActive True if player has an active game
     * @return difficulty The difficulty of the active game (only valid if isActive is true)
     */
    function getActiveGame(address player)
        external
        view
        returns (bool isActive, Difficulty difficulty)
    {
        GameSession memory game = activeGames[player];
        return (game.isActive, game.difficulty);
    }

    /**
     * @dev Check if player has an active game (simple boolean check)
     * @param player The player address
     * @return True if player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return activeGames[player].isActive;
    }
}
