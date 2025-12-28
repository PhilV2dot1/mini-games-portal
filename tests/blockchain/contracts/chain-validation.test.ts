import { describe, test, expect } from 'vitest';
import {
  publicClient,
  isConnectedToAlfajores,
  getCurrentBlockNumber,
  ALFAJORES_CONFIG,
} from '../setup/test-wallet';
import { isContractDeployed } from '../helpers/contract-helpers';
import { CONTRACT_ADDRESS } from '@/lib/contracts/blackjack-abi';
import { RPS_CONTRACT_ADDRESS } from '@/lib/contracts/rps-abi';
import { TICTACTOE_CONTRACT_ADDRESS } from '@/lib/contracts/tictactoe-abi';
import { JACKPOT_CONTRACT_ADDRESS } from '@/lib/contracts/jackpot-abi';
import { GAME2048_CONTRACT_ADDRESS } from '@/lib/contracts/2048-abi';
import { MASTERMIND_CONTRACT_ADDRESS } from '@/lib/contracts/mastermind-abi';

/**
 * Chain Validation Tests
 *
 * These tests verify that:
 * - Connected to correct network (Alfajores)
 * - All contracts are deployed
 * - Network configuration is correct
 * - Chain ID is correct
 * - Block production is working
 *
 * These tests help ensure that write operations will target
 * the correct network and prevent accidental mainnet transactions.
 */

describe('Chain Validation & Network Tests', () => {
  test('should be connected to Alfajores testnet', async () => {
    const isAlfajores = await isConnectedToAlfajores();
    expect(isAlfajores).toBe(true);
  });

  test('chain ID should be 44787 (Alfajores)', async () => {
    const chainId = await publicClient.getChainId();
    expect(chainId).toBe(ALFAJORES_CONFIG.chainId);
    expect(chainId).toBe(44787);
  });

  test('should NOT be connected to Celo mainnet', async () => {
    const chainId = await publicClient.getChainId();

    // Celo mainnet is chain ID 42220
    expect(chainId).not.toBe(42220);
  });

  test('network should be producing blocks', async () => {
    const block1 = await getCurrentBlockNumber();

    // Wait a bit for new block
    await new Promise(resolve => setTimeout(resolve, 6000)); // ~6 seconds

    const block2 = await getCurrentBlockNumber();

    // Block number should advance (Celo blocks ~5 seconds)
    expect(block2).toBeGreaterThan(block1);
  }, 15000);

  test('RPC endpoint should be reachable', async () => {
    const blockNumber = await getCurrentBlockNumber();

    expect(blockNumber).toBeGreaterThan(0n);
    expect(typeof blockNumber).toBe('bigint');
  });

  test('can fetch block data', async () => {
    const blockNumber = await getCurrentBlockNumber();

    const block = await publicClient.getBlock({
      blockNumber,
    });

    expect(block).toBeDefined();
    expect(block.number).toBe(blockNumber);
    expect(block.hash).toBeDefined();
    expect(block.timestamp).toBeGreaterThan(0n);
  });

  test('Alfajores configuration is correct', () => {
    expect(ALFAJORES_CONFIG.chainId).toBe(44787);
    expect(ALFAJORES_CONFIG.name).toBe('Celo Alfajores Testnet');
    expect(ALFAJORES_CONFIG.rpcUrl).toBe(
      'https://alfajores-forno.celo-testnet.org'
    );
    expect(ALFAJORES_CONFIG.nativeCurrency.symbol).toBe('CELO');
    expect(ALFAJORES_CONFIG.nativeCurrency.decimals).toBe(18);
  });

  describe('Contract Deployments', () => {
    test('Blackjack contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(CONTRACT_ADDRESS);
      expect(isDeployed).toBe(true);
    });

    test('RPS contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(RPS_CONTRACT_ADDRESS);
      expect(isDeployed).toBe(true);
    });

    test('TicTacToe contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(
        TICTACTOE_CONTRACT_ADDRESS as `0x${string}`
      );
      expect(isDeployed).toBe(true);
    });

    test('Jackpot contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(JACKPOT_CONTRACT_ADDRESS);
      expect(isDeployed).toBe(true);
    });

    test('2048 contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(GAME2048_CONTRACT_ADDRESS);
      expect(isDeployed).toBe(true);
    });

    test('Mastermind contract should be deployed', async () => {
      const isDeployed = await isContractDeployed(MASTERMIND_CONTRACT_ADDRESS);
      expect(isDeployed).toBe(true);
    });

    test('all contract addresses should be valid format', () => {
      const addresses = [
        CONTRACT_ADDRESS,
        RPS_CONTRACT_ADDRESS,
        TICTACTOE_CONTRACT_ADDRESS,
        JACKPOT_CONTRACT_ADDRESS,
        GAME2048_CONTRACT_ADDRESS,
        MASTERMIND_CONTRACT_ADDRESS,
      ];

      for (const address of addresses) {
        expect(address).toMatch(/^0x[a-fA-F0-9]{40}$/);
      }
    });

    test('all contracts should have different addresses', () => {
      const addresses = [
        CONTRACT_ADDRESS,
        RPS_CONTRACT_ADDRESS,
        TICTACTOE_CONTRACT_ADDRESS,
        JACKPOT_CONTRACT_ADDRESS,
        GAME2048_CONTRACT_ADDRESS,
        MASTERMIND_CONTRACT_ADDRESS,
      ];

      const uniqueAddresses = new Set(
        addresses.map(addr => addr.toLowerCase())
      );

      expect(uniqueAddresses.size).toBe(addresses.length);
    });
  });

  describe('Network Safety Checks', () => {
    test('should fail if wrong network', async () => {
      const chainId = await publicClient.getChainId();

      // This test ensures we're NOT on mainnet
      if (chainId === 42220) {
        throw new Error('DANGER: Connected to Celo MAINNET instead of testnet!');
      }

      expect(chainId).toBe(44787);
    });

    test('block explorer URL should be for testnet', () => {
      expect(ALFAJORES_CONFIG.blockExplorer).toContain('alfajores');
      expect(ALFAJORES_CONFIG.blockExplorer).not.toContain('celoscan.io/address');
    });

    test('faucet URL should be available', () => {
      expect(ALFAJORES_CONFIG.faucet).toBe('https://faucet.celo.org');
    });
  });

  describe('Block Information', () => {
    test('can get latest block', async () => {
      const block = await publicClient.getBlock({
        blockTag: 'latest',
      });

      expect(block).toBeDefined();
      expect(block.number).toBeGreaterThan(0n);
    });

    test('block timestamp should be recent', async () => {
      const block = await publicClient.getBlock({
        blockTag: 'latest',
      });

      const now = Math.floor(Date.now() / 1000);
      const blockTime = Number(block.timestamp);

      // Block should be within last minute
      expect(now - blockTime).toBeLessThan(60);
    });

    test('block should have transactions', async () => {
      const block = await publicClient.getBlock({
        blockTag: 'latest',
        includeTransactions: false,
      });

      // Block should have transaction hashes
      expect(Array.isArray(block.transactions)).toBe(true);
    });
  });

  describe('Gas and Fee Estimation', () => {
    test('can estimate gas for balance check', async () => {
      const gas = await publicClient.estimateGas({
        account: '0x0000000000000000000000000000000000000000',
        to: '0x0000000000000000000000000000000000000001',
        value: 1n,
      });

      expect(gas).toBeGreaterThan(0n);
    });

    test('gas price should be reasonable', async () => {
      const gasPrice = await publicClient.getGasPrice();

      // Gas price should be greater than 0
      expect(gasPrice).toBeGreaterThan(0n);

      // Gas price should be less than 1 CELO (sanity check)
      expect(gasPrice).toBeLessThan(1000000000000000000n);
    });
  });

  describe('RPC Capabilities', () => {
    test('supports eth_chainId', async () => {
      const chainId = await publicClient.getChainId();
      expect(chainId).toBe(44787);
    });

    test('supports eth_blockNumber', async () => {
      const blockNumber = await getCurrentBlockNumber();
      expect(blockNumber).toBeGreaterThan(0n);
    });

    test('supports eth_getBalance', async () => {
      const balance = await publicClient.getBalance({
        address: '0x0000000000000000000000000000000000000000',
      });

      expect(typeof balance).toBe('bigint');
      expect(balance).toBeGreaterThanOrEqual(0n);
    });

    test('supports eth_getCode', async () => {
      const code = await publicClient.getBytecode({
        address: CONTRACT_ADDRESS,
      });

      expect(code).toBeDefined();
      expect(code).not.toBe('0x');
    });
  });
});
