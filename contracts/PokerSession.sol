// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title PokerSession
 * @dev Multi-hand session tracking for Texas Hold'em (solo vs dealer) on Celo.
 *
 * Flow:
 *   1. Player calls startSession() — opens a session, no fee required.
 *   2. Player plays as many hands as desired client-side (no tx per hand).
 *   3. Player calls endSession(handsPlayed, handsWon, handsSplit, bestHandRank)
 *      to record the full session result on-chain.
 *
 * This contract is stats-only (no funds held). The chip stack evolves
 * entirely client-side; only aggregate session results are committed.
 */
contract PokerSession {

    // ========================================
    // STRUCTS
    // ========================================

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 totalHandsPlayed;
        uint256 totalHandsWon;
        uint256 totalHandsSplit;
        uint256 bestHandRank;      // 0 = high card … 9 = royal flush
        uint256 bestSessionWins;   // Most wins in a single session
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;
    uint256 public totalSessionsPlayed;
    uint256 public totalHandsRecorded;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);
    event SessionEnded(
        address indexed player,
        uint256 handsPlayed,
        uint256 handsWon,
        uint256 handsSplit,
        uint8   bestHandRank,
        uint256 timestamp
    );
    event SessionAbandoned(address indexed player, uint256 timestamp);

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new playing session.
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
     * @param handsPlayed  Total hands dealt during this session (>0)
     * @param handsWon     Hands won by the player
     * @param handsSplit   Hands split (tied pot)
     * @param bestHandRank Best poker hand achieved this session (0–9)
     */
    function endSession(
        uint256 handsPlayed,
        uint256 handsWon,
        uint256 handsSplit,
        uint8   bestHandRank
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(handsPlayed > 0,                     "Must play at least one hand");
        require(handsWon + handsSplit <= handsPlayed, "Invalid hand counts");
        require(bestHandRank <= 9,                    "Invalid hand rank");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        s.totalHandsPlayed  += handsPlayed;
        s.totalHandsWon     += handsWon;
        s.totalHandsSplit   += handsSplit;

        if (bestHandRank > s.bestHandRank) {
            s.bestHandRank = bestHandRank;
        }
        if (handsWon > s.bestSessionWins) {
            s.bestSessionWins = handsWon;
        }

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;
        totalHandsRecorded += handsPlayed;

        emit SessionEnded(
            msg.sender,
            handsPlayed,
            handsWon,
            handsSplit,
            bestHandRank,
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
            uint256 totalHandsPlayed,
            uint256 totalHandsWon,
            uint256 totalHandsSplit,
            uint256 bestHandRank,
            uint256 bestSessionWins,
            uint256 winRate  // basis points: handsWon*10000/totalHandsPlayed
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed   = s.sessionsPlayed;
        totalHandsPlayed = s.totalHandsPlayed;
        totalHandsWon    = s.totalHandsWon;
        totalHandsSplit  = s.totalHandsSplit;
        bestHandRank     = s.bestHandRank;
        bestSessionWins  = s.bestSessionWins;
        winRate = s.totalHandsPlayed > 0
            ? (s.totalHandsWon * 10000) / s.totalHandsPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }
}
