// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title ConnectFive
 * @dev Simple game session tracking for Connect Five (Connect Four) on Celo
 * @notice This contract tracks game sessions and player statistics
 */
contract ConnectFive {
    // ========================================
    // ENUMS & STRUCTS
    // ========================================

    enum GameResult {
        WIN,
        LOSE,
        DRAW
    }

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;
        uint256 losses;
        uint256 draws;
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasActiveGame;

    uint256 public totalGames;

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(address indexed player, uint256 timestamp);
    event GameEnded(address indexed player, GameResult result, uint256 timestamp);

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Start a new game session
     * @notice Player must not have an active game
     */
    function startGame() external {
        require(!hasActiveGame[msg.sender], "Game already in progress");

        hasActiveGame[msg.sender] = true;

        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev End the current game and record result
     * @param result The game result (WIN, LOSE, or DRAW)
     * @notice Player must have an active game
     */
    function endGame(GameResult result) external {
        require(hasActiveGame[msg.sender], "No active game");

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;

        if (result == GameResult.WIN) {
            stats.wins++;
        } else if (result == GameResult.LOSE) {
            stats.losses++;
        } else {
            stats.draws++;
        }

        hasActiveGame[msg.sender] = false;
        totalGames++;

        emit GameEnded(msg.sender, result, block.timestamp);
    }

    /**
     * @dev Get player statistics
     * @param player The player address
     * @return gamesPlayed Total games played
     * @return wins Total wins
     * @return losses Total losses
     * @return draws Total draws
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 losses,
            uint256 draws
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (stats.gamesPlayed, stats.wins, stats.losses, stats.draws);
    }

    /**
     * @dev Check if player has an active game
     * @param player The player address
     * @return True if player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return hasActiveGame[player];
    }
}
