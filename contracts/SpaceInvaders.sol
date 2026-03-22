// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title SpaceInvadersSession
 * @dev Session-based stats tracking for Space Invaders.
 *
 * Flow:
 *   1. Player calls startSession()  — opens a session.
 *   2. Player plays client-side (no tx per wave/kill).
 *   3. Player calls endSession(gamesPlayed, gamesWon, bestScore, bestWave)
 *      to record aggregate session results on-chain.
 *   4. If the player quits early, call abandonSession().
 *
 * This contract is stats-only (no funds held). Game logic runs entirely
 * client-side; only aggregate session results are committed.
 *
 * bestScore : highest score achieved in a single game this session
 * bestWave  : highest wave number reached in a single game this session
 */
contract SpaceInvadersSession {

    // ========================================
    // STRUCTS
    // ========================================

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 totalGamesPlayed;  // total game attempts
        uint256 totalGamesWon;     // total victories (cleared all waves)
        uint256 bestScore;         // all-time best score
        uint256 bestWave;          // highest wave ever reached
        uint256 bestSessionWins;   // most wins in a single session
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;

    uint256 public totalSessionsPlayed;
    uint256 public totalGamesRecorded;
    uint256 public globalBestScore;
    address public globalBestScoreHolder;
    uint256 public globalBestWave;
    address public globalBestWaveHolder;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);

    event SessionEnded(
        address indexed player,
        uint256 gamesPlayed,
        uint256 gamesWon,
        uint256 bestScore,
        uint256 bestWave,
        uint256 timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalBestScore(
        address indexed player,
        uint256 score,
        uint256 timestamp
    );

    event NewGlobalBestWave(
        address indexed player,
        uint256 wave,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new Space Invaders session.
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
     * @param gamesPlayed  Total game attempts this session (> 0)
     * @param gamesWon     Games won (cleared all waves) this session
     * @param bestScore    Highest score achieved in a single game this session
     * @param bestWave     Highest wave reached in a single game this session
     */
    function endSession(
        uint256 gamesPlayed,
        uint256 gamesWon,
        uint256 bestScore,
        uint256 bestWave
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(gamesPlayed > 0,            "Must play at least one game");
        require(gamesWon <= gamesPlayed,    "Invalid game counts");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        s.totalGamesPlayed += gamesPlayed;
        s.totalGamesWon    += gamesWon;

        if (gamesWon > s.bestSessionWins) {
            s.bestSessionWins = gamesWon;
        }

        if (bestScore > s.bestScore) {
            s.bestScore = bestScore;
        }

        if (bestWave > s.bestWave) {
            s.bestWave = bestWave;
        }

        // Global best score
        if (bestScore > globalBestScore) {
            globalBestScore       = bestScore;
            globalBestScoreHolder = msg.sender;
            emit NewGlobalBestScore(msg.sender, bestScore, block.timestamp);
        }

        // Global best wave
        if (bestWave > globalBestWave) {
            globalBestWave       = bestWave;
            globalBestWaveHolder = msg.sender;
            emit NewGlobalBestWave(msg.sender, bestWave, block.timestamp);
        }

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;
        totalGamesRecorded += gamesPlayed;

        emit SessionEnded(
            msg.sender,
            gamesPlayed,
            gamesWon,
            bestScore,
            bestWave,
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
            uint256 totalGamesPlayed,
            uint256 totalGamesWon,
            uint256 bestScore,
            uint256 bestWave,
            uint256 bestSessionWins,
            uint256 winRate  // basis points: won*10000/played
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed    = s.sessionsPlayed;
        totalGamesPlayed  = s.totalGamesPlayed;
        totalGamesWon     = s.totalGamesWon;
        bestScore         = s.bestScore;
        bestWave          = s.bestWave;
        bestSessionWins   = s.bestSessionWins;
        winRate = s.totalGamesPlayed > 0
            ? (s.totalGamesWon * 10000) / s.totalGamesPlayed
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
            uint256 bestScore,  address scoreHolder,
            uint256 bestWave,   address waveHolder
        )
    {
        return (
            globalBestScore,  globalBestScoreHolder,
            globalBestWave,   globalBestWaveHolder
        );
    }
}
