// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Memory
 * @dev Game session tracking for Memory card matching game
 * @notice Tracks game sessions, player statistics, and best times/moves per difficulty
 */
contract Memory {
    // ========================================
    // ENUMS & STRUCTS
    // ========================================

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
        uint256 bestTimeEasy;
        uint256 bestTimeMedium;
        uint256 bestTimeHard;
        uint256 bestMovesEasy;
        uint256 bestMovesMedium;
        uint256 bestMovesHard;
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
        Difficulty difficulty,
        uint256 timeTaken,
        uint256 moves,
        uint256 score,
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
     * @param difficulty The difficulty that was played (must match active game)
     * @param timeTaken Time taken in seconds
     * @param moves Number of moves (pair flips)
     * @param score Calculated score
     */
    function endGame(
        Difficulty difficulty,
        uint256 timeTaken,
        uint256 moves,
        uint256 score
    ) external {
        require(activeGames[msg.sender].isActive, "No active game");
        require(
            activeGames[msg.sender].difficulty == difficulty,
            "Difficulty mismatch"
        );

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;
        stats.wins++;

        // Update best time for this difficulty
        if (difficulty == Difficulty.EASY) {
            if (stats.bestTimeEasy == 0 || timeTaken < stats.bestTimeEasy) {
                stats.bestTimeEasy = timeTaken;
            }
            if (stats.bestMovesEasy == 0 || moves < stats.bestMovesEasy) {
                stats.bestMovesEasy = moves;
            }
        } else if (difficulty == Difficulty.MEDIUM) {
            if (stats.bestTimeMedium == 0 || timeTaken < stats.bestTimeMedium) {
                stats.bestTimeMedium = timeTaken;
            }
            if (stats.bestMovesMedium == 0 || moves < stats.bestMovesMedium) {
                stats.bestMovesMedium = moves;
            }
        } else if (difficulty == Difficulty.HARD) {
            if (stats.bestTimeHard == 0 || timeTaken < stats.bestTimeHard) {
                stats.bestTimeHard = timeTaken;
            }
            if (stats.bestMovesHard == 0 || moves < stats.bestMovesHard) {
                stats.bestMovesHard = moves;
            }
        }

        activeGames[msg.sender].isActive = false;
        totalGames++;

        emit GameEnded(
            msg.sender,
            difficulty,
            timeTaken,
            moves,
            score,
            block.timestamp
        );
    }

    /**
     * @dev Abandon the current active game (not recorded in stats)
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
            uint256 bestMovesEasy,
            uint256 bestMovesMedium,
            uint256 bestMovesHard
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.bestTimeEasy,
            stats.bestTimeMedium,
            stats.bestTimeHard,
            stats.bestMovesEasy,
            stats.bestMovesMedium,
            stats.bestMovesHard
        );
    }

    /**
     * @dev Check if player has an active game
     * @param player The player address
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
     * @dev Simple check if player has an active game
     * @param player The player address
     */
    function isGameActive(address player) external view returns (bool) {
        return activeGames[player].isActive;
    }
}
