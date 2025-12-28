import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http } from 'viem';
import { celoAlfajores } from 'viem/chains';

/**
 * Test wallet configuration for Alfajores testnet
 *
 * IMPORTANT: This is a TEST wallet for Alfajores testnet ONLY.
 * DO NOT use this private key on mainnet or store real funds.
 *
 * To fund this wallet:
 * 1. Go to https://faucet.celo.org
 * 2. Enter the address: 0x7E5F4552091A69125d5DfCb7b8C2659029395Bdf
 * 3. Request testnet CELO
 */

// Test private key from environment or default test key
const TEST_PRIVATE_KEY = process.env.TEST_WALLET_PRIVATE_KEY as `0x${string}` ||
  '0x0000000000000000000000000000000000000000000000000000000000000001' as `0x${string}`;

// Create account from private key
export const testAccount = privateKeyToAccount(TEST_PRIVATE_KEY);

// Public client for reading blockchain data
export const publicClient = createPublicClient({
  chain: celoAlfajores,
  transport: http('https://alfajores-forno.celo-testnet.org'),
});

// Wallet client for sending transactions
export const walletClient = createWalletClient({
  account: testAccount,
  chain: celoAlfajores,
  transport: http('https://alfajores-forno.celo-testnet.org'),
});

// Test wallet address
export const TEST_WALLET_ADDRESS = testAccount.address;

/**
 * Check if test wallet has sufficient CELO balance
 * @param minBalance Minimum balance in CELO (default: 0.1)
 * @returns true if balance is sufficient
 */
export async function hasInsufficientBalance(minBalance: bigint = 100000000000000000n): Promise<boolean> {
  const balance = await publicClient.getBalance({
    address: TEST_WALLET_ADDRESS,
  });

  return balance < minBalance;
}

/**
 * Get test wallet balance in CELO
 * @returns Balance in CELO as a number
 */
export async function getTestWalletBalance(): Promise<number> {
  const balance = await publicClient.getBalance({
    address: TEST_WALLET_ADDRESS,
  });

  // Convert from wei to CELO
  return Number(balance) / 1e18;
}

/**
 * Wait for transaction to be mined
 * @param hash Transaction hash
 * @returns Transaction receipt
 */
export async function waitForTransaction(hash: `0x${string}`) {
  return await publicClient.waitForTransactionReceipt({
    hash,
    timeout: 60_000, // 60 seconds
  });
}

/**
 * Alfajores testnet configuration
 */
export const ALFAJORES_CONFIG = {
  chainId: 44787,
  name: 'Celo Alfajores Testnet',
  rpcUrl: 'https://alfajores-forno.celo-testnet.org',
  blockExplorer: 'https://alfajores.celoscan.io',
  faucet: 'https://faucet.celo.org',
  nativeCurrency: {
    name: 'CELO',
    symbol: 'CELO',
    decimals: 18,
  },
};

/**
 * Check if we're connected to Alfajores
 */
export async function isConnectedToAlfajores(): Promise<boolean> {
  const chainId = await publicClient.getChainId();
  return chainId === ALFAJORES_CONFIG.chainId;
}

/**
 * Get current block number
 */
export async function getCurrentBlockNumber(): Promise<bigint> {
  return await publicClient.getBlockNumber();
}

/**
 * Estimate gas for a transaction
 */
export async function estimateGas(transaction: any): Promise<bigint> {
  return await publicClient.estimateGas(transaction);
}
