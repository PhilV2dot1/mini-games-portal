// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title HiLoSession
 * @dev Session-based stats tracking for the Hi-Lo card game on Celo.
 *
 * Flow:
 *   1. Player calls startSession() — opens a session.
 *   2. Player plays client-side (no tx per card guess).
 *   3. At end of game (cashout or gameover), player calls endSession()
 *      to record the session result on-chain.
 *
 * Stats-only contract — no funds held.
 * Outcome: WIN = cashed out (streak ≥ 2), LOSE = gameover (wrong guess).
 */
contract HiLoSession {

    // ========================================
    // ENUMS & STRUCTS
    // ========================================

    enum Outcome {
        WIN,   // Player cashed out successfully
        LOSE   // Player guessed wrong (gameover)
    }

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 sessionsWon;       // Cash-outs
        uint256 bestStreak;        // Best correct-guess streak ever
        uint256 bestScore;         // Best streak × multiplier ever
        uint256 totalCorrect;      // Total correct guesses across all sessions
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;
    uint256 public totalSessionsPlayed;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);

    event SessionEnded(
        address indexed player,
        Outcome outcome,
        uint256 streak,
        uint256 score,       // streak × multiplier
        uint256 timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new game session.
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
     * @dev Close the session and record the result.
     * @param outcome  WIN (cashed out) or LOSE (gameover)
     * @param streak   Number of correct guesses in a row this session
     * @param score    Final score = streak × multiplier (e.g. streak 4 → score 20)
     * @notice score must be ≥ streak (multiplier ≥ 1).
     */
    function endSession(
        Outcome outcome,
        uint256 streak,
        uint256 score
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(score >= streak, "Score cannot be less than streak");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        if (outcome == Outcome.WIN) {
            s.sessionsWon++;
        }
        if (streak > s.bestStreak) {
            s.bestStreak = streak;
        }
        if (score > s.bestScore) {
            s.bestScore = score;
        }
        s.totalCorrect += streak;

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;

        emit SessionEnded(msg.sender, outcome, streak, score, block.timestamp);
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
     * @param player The wallet address to query
     * @return sessionsPlayed  Total sessions completed
     * @return sessionsWon     Sessions where player cashed out
     * @return bestStreak      Highest correct-guess streak ever
     * @return bestScore       Highest streak × multiplier score ever
     * @return totalCorrect    Total correct guesses across all sessions
     * @return winRate         Win rate in basis points (divide by 100 for %)
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 sessionsPlayed,
            uint256 sessionsWon,
            uint256 bestStreak,
            uint256 bestScore,
            uint256 totalCorrect,
            uint256 winRate
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed = s.sessionsPlayed;
        sessionsWon    = s.sessionsWon;
        bestStreak     = s.bestStreak;
        bestScore      = s.bestScore;
        totalCorrect   = s.totalCorrect;
        winRate = s.sessionsPlayed > 0
            ? (s.sessionsWon * 10000) / s.sessionsPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     * @param player The wallet address to query
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }
}
