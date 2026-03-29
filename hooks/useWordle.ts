'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useAccount, useWriteContract, useReadContract, useWaitForTransactionReceipt } from 'wagmi';
import { getRandomWord, isValidWord } from '@/lib/games/wordle-words';

export type GameMode = 'free' | 'onchain';
export type GameStatus = 'idle' | 'waiting_start' | 'playing' | 'waiting_end' | 'won' | 'lost';
export type LetterStatus = 'correct' | 'present' | 'absent' | 'empty' | 'active';

export interface LetterCell {
  letter: string;
  status: LetterStatus;
}

export interface WordleStats {
  games: number;
  wins: number;
  streak: number;
  bestStreak: number;
  distribution: Record<1 | 2 | 3 | 4 | 5 | 6, number>; // wins per attempt count
}

const WORD_LENGTH = 5;
const MAX_ATTEMPTS = 6;
const STATS_KEY = 'wordle_celo_stats';

const DEFAULT_STATS: WordleStats = {
  games: 0,
  wins: 0,
  streak: 0,
  bestStreak: 0,
  distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0 },
};

// Minimal ABI for on-chain mode (no fee required)
const WORDLE_ABI = [
  {
    name: 'startGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'endGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'won', type: 'bool' },
      { name: 'attempts', type: 'uint8' },
    ],
    outputs: [],
  },
  {
    name: 'abandonGame',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [],
    outputs: [],
  },
  {
    name: 'getPlayerStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'gamesPlayed', type: 'uint256' },
      { name: 'wins', type: 'uint256' },
      { name: 'currentStreak', type: 'uint256' },
      { name: 'bestStreak', type: 'uint256' },
      { name: 'bestAttempts', type: 'uint256' },
      { name: 'distribution', type: 'uint256[6]' },
    ],
  },
  {
    name: 'isGameActive',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ name: '', type: 'bool' }],
  },
] as const;

function buildEmptyGrid(): LetterCell[][] {
  return Array.from({ length: MAX_ATTEMPTS }, () =>
    Array.from({ length: WORD_LENGTH }, () => ({ letter: '', status: 'empty' as LetterStatus }))
  );
}

function evaluateGuess(guess: string, target: string): LetterStatus[] {
  const result: LetterStatus[] = Array(WORD_LENGTH).fill('absent');
  const targetArr = target.split('');
  const guessArr = guess.split('');

  // First pass: mark correct positions
  const remainingTarget: (string | null)[] = [...targetArr];
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === targetArr[i]) {
      result[i] = 'correct';
      remainingTarget[i] = null;
    }
  }

  // Second pass: mark present (wrong position)
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === 'correct') continue;
    const idx = remainingTarget.indexOf(guessArr[i]);
    if (idx !== -1) {
      result[i] = 'present';
      remainingTarget[idx] = null;
    }
  }

  return result;
}

export function useWordle(contractAddress?: `0x${string}` | null) {
  const { address, isConnected } = useAccount();

  const [mode, setMode] = useState<GameMode>('free');
  const [status, setStatus] = useState<GameStatus>('idle');
  const [target, setTarget] = useState<string>('');
  const [grid, setGrid] = useState<LetterCell[][]>(buildEmptyGrid());
  const [currentRow, setCurrentRow] = useState(0);
  const [currentInput, setCurrentInput] = useState('');
  const [message, setMessage] = useState('');
  const [invalidWord, setInvalidWord] = useState(false); // shake animation trigger
  const [stats, setStats] = useState<WordleStats>(DEFAULT_STATS);
  const [usedLetters, setUsedLetters] = useState<Record<string, LetterStatus>>({});
  const [revealRow, setRevealRow] = useState<number | null>(null); // which row is currently being revealed

  // On-chain tx tracking
  const [startTxHash, setStartTxHash] = useState<`0x${string}` | undefined>(undefined);
  const [endTxHash, setEndTxHash] = useState<`0x${string}` | undefined>(undefined);

  // Pending end args stored while waiting for endGame confirmation
  const pendingEndRef = useRef<{
    statsUpdate: WordleStats;
    finalStatus: 'won' | 'lost';
    finalMessage: string;
  } | null>(null);

  const { writeContractAsync } = useWriteContract();

  // Wait for startGame confirmation
  const { isSuccess: startConfirmed, isError: startFailed } = useWaitForTransactionReceipt({
    hash: startTxHash,
  });

  // Wait for endGame confirmation
  const { isSuccess: endConfirmed, isError: endFailed } = useWaitForTransactionReceipt({
    hash: endTxHash,
  });

  // Read on-chain stats
  const { data: chainStats, refetch: refetchChainStats } = useReadContract({
    address: contractAddress ?? undefined,
    abi: WORDLE_ABI,
    functionName: 'getPlayerStats',
    args: address ? [address] : undefined,
    query: { enabled: !!contractAddress && !!address && mode === 'onchain' },
  });

  // Load local stats
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STATS_KEY);
      if (stored) setStats(JSON.parse(stored));
    } catch {}
  }, []);

  function saveStats(updated: WordleStats) {
    setStats(updated);
    try { localStorage.setItem(STATS_KEY, JSON.stringify(updated)); } catch {}
  }

  // startGame confirmed → start playing
  useEffect(() => {
    if (startConfirmed && status === 'waiting_start') {
      setStatus('playing');
      setStartTxHash(undefined);
    }
  }, [startConfirmed, status]);

  // startGame failed → back to idle
  useEffect(() => {
    if (startFailed && status === 'waiting_start') {
      setMessage('Transaction failed');
      setStatus('idle');
      setStartTxHash(undefined);
    }
  }, [startFailed, status]);

  // endGame confirmed → show final result
  useEffect(() => {
    if (endConfirmed && status === 'waiting_end' && pendingEndRef.current) {
      const { statsUpdate, finalStatus, finalMessage } = pendingEndRef.current;
      saveStats(statsUpdate);
      setMessage(finalMessage);
      setStatus(finalStatus);
      refetchChainStats();
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endConfirmed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // endGame failed → still show result
  useEffect(() => {
    if (endFailed && status === 'waiting_end' && pendingEndRef.current) {
      const { statsUpdate, finalStatus, finalMessage } = pendingEndRef.current;
      saveStats(statsUpdate);
      setMessage(finalMessage);
      setStatus(finalStatus);
      setEndTxHash(undefined);
      pendingEndRef.current = null;
    }
  }, [endFailed, status]); // eslint-disable-line react-hooks/exhaustive-deps

  const startGame = useCallback(async () => {
    const word = getRandomWord();
    setTarget(word);
    setGrid(buildEmptyGrid());
    setCurrentRow(0);
    setCurrentInput('');
    setMessage('');
    setUsedLetters({});
    setRevealRow(null);
    setInvalidWord(false);
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;

    if (mode === 'onchain' && contractAddress && isConnected) {
      setStatus('waiting_start');
      try {
        const hash = await writeContractAsync({
          address: contractAddress,
          abi: WORDLE_ABI,
          functionName: 'startGame',
        });
        setStartTxHash(hash);
      } catch {
        setMessage('Transaction rejected');
        setStatus('idle');
      }
      return;
    }

    setStatus('playing');
  }, [mode, contractAddress, isConnected, writeContractAsync]);

  const resetGame = useCallback(() => {
    // Fire-and-forget abandonGame if mid-game on-chain
    if (status === 'playing' && mode === 'onchain' && contractAddress && isConnected) {
      writeContractAsync({
        address: contractAddress,
        abi: WORDLE_ABI,
        functionName: 'abandonGame',
      }).catch(() => {});
    }
    setStatus('idle');
    setGrid(buildEmptyGrid());
    setCurrentRow(0);
    setCurrentInput('');
    setMessage('');
    setUsedLetters({});
    setRevealRow(null);
    setInvalidWord(false);
    setStartTxHash(undefined);
    setEndTxHash(undefined);
    pendingEndRef.current = null;
  }, [status, mode, contractAddress, isConnected, writeContractAsync]);

  const switchMode = useCallback((newMode: GameMode) => {
    setMode(newMode);
    resetGame();
  }, [resetGame]);

  const submitGuess = useCallback(async () => {
    if (status !== 'playing') return;
    if (currentInput.length !== WORD_LENGTH) {
      setMessage('Not enough letters');
      return;
    }
    const guess = currentInput.toUpperCase();
    if (!isValidWord(guess)) {
      setMessage('Not in word list');
      setInvalidWord(true);
      setTimeout(() => setInvalidWord(false), 600);
      return;
    }

    const statuses = evaluateGuess(guess, target);

    // Build updated grid row
    const newGrid = grid.map((row, rIdx) => {
      if (rIdx !== currentRow) return row;
      return guess.split('').map((letter, cIdx) => ({
        letter,
        status: statuses[cIdx],
      }));
    });
    setGrid(newGrid);
    setRevealRow(currentRow);

    // Update used letters (keep best status)
    const statusPriority: Record<LetterStatus, number> = {
      correct: 3, present: 2, absent: 1, empty: 0, active: 0,
    };
    setUsedLetters(prev => {
      const updated = { ...prev };
      guess.split('').forEach((letter, i) => {
        const cur = updated[letter];
        if (!cur || statusPriority[statuses[i]] > statusPriority[cur]) {
          updated[letter] = statuses[i];
        }
      });
      return updated;
    });

    setCurrentInput('');
    const nextRow = currentRow + 1;
    const won = statuses.every(s => s === 'correct');

    // Wait for flip animation before showing result
    setTimeout(async () => {
      setRevealRow(null);

      if (won) {
        const messages = ['Genius!', 'Magnificent!', 'Impressive!', 'Splendid!', 'Great!', 'Phew!'];
        const finalMessage = messages[currentRow] ?? 'Well done!';
        setCurrentRow(nextRow);

        const updated: WordleStats = {
          ...stats,
          games: stats.games + 1,
          wins: stats.wins + 1,
          streak: stats.streak + 1,
          bestStreak: Math.max(stats.bestStreak, stats.streak + 1),
          distribution: {
            ...stats.distribution,
            [(nextRow) as 1 | 2 | 3 | 4 | 5 | 6]:
              (stats.distribution[nextRow as 1] ?? 0) + 1,
          },
        };

        if (mode === 'onchain' && contractAddress && isConnected) {
          setMessage(finalMessage);
          setStatus('waiting_end');
          pendingEndRef.current = { statsUpdate: updated, finalStatus: 'won', finalMessage };
          try {
            const hash = await writeContractAsync({
              address: contractAddress,
              abi: WORDLE_ABI,
              functionName: 'endGame',
              args: [true, nextRow],
            });
            setEndTxHash(hash);
          } catch {
            saveStats(updated);
            setStatus('won');
            pendingEndRef.current = null;
          }
        } else {
          saveStats(updated);
          setMessage(finalMessage);
          setStatus('won');
        }

      } else if (nextRow >= MAX_ATTEMPTS) {
        const finalMessage = `The word was ${target}`;
        setCurrentRow(nextRow);

        const updated: WordleStats = {
          ...stats,
          games: stats.games + 1,
          streak: 0,
        };

        if (mode === 'onchain' && contractAddress && isConnected) {
          setMessage(finalMessage);
          setStatus('waiting_end');
          pendingEndRef.current = { statsUpdate: updated, finalStatus: 'lost', finalMessage };
          try {
            const hash = await writeContractAsync({
              address: contractAddress,
              abi: WORDLE_ABI,
              functionName: 'endGame',
              args: [false, MAX_ATTEMPTS],
            });
            setEndTxHash(hash);
          } catch {
            saveStats(updated);
            setStatus('lost');
            pendingEndRef.current = null;
          }
        } else {
          saveStats(updated);
          setMessage(finalMessage);
          setStatus('lost');
        }

      } else {
        setCurrentRow(nextRow);
        setMessage('');
      }
    }, WORD_LENGTH * 350 + 200); // wait for flip animation
  }, [status, currentInput, target, grid, currentRow, stats, mode, contractAddress, isConnected, writeContractAsync]);

  const addLetter = useCallback((letter: string) => {
    if (status !== 'playing') return;
    if (currentInput.length >= WORD_LENGTH) return;
    setCurrentInput(prev => prev + letter.toUpperCase());
    setMessage('');
  }, [status, currentInput.length]);

  const removeLetter = useCallback(() => {
    if (status !== 'playing') return;
    setCurrentInput(prev => prev.slice(0, -1));
  }, [status]);

  // Keyboard input
  useEffect(() => {
    if (status !== 'playing') return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.key === 'Enter') {
        submitGuess();
      } else if (e.key === 'Backspace') {
        removeLetter();
      } else if (/^[a-zA-Z]$/.test(e.key)) {
        addLetter(e.key);
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [status, submitGuess, removeLetter, addLetter]);

  // Build display grid (fill current row with typed input)
  const displayGrid: LetterCell[][] = grid.map((row, rIdx) => {
    if (rIdx === currentRow && status === 'playing') {
      return row.map((cell, cIdx) => ({
        letter: currentInput[cIdx] ?? '',
        status: currentInput[cIdx] ? 'active' : 'empty',
      }));
    }
    return row;
  });

  return {
    mode,
    status,
    grid: displayGrid,
    currentRow,
    currentInput,
    message,
    invalidWord,
    usedLetters,
    revealRow,
    stats,
    chainStats,
    isConnected,
    wordLength: WORD_LENGTH,
    maxAttempts: MAX_ATTEMPTS,
    startGame,
    resetGame,
    switchMode,
    submitGuess,
    addLetter,
    removeLetter,
  };
}
