// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title RouletteSession
 * @dev Multi-spin session tracking for Crypto Roulette (European, 37 numbers).
 *
 * Flow:
 *   1. Player calls startSession()  — opens a session, no fee required.
 *   2. Player spins as many times as desired client-side (no tx per spin).
 *   3. Player calls endSession(spinsPlayed, spinsWon, bestWin, finalChips)
 *      to record the full session result on-chain.
 *
 * This contract is stats-only (no funds held). The chip stack evolves
 * entirely client-side; only aggregate session results are committed.
 *
 * bestWin  : best single-spin net profit during the session (in chips)
 * finalChips: chip balance at session end (starts at 1000 by convention)
 */
contract RouletteSession {

    // ========================================
    // STRUCTS
    // ========================================

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 totalSpinsPlayed;
        uint256 totalSpinsWon;    // spins with net profit > 0
        uint256 bestWin;          // best single-spin net win ever
        uint256 bestFinalChips;   // best chip balance at session end
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;

    uint256 public totalSessionsPlayed;
    uint256 public totalSpinsRecorded;
    uint256 public globalBestWin;
    address public globalBestWinHolder;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);

    event SessionEnded(
        address indexed player,
        uint256 spinsPlayed,
        uint256 spinsWon,
        uint256 bestWin,
        uint256 finalChips,
        uint256 timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalBestWin(
        address indexed player,
        uint256 amount,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new roulette session.
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
     * @param spinsPlayed  Total spins played during this session (> 0)
     * @param spinsWon     Spins where the player had a net profit
     * @param bestWin      Best single-spin net profit this session (in chips)
     * @param finalChips   Chip balance at the end of the session
     */
    function endSession(
        uint256 spinsPlayed,
        uint256 spinsWon,
        uint256 bestWin,
        uint256 finalChips
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(spinsPlayed > 0,          "Must play at least one spin");
        require(spinsWon <= spinsPlayed,  "Invalid spin counts");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        s.totalSpinsPlayed += spinsPlayed;
        s.totalSpinsWon    += spinsWon;

        if (bestWin > s.bestWin) {
            s.bestWin = bestWin;
        }
        if (finalChips > s.bestFinalChips) {
            s.bestFinalChips = finalChips;
        }

        if (bestWin > globalBestWin) {
            globalBestWin       = bestWin;
            globalBestWinHolder = msg.sender;
            emit NewGlobalBestWin(msg.sender, bestWin, block.timestamp);
        }

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;
        totalSpinsRecorded += spinsPlayed;

        emit SessionEnded(
            msg.sender,
            spinsPlayed,
            spinsWon,
            bestWin,
            finalChips,
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
            uint256 totalSpinsPlayed,
            uint256 totalSpinsWon,
            uint256 bestWin,
            uint256 bestFinalChips,
            uint256 winRate   // basis points: spinsWon * 10000 / totalSpinsPlayed
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed   = s.sessionsPlayed;
        totalSpinsPlayed = s.totalSpinsPlayed;
        totalSpinsWon    = s.totalSpinsWon;
        bestWin          = s.bestWin;
        bestFinalChips   = s.bestFinalChips;
        winRate = s.totalSpinsPlayed > 0
            ? (s.totalSpinsWon * 10000) / s.totalSpinsPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }

    /**
     * @dev Global best win info.
     */
    function getGlobalBestWin()
        external
        view
        returns (uint256 amount, address holder)
    {
        return (globalBestWin, globalBestWinHolder);
    }
}
