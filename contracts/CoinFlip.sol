// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

/**
 * @title CoinFlip
 * @dev Game session tracking for Coin Flip (BTC vs ETH) on Celo
 * @notice Tracks flips, wins, streaks and best streaks per player.
 *         The random outcome is resolved client-side; the contract
 *         records the declared result trustlessly for leaderboard purposes.
 */
contract CoinFlip {
    // ========================================
    // STRUCTS
    // ========================================

    struct PlayerStats {
        uint256 gamesPlayed;
        uint256 wins;
        uint256 losses;
        uint256 currentStreak;   // current consecutive wins
        uint256 bestStreak;      // all-time best consecutive wins
    }

    // ========================================
    // STATE VARIABLES
    // ========================================

    mapping(address => PlayerStats) public playerStats;
    mapping(address => bool) public hasActiveGame;

    uint256 public totalGames;
    uint256 public globalBestStreak;
    address public globalBestStreakHolder;

    // ========================================
    // EVENTS
    // ========================================

    event GameStarted(address indexed player, uint256 timestamp);

    event GameEnded(
        address indexed player,
        bool won,
        uint256 streak,
        bool newBestStreak,
        uint256 timestamp
    );

    event GameAbandoned(address indexed player, uint256 timestamp);

    event NewGlobalBestStreak(
        address indexed player,
        uint256 streak,
        uint256 timestamp
    );

    // ========================================
    // EXTERNAL FUNCTIONS
    // ========================================

    /**
     * @dev Start a new flip session (silent replace if already active)
     */
    function startGame() external {
        hasActiveGame[msg.sender] = true;
        emit GameStarted(msg.sender, block.timestamp);
    }

    /**
     * @dev Record the result of a flip
     * @param won Whether the player won this flip
     */
    function endGame(bool won) external {
        require(hasActiveGame[msg.sender], "No active game");

        PlayerStats storage stats = playerStats[msg.sender];

        stats.gamesPlayed++;

        bool newBestStreak = false;

        if (won) {
            stats.wins++;
            stats.currentStreak++;

            if (stats.currentStreak > stats.bestStreak) {
                stats.bestStreak = stats.currentStreak;
                newBestStreak = true;
            }

            if (stats.currentStreak > globalBestStreak) {
                globalBestStreak = stats.currentStreak;
                globalBestStreakHolder = msg.sender;
                emit NewGlobalBestStreak(msg.sender, stats.currentStreak, block.timestamp);
            }
        } else {
            stats.losses++;
            stats.currentStreak = 0;
        }

        hasActiveGame[msg.sender] = false;
        totalGames++;

        emit GameEnded(msg.sender, won, stats.currentStreak, newBestStreak, block.timestamp);
    }

    /**
     * @dev Abandon the current active game
     */
    function abandonGame() external {
        require(hasActiveGame[msg.sender], "No active game");
        hasActiveGame[msg.sender] = false;
        emit GameAbandoned(msg.sender, block.timestamp);
    }

    /**
     * @dev Get player statistics
     */
    function getPlayerStats(address player)
        external
        view
        returns (
            uint256 gamesPlayed,
            uint256 wins,
            uint256 losses,
            uint256 currentStreak,
            uint256 bestStreak
        )
    {
        PlayerStats memory stats = playerStats[player];
        return (
            stats.gamesPlayed,
            stats.wins,
            stats.losses,
            stats.currentStreak,
            stats.bestStreak
        );
    }

    /**
     * @dev Check if player has an active game
     */
    function isGameActive(address player) external view returns (bool) {
        return hasActiveGame[player];
    }

    /**
     * @dev Get global best streak information
     */
    function getGlobalBestStreak()
        external
        view
        returns (uint256 streak, address holder)
    {
        return (globalBestStreak, globalBestStreakHolder);
    }
}
