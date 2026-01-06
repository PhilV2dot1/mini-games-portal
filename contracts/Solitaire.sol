// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title Solitaire
 * @dev Klondike Solitaire game contract for Celo blockchain
 * @notice Tracks player statistics for Solitaire games on-chain
 */
contract Solitaire {
    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 gamesWon;
        uint256 totalScore;
        uint256 bestScore;
        uint256 fastestWinTime; // in seconds
        uint256 fewestMoves;
    }

    // Player stats mapping
    mapping(address => PlayerStats) public playerStats;

    // Active game tracking
    mapping(address => bool) public hasActiveGame;

    // Global statistics
    uint256 public totalGames;
    uint256 public totalWins;
    uint256 public globalBestScore;
    address public globalBestScoreHolder;

    // Events
    event GameStarted(address indexed player, uint256 timestamp);

    event GameEnded(
        address indexed player,
        uint256 score,
        uint256 moves,
        uint256 timeElapsed,
        bool won,
        bool newPersonalRecord,
        uint256 timestamp
    );

    event NewGlobalRecord(
        address indexed player,
        uint256 score,
        uint256 timestamp
    );

    /**
     * @dev Start a new game session
     * @notice Player must not have an active game already
     */
    function startGame() external {
        require(!hasActiveGame[msg.sender], "Game already in progress");

        hasActiveGame[msg.sender] = true;

        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev End a game session and record statistics
     * @param score The final score achieved
     * @param moves The number of moves made
     * @param timeElapsed The time taken to complete the game in seconds
     * @param won Whether the player won the game
     */
    function endGame(
        uint256 score,
        uint256 moves,
        uint256 timeElapsed,
        bool won
    ) external {
        require(hasActiveGame[msg.sender], "No active game");

        PlayerStats storage stats = playerStats[msg.sender];

        // Update games played
        stats.gamesPlayed++;
        totalGames++;

        // Update total score
        stats.totalScore += score;

        bool newPersonalRecord = false;

        if (won) {
            // Update wins
            stats.gamesWon++;
            totalWins++;

            // Update best score
            if (score > stats.bestScore) {
                stats.bestScore = score;
                newPersonalRecord = true;

                // Check for global record
                if (score > globalBestScore) {
                    globalBestScore = score;
                    globalBestScoreHolder = msg.sender;
                    emit NewGlobalRecord(msg.sender, score, block.timestamp);
                }
            }

            // Update fastest win time
            if (stats.fastestWinTime == 0 || timeElapsed < stats.fastestWinTime) {
                stats.fastestWinTime = timeElapsed;
            }

            // Update fewest moves
            if (stats.fewestMoves == 0 || moves < stats.fewestMoves) {
                stats.fewestMoves = moves;
            }
        }

        // Clear active game flag
        hasActiveGame[msg.sender] = false;

        emit GameEnded(
            msg.sender,
            score,
            moves,
            timeElapsed,
            won,
            newPersonalRecord,
            block.timestamp
        );
    }

    /**
     * @dev Get player statistics
     * @param player The address of the player
     * @return gamesPlayed Total games played
     * @return gamesWon Total games won
     * @return totalScore Cumulative score across all games
     * @return bestScore Highest score achieved
     * @return fastestWinTime Fastest winning time in seconds (0 if no wins)
     * @return fewestMoves Fewest moves in a winning game (0 if no wins)
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 gamesWon,
            uint256 totalScore,
            uint256 bestScore,
            uint256 fastestWinTime,
            uint256 fewestMoves
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.gamesWon,
            stats.totalScore,
            stats.bestScore,
            stats.fastestWinTime,
            stats.fewestMoves
        );
    }

    /**
     * @dev Check if a player has an active game
     * @param player The address of the player
     * @return bool True if player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return hasActiveGame[player];
    }

    /**
     * @dev Get global best score and holder
     * @return score The global best score
     * @return holder The address of the player holding the record
     */
    function getGlobalRecord()
        external
        view
        returns (uint256 score, address holder)
    {
        return (globalBestScore, globalBestScoreHolder);
    }

    /**
     * @dev Get win rate for a player
     * @param player The address of the player
     * @return winRate The win rate as a percentage (scaled by 100)
     */
    function getWinRate(address player) external view returns (uint256 winRate) {
        PlayerStats memory stats = playerStats[player];
        if (stats.gamesPlayed == 0) {
            return 0;
        }
        return (stats.gamesWon * 10000) / stats.gamesPlayed; // Scaled by 100 for 2 decimal precision
    }

    /**
     * @dev Get average score for a player
     * @param player The address of the player
     * @return avgScore The average score across all games
     */
    function getAverageScore(address player) external view returns (uint256 avgScore) {
        PlayerStats memory stats = playerStats[player];
        if (stats.gamesPlayed == 0) {
            return 0;
        }
        return stats.totalScore / stats.gamesPlayed;
    }
}
