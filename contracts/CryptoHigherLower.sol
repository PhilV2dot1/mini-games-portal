// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CryptoHigherLowerSession
 * @dev Session-based stats tracking for the Crypto Higher / Lower game.
 *
 * Flow:
 *   1. Player calls startSession() — opens a session.
 *   2. Player plays client-side (live CoinGecko prices, no tx per round).
 *   3. At game end (10 rounds OR first wrong answer), player calls endSession()
 *      to record the result on-chain.
 *
 * Stats-only contract — no funds held, no fees.
 * Outcome: WIN = completed all 10 rounds, LOSE = wrong answer before round 10.
 *
 * Difficulty: 0 = Easy, 1 = Medium, 2 = Hard
 */
contract CryptoHigherLowerSession {

    // ========================================
    // ENUMS & STRUCTS
    // ========================================

    enum Outcome {
        WIN,   // Completed all 10 rounds correctly
        LOSE   // Got a wrong answer (game over early)
    }

    enum Difficulty {
        Easy,
        Medium,
        Hard
    }

    struct Session {
        uint256    startTime;
        Difficulty difficulty;
        bool       isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 sessionsWon;       // Perfect 10/10 rounds
        uint256 bestScore;         // Highest points score achieved
        uint256 bestRoundsWon;     // Most rounds won in a single session
        uint256 totalRoundsWon;    // Cumulative correct answers
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

    event SessionStarted(
        address indexed player,
        Difficulty difficulty,
        uint256 timestamp
    );

    event SessionEnded(
        address indexed player,
        Outcome    outcome,
        Difficulty difficulty,
        uint256    roundsWon,
        uint256    score,
        uint256    timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new game session.
     * @param difficulty  0 = Easy, 1 = Medium, 2 = Hard
     * @notice Reverts if player already has an active session.
     */
    function startSession(Difficulty difficulty) external {
        require(!activeSessions[msg.sender].isActive, "Session already active");

        activeSessions[msg.sender] = Session({
            startTime:  block.timestamp,
            difficulty: difficulty,
            isActive:   true
        });

        emit SessionStarted(msg.sender, difficulty, block.timestamp);
    }

    /**
     * @dev Close the session and record the result.
     * @param outcome    WIN (10/10) or LOSE (wrong answer)
     * @param roundsWon  Number of correct guesses this session (0–10)
     * @param score      Final points score (base pts × multiplier + bonuses)
     */
    function endSession(
        Outcome outcome,
        uint256 roundsWon,
        uint256 score
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(roundsWon <= 10, "rounds cannot exceed 10");

        Session memory ses = activeSessions[msg.sender];
        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        if (outcome == Outcome.WIN) {
            s.sessionsWon++;
        }
        if (score > s.bestScore) {
            s.bestScore = score;
        }
        if (roundsWon > s.bestRoundsWon) {
            s.bestRoundsWon = roundsWon;
        }
        s.totalRoundsWon += roundsWon;

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;

        emit SessionEnded(
            msg.sender,
            outcome,
            ses.difficulty,
            roundsWon,
            score,
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
     * @param player The wallet address to query
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 sessionsPlayed,
            uint256 sessionsWon,
            uint256 bestScore,
            uint256 bestRoundsWon,
            uint256 totalRoundsWon,
            uint256 winRate
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed = s.sessionsPlayed;
        sessionsWon    = s.sessionsWon;
        bestScore      = s.bestScore;
        bestRoundsWon  = s.bestRoundsWon;
        totalRoundsWon = s.totalRoundsWon;
        winRate = s.sessionsPlayed > 0
            ? (s.sessionsWon * 10000) / s.sessionsPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }
}
