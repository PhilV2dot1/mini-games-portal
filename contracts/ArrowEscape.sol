// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ArrowEscapeSession
 * @dev Multi-level session tracking for Arrow Escape puzzle game.
 *
 * Flow:
 *   1. Player calls startSession()  — opens a session, no fee required.
 *   2. Player completes as many levels as desired client-side (no tx per level).
 *   3. Player calls endSession(levelsPlayed, levelsCleared, bestScore, bestLevel)
 *      to record the full session result on-chain.
 *
 * This contract is stats-only (no funds held). Game logic runs entirely
 * client-side; only aggregate session results are committed.
 *
 * bestScore : highest score achieved across all levels in this session
 * bestLevel : highest level number cleared in this session (1-10)
 */
contract ArrowEscapeSession {

    // ========================================
    // STRUCTS
    // ========================================

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 totalLevelsPlayed;   // total level attempts
        uint256 totalLevelsCleared;  // total levels successfully cleared
        uint256 bestScore;           // all-time best score
        uint256 bestLevel;           // highest level ever reached (1-10)
        uint256 bestSessionClears;   // most levels cleared in a single session
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;

    uint256 public totalSessionsPlayed;
    uint256 public totalLevelsRecorded;
    uint256 public globalBestScore;
    address public globalBestScoreHolder;
    uint256 public globalBestLevel;
    address public globalBestLevelHolder;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);

    event SessionEnded(
        address indexed player,
        uint256 levelsPlayed,
        uint256 levelsCleared,
        uint256 bestScore,
        uint256 bestLevel,
        uint256 timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalBestScore(
        address indexed player,
        uint256 score,
        uint256 timestamp
    );

    event NewGlobalBestLevel(
        address indexed player,
        uint256 level,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new Arrow Escape session.
     * @notice Reverts if player already has an active session.
     */
    function startSession() external {
        require(!activeSessions[msg.sender].isActive, "Session already active");

        activeSessions[msg.sender] = Session({
            startTime: block.timestamp,
            isActive:  true
        });

        emit SessionStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev Close the session and record aggregate results.
     * @param levelsPlayed   Total level attempts this session (> 0)
     * @param levelsCleared  Levels successfully completed this session
     * @param bestScore      Highest score achieved this session
     * @param bestLevel      Highest level number cleared this session (1-10)
     */
    function endSession(
        uint256 levelsPlayed,
        uint256 levelsCleared,
        uint256 bestScore,
        uint256 bestLevel
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(levelsPlayed > 0,               "Must play at least one level");
        require(levelsCleared <= levelsPlayed,  "Invalid level counts");
        require(bestLevel <= 10,                "Invalid level number");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        s.totalLevelsPlayed   += levelsPlayed;
        s.totalLevelsCleared  += levelsCleared;

        if (levelsCleared > s.bestSessionClears) {
            s.bestSessionClears = levelsCleared;
        }

        if (bestScore > s.bestScore) {
            s.bestScore = bestScore;
        }

        if (bestLevel > s.bestLevel) {
            s.bestLevel = bestLevel;
        }

        // Global best score
        if (bestScore > globalBestScore) {
            globalBestScore       = bestScore;
            globalBestScoreHolder = msg.sender;
            emit NewGlobalBestScore(msg.sender, bestScore, block.timestamp);
        }

        // Global best level
        if (bestLevel > globalBestLevel) {
            globalBestLevel       = bestLevel;
            globalBestLevelHolder = msg.sender;
            emit NewGlobalBestLevel(msg.sender, bestLevel, block.timestamp);
        }

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;
        totalLevelsRecorded += levelsPlayed;

        emit SessionEnded(
            msg.sender,
            levelsPlayed,
            levelsCleared,
            bestScore,
            bestLevel,
            block.timestamp
        );
    }

    /**
     * @dev Abandon the current session without recording stats.
     */
    function abandonSession() external {
        require(activeSessions[msg.sender].isActive, "No active session");
        activeSessions[msg.sender].isActive = false;
        emit SessionAbandoned(msg.sender, block.timestamp);
    }

    // ========================================
    // VIEW FUNCTIONS
    // ========================================

    /**
     * @dev Returns aggregate stats for a player.
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 sessionsPlayed,
            uint256 totalLevelsPlayed,
            uint256 totalLevelsCleared,
            uint256 bestScore,
            uint256 bestLevel,
            uint256 bestSessionClears,
            uint256 clearRate  // basis points: cleared*10000/played
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed      = s.sessionsPlayed;
        totalLevelsPlayed   = s.totalLevelsPlayed;
        totalLevelsCleared  = s.totalLevelsCleared;
        bestScore           = s.bestScore;
        bestLevel           = s.bestLevel;
        bestSessionClears   = s.bestSessionClears;
        clearRate = s.totalLevelsPlayed > 0
            ? (s.totalLevelsCleared * 10000) / s.totalLevelsPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }

    /**
     * @dev Global leaderboard info.
     */
    function getGlobalBests()
        external
        view
        returns (
            uint256 bestScore,   address scoreHolder,
            uint256 bestLevel,   address levelHolder
        )
    {
        return (
            globalBestScore,   globalBestScoreHolder,
            globalBestLevel,   globalBestLevelHolder
        );
    }
}
