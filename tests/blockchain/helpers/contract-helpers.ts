import { parseEventLogs, type Log } from 'viem';
import { publicClient, walletClient, testAccount } from '../setup/test-wallet';

// Import contract ABIs and addresses
import { CONTRACT_ADDRESS as BLACKJACK_ADDRESS, CONTRACT_ABI as BLACKJACK_ABI } from '@/lib/contracts/blackjack-abi';
import { RPS_CONTRACT_ADDRESS, RPS_CONTRACT_ABI } from '@/lib/contracts/rps-abi';
import { TICTACTOE_CONTRACT_ADDRESS, TICTACTOE_CONTRACT_ABI } from '@/lib/contracts/tictactoe-abi';
import { JACKPOT_CONTRACT_ADDRESS, JACKPOT_CONTRACT_ABI } from '@/lib/contracts/jackpot-abi';
import { GAME2048_CONTRACT_ADDRESS, GAME2048_CONTRACT_ABI } from '@/lib/contracts/2048-abi';
import { MASTERMIND_CONTRACT_ADDRESS, MASTERMIND_CONTRACT_ABI } from '@/lib/contracts/mastermind-abi';

/**
 * Read stats from Blackjack contract
 */
export async function getBlackjackStats(address?: `0x${string}`) {
  const playerAddress = address || testAccount.address;

  const stats = await publicClient.readContract({
    address: BLACKJACK_ADDRESS,
    abi: BLACKJACK_ABI,
    functionName: 'getStats',
    args: [],
    account: playerAddress,
  });

  return {
    wins: stats[0],
    losses: stats[1],
    pushes: stats[2],
    blackjacks: stats[3],
    totalGames: stats[4],
    winRate: stats[5],
    currentStreak: stats[6],
    bestStreak: stats[7],
  };
}

/**
 * Play a Blackjack game on-chain
 */
export async function playBlackjackGame() {
  const { request } = await publicClient.simulateContract({
    address: BLACKJACK_ADDRESS,
    abi: BLACKJACK_ABI,
    functionName: 'playGame',
    account: testAccount,
  });

  const hash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
  });

  return { hash, receipt };
}

/**
 * Parse GamePlayed event from transaction receipt
 */
export function parseGamePlayedEvent(logs: Log[]) {
  const events = parseEventLogs({
    abi: BLACKJACK_ABI,
    logs,
  });

  const gamePlayedEvent = events.find(event => event.eventName === 'GamePlayed');

  if (!gamePlayedEvent) {
    return null;
  }

  const { args } = gamePlayedEvent as any;

  return {
    player: args.player,
    playerCards: args.playerCards,
    dealerCards: args.dealerCards,
    playerTotal: args.playerTotal,
    dealerTotal: args.dealerTotal,
    outcome: args.outcome,
  };
}

/**
 * Read stats from RPS contract
 */
export async function getRPSStats(address?: `0x${string}`) {
  const playerAddress = address || testAccount.address;

  const stats = await publicClient.readContract({
    address: RPS_CONTRACT_ADDRESS,
    abi: RPS_CONTRACT_ABI,
    functionName: 'obtenirStats',
    args: [],
    account: playerAddress,
  });

  return {
    wins: stats[0],
    losses: stats[1],
    draws: stats[2],
    totalGames: stats[3],
    winRate: stats[4],
    currentStreak: stats[5],
    bestStreak: stats[6],
  };
}

/**
 * Play RPS game on-chain
 */
export async function playRPSGame(choice: 0 | 1 | 2) {
  const { request } = await publicClient.simulateContract({
    address: RPS_CONTRACT_ADDRESS,
    abi: RPS_CONTRACT_ABI,
    functionName: 'play',
    args: [choice],
    account: testAccount,
  });

  const hash = await walletClient.writeContract(request);

  const receipt = await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000,
  });

  return { hash, receipt };
}

/**
 * Read stats from Mastermind contract
 */
export async function getMastermindStats(address?: `0x${string}`) {
  const playerAddress = address || testAccount.address;

  const stats = await publicClient.readContract({
    address: MASTERMIND_CONTRACT_ADDRESS,
    abi: MASTERMIND_CONTRACT_ABI,
    functionName: 'getStats',
    args: [],
    account: playerAddress,
  });

  return {
    gamesPlayed: stats[0],
    gamesWon: stats[1],
    gamesLost: stats[2],
    totalAttempts: stats[3],
    averageAttempts: stats[4],
    bestScore: stats[5],
  };
}

/**
 * Check contract balance
 */
export async function getContractBalance(contractAddress: `0x${string}`) {
  const balance = await publicClient.getBalance({
    address: contractAddress,
  });

  return balance;
}

/**
 * Get transaction by hash
 */
export async function getTransaction(hash: `0x${string}`) {
  return await publicClient.getTransaction({ hash });
}

/**
 * Get block by number
 */
export async function getBlock(blockNumber: bigint) {
  return await publicClient.getBlock({ blockNumber });
}

/**
 * Verify transaction was mined
 */
export async function isTransactionMined(hash: `0x${string}`): Promise<boolean> {
  try {
    const receipt = await publicClient.getTransactionReceipt({ hash });
    return receipt.status === 'success';
  } catch {
    return false;
  }
}

/**
 * Get logs for a specific event
 */
export async function getEventLogs(
  contractAddress: `0x${string}`,
  abi: any[],
  eventName: string,
  fromBlock: bigint,
  toBlock: bigint = 'latest' as any
) {
  const logs = await publicClient.getLogs({
    address: contractAddress,
    event: abi.find(item => item.type === 'event' && item.name === eventName),
    fromBlock,
    toBlock,
  });

  return logs;
}

/**
 * Estimate gas for contract call
 */
export async function estimateContractGas(
  contractAddress: `0x${string}`,
  abi: any[],
  functionName: string,
  args: any[] = []
) {
  const gas = await publicClient.estimateContractGas({
    address: contractAddress,
    abi,
    functionName,
    args,
    account: testAccount,
  });

  return gas;
}

/**
 * Check if contract is deployed
 */
export async function isContractDeployed(contractAddress: `0x${string}`): Promise<boolean> {
  const code = await publicClient.getBytecode({
    address: contractAddress,
  });

  return code !== undefined && code !== '0x';
}

/**
 * Wait for multiple transactions
 */
export async function waitForTransactions(hashes: `0x${string}`[]) {
  const receipts = await Promise.all(
    hashes.map(hash =>
      publicClient.waitForTransactionReceipt({
        hash,
        timeout: 60_000,
      })
    )
  );

  return receipts;
}
