// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title WaterSortSession
 * @dev Multi-puzzle session tracking for Water Sort Crypto.
 *
 * Flow:
 *   1. Player calls startSession()  — opens a session, no fee required.
 *   2. Player solves as many puzzles as desired client-side (no tx per puzzle).
 *   3. Player calls endSession(puzzlesPlayed, puzzlesSolved, bestMoves, difficulty)
 *      to record the full session result on-chain.
 *
 * This contract is stats-only (no funds held). Puzzle logic evolves
 * entirely client-side; only aggregate session results are committed.
 *
 * difficulty : 0 = Easy, 1 = Medium, 2 = Hard
 * bestMoves  : fewest moves used to complete a puzzle this session
 */
contract WaterSortSession {

    // ========================================
    // STRUCTS
    // ========================================

    struct Session {
        uint256 startTime;
        bool    isActive;
    }

    struct PlayerStats {
        uint256 sessionsPlayed;
        uint256 totalPuzzlesPlayed;
        uint256 totalPuzzlesSolved;
        uint256 bestMovesEasy;    // fewest moves ever on Easy   (0 = never solved)
        uint256 bestMovesMedium;  // fewest moves ever on Medium
        uint256 bestMovesHard;    // fewest moves ever on Hard
        uint256 bestSessionSolves; // most puzzles solved in a single session
    }

    // ========================================
    // STATE
    // ========================================

    mapping(address => Session)     public activeSessions;
    mapping(address => PlayerStats) public playerStats;

    uint256 public totalSessionsPlayed;
    uint256 public totalPuzzlesRecorded;
    uint256 public globalBestMovesEasy;
    uint256 public globalBestMovesMedium;
    uint256 public globalBestMovesHard;
    address public globalBestEasyHolder;
    address public globalBestMediumHolder;
    address public globalBestHardHolder;

    // ========================================
    // EVENTS
    // ========================================

    event SessionStarted(address indexed player, uint256 timestamp);

    event SessionEnded(
        address indexed player,
        uint256 puzzlesPlayed,
        uint256 puzzlesSolved,
        uint256 bestMoves,
        uint8   difficulty,
        uint256 timestamp
    );

    event SessionAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalBest(
        address indexed player,
        uint8   difficulty,
        uint256 moves,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Open a new Water Sort session.
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
     * @param puzzlesPlayed  Total puzzles attempted this session (> 0)
     * @param puzzlesSolved  Puzzles successfully completed
     * @param bestMoves      Fewest moves used to solve a puzzle (0 if none solved)
     * @param difficulty     Difficulty level of the bestMoves puzzle (0=Easy,1=Medium,2=Hard)
     */
    function endSession(
        uint256 puzzlesPlayed,
        uint256 puzzlesSolved,
        uint256 bestMoves,
        uint8   difficulty
    ) external {
        require(activeSessions[msg.sender].isActive, "No active session");
        require(puzzlesPlayed > 0,               "Must play at least one puzzle");
        require(puzzlesSolved <= puzzlesPlayed,  "Invalid puzzle counts");
        require(difficulty <= 2,                 "Invalid difficulty");

        PlayerStats storage s = playerStats[msg.sender];

        s.sessionsPlayed++;
        s.totalPuzzlesPlayed  += puzzlesPlayed;
        s.totalPuzzlesSolved  += puzzlesSolved;

        if (puzzlesSolved > s.bestSessionSolves) {
            s.bestSessionSolves = puzzlesSolved;
        }

        // Update best moves per difficulty (lower is better; 0 means never solved)
        if (puzzlesSolved > 0 && bestMoves > 0) {
            bool newGlobal = false;

            if (difficulty == 0) {
                if (s.bestMovesEasy == 0 || bestMoves < s.bestMovesEasy) {
                    s.bestMovesEasy = bestMoves;
                }
                if (globalBestMovesEasy == 0 || bestMoves < globalBestMovesEasy) {
                    globalBestMovesEasy   = bestMoves;
                    globalBestEasyHolder  = msg.sender;
                    newGlobal = true;
                }
            } else if (difficulty == 1) {
                if (s.bestMovesMedium == 0 || bestMoves < s.bestMovesMedium) {
                    s.bestMovesMedium = bestMoves;
                }
                if (globalBestMovesMedium == 0 || bestMoves < globalBestMovesMedium) {
                    globalBestMovesMedium   = bestMoves;
                    globalBestMediumHolder  = msg.sender;
                    newGlobal = true;
                }
            } else {
                if (s.bestMovesHard == 0 || bestMoves < s.bestMovesHard) {
                    s.bestMovesHard = bestMoves;
                }
                if (globalBestMovesHard == 0 || bestMoves < globalBestMovesHard) {
                    globalBestMovesHard   = bestMoves;
                    globalBestHardHolder  = msg.sender;
                    newGlobal = true;
                }
            }

            if (newGlobal) {
                emit NewGlobalBest(msg.sender, difficulty, bestMoves, block.timestamp);
            }
        }

        activeSessions[msg.sender].isActive = false;
        totalSessionsPlayed++;
        totalPuzzlesRecorded += puzzlesPlayed;

        emit SessionEnded(
            msg.sender,
            puzzlesPlayed,
            puzzlesSolved,
            bestMoves,
            difficulty,
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
            uint256 totalPuzzlesPlayed,
            uint256 totalPuzzlesSolved,
            uint256 bestMovesEasy,
            uint256 bestMovesMedium,
            uint256 bestMovesHard,
            uint256 bestSessionSolves,
            uint256 solveRate  // basis points: solved*10000/played
        )
    {
        PlayerStats memory s = playerStats[player];
        sessionsPlayed      = s.sessionsPlayed;
        totalPuzzlesPlayed  = s.totalPuzzlesPlayed;
        totalPuzzlesSolved  = s.totalPuzzlesSolved;
        bestMovesEasy       = s.bestMovesEasy;
        bestMovesMedium     = s.bestMovesMedium;
        bestMovesHard       = s.bestMovesHard;
        bestSessionSolves   = s.bestSessionSolves;
        solveRate = s.totalPuzzlesPlayed > 0
            ? (s.totalPuzzlesSolved * 10000) / s.totalPuzzlesPlayed
            : 0;
    }

    /**
     * @dev Returns true if the player has an open session.
     */
    function isSessionActive(address player) external view returns (bool) {
        return activeSessions[player].isActive;
    }

    /**
     * @dev Global best moves per difficulty.
     */
    function getGlobalBests()
        external
        view
        returns (
            uint256 easyMoves,   address easyHolder,
            uint256 mediumMoves, address mediumHolder,
            uint256 hardMoves,   address hardHolder
        )
    {
        return (
            globalBestMovesEasy,   globalBestEasyHolder,
            globalBestMovesMedium, globalBestMediumHolder,
            globalBestMovesHard,   globalBestHardHolder
        );
    }
}
