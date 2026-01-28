/**
 * useConnectFiveMultiplayer Hook
 * Wraps useMultiplayer with Connect Five (Connect 4) specific logic
 *
 * Connect Five Multiplayer Flow:
 * 1. Players take turns dropping pieces into columns
 * 2. Pieces fall to the lowest available row
 * 3. First player to connect 4 in a row wins
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import { useMultiplayer } from './useMultiplayer';
import type { ConnectFiveState } from '@/lib/multiplayer/types';
import { ROWS, COLS, type Board, type Player } from './useConnectFive';

type GameResult = 'win' | 'lose' | 'draw' | null;

const WIN_LENGTH = 4;

// Create empty board
function createEmptyBoard(): Board {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(null));
}

// Get the row where a piece would land in a column
function getDropRow(board: Board, col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[row][col] === null) {
      return row;
    }
  }
  return -1; // Column is full
}

// Check for win at a specific position
function checkWin(board: Board, row: number, col: number, player: Player): { row: number; col: number }[] | null {
  const directions = [
    [0, 1],  // horizontal
    [1, 0],  // vertical
    [1, 1],  // diagonal \
    [1, -1], // diagonal /
  ];

  for (const [dx, dy] of directions) {
    const cells: { row: number; col: number }[] = [{ row, col }];

    // Check positive direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const newRow = row + i * dx;
      const newCol = col + i * dy;
      if (
        newRow >= 0 && newRow < ROWS &&
        newCol >= 0 && newCol < COLS &&
        board[newRow][newCol] === player
      ) {
        cells.push({ row: newRow, col: newCol });
      } else break;
    }

    // Check negative direction
    for (let i = 1; i < WIN_LENGTH; i++) {
      const newRow = row - i * dx;
      const newCol = col - i * dy;
      if (
        newRow >= 0 && newRow < ROWS &&
        newCol >= 0 && newCol < COLS &&
        board[newRow][newCol] === player
      ) {
        cells.push({ row: newRow, col: newCol });
      } else break;
    }

    if (cells.length >= WIN_LENGTH) return cells;
  }

  return null;
}

// Check if board is full
function isBoardFull(board: Board): boolean {
  return board[0].every(cell => cell !== null);
}

interface UseConnectFiveMultiplayerReturn {
  // Game state
  board: Board;
  isMyTurn: boolean;
  myColor: 'red' | 'yellow' | null;
  opponentColor: 'red' | 'yellow' | null;
  result: GameResult;
  winningCells: { row: number; col: number }[] | null;
  lastMove: { row: number; col: number } | null;

  // Multiplayer state (from useMultiplayer)
  status: string;
  room: ReturnType<typeof useMultiplayer>['room'];
  players: ReturnType<typeof useMultiplayer>['players'];
  myPlayerNumber: number | null;
  opponent: ReturnType<typeof useMultiplayer>['opponent'];
  error: string | null;
  isSearching: boolean;
  isConnected: boolean;
  myStats: ReturnType<typeof useMultiplayer>['myStats'];
  opponentStats: ReturnType<typeof useMultiplayer>['opponentStats'];

  // Actions
  handleMove: (col: number) => Promise<void>;
  findMatch: (mode: 'ranked' | 'casual') => Promise<void>;
  createPrivateRoom: () => Promise<string>;
  joinByCode: (code: string) => Promise<void>;
  setReady: (ready: boolean) => Promise<void>;
  leaveRoom: () => Promise<void>;
  cancelSearch: () => void;
  surrender: () => Promise<void>;
  playAgain: () => void;
}

export function useConnectFiveMultiplayer(): UseConnectFiveMultiplayerReturn {
  const [board, setBoard] = useState<Board>(createEmptyBoard());
  const [result, setResult] = useState<GameResult>(null);
  const [winningCells, setWinningCells] = useState<{ row: number; col: number }[] | null>(null);
  const [lastMove, setLastMove] = useState<{ row: number; col: number } | null>(null);

  // Initialize multiplayer hook
  const multiplayer = useMultiplayer({
    gameId: 'connectfive',
    onGameStart: () => {
      console.log('[Connect Five Multiplayer] Game started');
      // Reset board when game starts
      setBoard(createEmptyBoard());
      setResult(null);
      setWinningCells(null);
      setLastMove(null);
    },
    onGameEnd: (winnerId, reason) => {
      console.log('[Connect Five Multiplayer] Game ended:', winnerId, reason);
      if (reason === 'draw') {
        setResult('draw');
      } else if (winnerId) {
        const myId = multiplayer.players.find(p => p.player_number === multiplayer.myPlayerNumber)?.user_id;
        setResult(winnerId === myId ? 'win' : 'lose');
      }
    },
    onOpponentAction: (action) => {
      console.log('[Connect Five Multiplayer] Opponent action:', action);
      // Opponent move is handled via game state update
    },
    onGameStateUpdate: (state) => {
      console.log('[Connect Five Multiplayer] Game state update:', state);
      if (state && 'board' in state) {
        const cfState = state as ConnectFiveState;

        // Update board
        setBoard(cfState.board as Board);

        // Update last move
        if (cfState.lastMove) {
          setLastMove(cfState.lastMove);
        }

        // Check for game end
        if (cfState.winner !== null) {
          if (cfState.winner === 'draw') {
            setResult('draw');
          } else {
            setResult(cfState.winner === multiplayer.myPlayerNumber ? 'win' : 'lose');
          }
          if (cfState.winningCells) {
            setWinningCells(cfState.winningCells);
          }
        }
      }
    },
  });

  // Computed values
  const myColor = multiplayer.myPlayerNumber === 1 ? 'red' : multiplayer.myPlayerNumber === 2 ? 'yellow' : null;
  const opponentColor = myColor === 'red' ? 'yellow' : myColor === 'yellow' ? 'red' : null;

  // Get isMyTurn from game state
  const gameState = multiplayer.gameState as ConnectFiveState | null;
  const isMyTurn = gameState?.currentTurn === multiplayer.myPlayerNumber;

  // Handle player move (drop piece in column)
  const handleMove = useCallback(async (col: number) => {
    if (!isMyTurn || multiplayer.status !== 'playing') {
      console.log('[Connect Five Multiplayer] Invalid move:', { isMyTurn, status: multiplayer.status });
      return;
    }

    // Find the row where the piece would land
    const row = getDropRow(board, col);
    if (row === -1) {
      console.log('[Connect Five Multiplayer] Column is full');
      return;
    }

    // Make the move locally first for responsiveness
    const newBoard = board.map(r => [...r]) as Board;
    const myValue = multiplayer.myPlayerNumber as 1 | 2;
    newBoard[row][col] = myValue;
    setBoard(newBoard);
    setLastMove({ row, col });

    // Check for win
    const winCells = checkWin(newBoard, row, col, myValue);
    const isFull = isBoardFull(newBoard);

    // Determine new game state
    const newGameState: ConnectFiveState = {
      board: newBoard,
      currentTurn: myValue === 1 ? 2 : 1, // Switch turns
      lastMove: { row, col },
      winner: winCells ? myValue : (isFull ? 'draw' : null),
      winningCells: winCells || undefined,
    };

    // Send action to server
    await multiplayer.sendAction('move', { col, row });

    // Update game state
    await multiplayer.updateGameState(newGameState);

    // Update local result if game ended
    if (winCells) {
      setResult('win');
      setWinningCells(winCells);
    } else if (isFull) {
      setResult('draw');
    }
  }, [isMyTurn, board, multiplayer]);

  // Play again - reset local state
  const playAgain = useCallback(() => {
    setBoard(createEmptyBoard());
    setResult(null);
    setWinningCells(null);
    setLastMove(null);
  }, []);

  return {
    // Game state
    board,
    isMyTurn,
    myColor,
    opponentColor,
    result,
    winningCells,
    lastMove,

    // Multiplayer state
    status: multiplayer.status,
    room: multiplayer.room,
    players: multiplayer.players,
    myPlayerNumber: multiplayer.myPlayerNumber,
    opponent: multiplayer.opponent,
    error: multiplayer.error,
    isSearching: multiplayer.isSearching,
    isConnected: multiplayer.isConnected,
    myStats: multiplayer.myStats,
    opponentStats: multiplayer.opponentStats,

    // Actions
    handleMove,
    findMatch: multiplayer.findMatch,
    createPrivateRoom: multiplayer.createPrivateRoom,
    joinByCode: multiplayer.joinByCode,
    setReady: multiplayer.setReady,
    leaveRoom: multiplayer.leaveRoom,
    cancelSearch: multiplayer.cancelSearch,
    surrender: multiplayer.surrender,
    playAgain,
  };
}

export default useConnectFiveMultiplayer;
