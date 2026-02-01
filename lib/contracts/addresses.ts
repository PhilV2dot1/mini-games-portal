/**
 * Multichain Contract Address Management
 *
 * Centralizes all contract addresses per chain.
 * Base addresses are null until contracts are deployed.
 */

import { celo, base } from 'wagmi/chains';

export type SupportedChainId = typeof celo.id | typeof base.id;
export type SupportedChain = 'celo' | 'base';

export type GameId =
  | 'blackjack'
  | 'rps'
  | 'tictactoe'
  | 'jackpot'
  | '2048'
  | 'mastermind'
  | 'minesweeper'
  | 'sudoku'
  | 'yahtzee'
  | 'connectfive'
  | 'solitaire'
  | 'snake';

type AddressOrNull = `0x${string}` | null;

interface ChainAddresses {
  celo: AddressOrNull;
  base: AddressOrNull;
}

export const CONTRACT_ADDRESSES: Record<GameId, ChainAddresses> = {
  blackjack: {
    celo: '0x6cb9971850767026feBCb4801c0b8a946F28C9Ec',
    base: '0xBA7A613f593bC4B5FCFbd973C2dA628412eEA936',
  },
  rps: {
    celo: '0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49',
    base: '0x8F1F830700be81D26C8B0a11D288BfB4b847cd3f',
  },
  tictactoe: {
    celo: '0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881',
    base: '0x1c50C21AdED605895d6e5cAB93455cf6fd875c07',
  },
  jackpot: {
    celo: '0x07Bc49E8A2BaF7c68519F9a61FCD733490061644',
    base: '0x1aE5359EE59a01202E22b848156eFd8A682b5977',
  },
  '2048': {
    celo: '0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1',
    base: '0xf2424dE8d85f95F5346bA480a6A72d6d860C153D',
  },
  mastermind: {
    celo: '0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9',
    base: '0x4a471180fBeb3b53cDA9f719Ee50a0AC57E37e38',
  },
  minesweeper: {
    celo: '0x62798e5246169e655901C546c0496bb2C6158041',
    base: '0xe1DB8B061283eBb0052493293eD47b628c7b62C6',
  },
  sudoku: {
    celo: '0xB404882d0eb3A7c1022071559ab149e38d60cbE1',
    base: '0x9a842FbFBF2109D6CbF98A9a999da22e52C774b1',
  },
  yahtzee: {
    celo: '0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0',
    base: '0x974f1f509b5ad8282b4f0fa46ec6fc89630cb376',
  },
  connectfive: {
    celo: '0xd00a6170d83b446314b2e79f9603bc0a72c463e6',
    base: '0x64d4E14411C93A42348eD0641Cc21Fd70FafFf18',
  },
  solitaire: {
    celo: '0x552c22fe8e0dbff856d45bcf32ddf6fe1ccb1525',
    base: '0x0c899ae9e0027b8799f60d8d2d0c81c5fb973875',
  },
  snake: {
    celo: '0x5646fda34aaf8a95b9b0607db5ca02bdee267598',
    base: '0xdfe4364e40c79035dadC6B0E9e4a35Bf261412A9',
  },
};

const CHAIN_ID_TO_NAME: Record<number, SupportedChain> = {
  [celo.id]: 'celo',
  [base.id]: 'base',
};

export interface ChainConfig {
  name: string;
  shortName: string;
  chainId: number;
  icon: string;
  explorerUrl: string;
  rpcUrl: string;
  nativeCurrency: string;
}

export const CHAIN_CONFIG: Record<SupportedChain, ChainConfig> = {
  celo: {
    name: 'Celo',
    shortName: 'Celo',
    chainId: celo.id,
    icon: '🟡',
    explorerUrl: 'https://celoscan.io',
    rpcUrl: 'https://forno.celo.org',
    nativeCurrency: 'CELO',
  },
  base: {
    name: 'Base',
    shortName: 'Base',
    chainId: base.id,
    icon: '🔷',
    explorerUrl: 'https://basescan.org',
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: 'ETH',
  },
};

export const SUPPORTED_CHAIN_IDS: number[] = [celo.id, base.id];

export function getChainName(chainId: number): SupportedChain | null {
  return CHAIN_ID_TO_NAME[chainId] ?? null;
}

export function isSupportedChain(chainId: number): boolean {
  return chainId in CHAIN_ID_TO_NAME;
}

export function getContractAddress(gameId: GameId, chainId: number | undefined): `0x${string}` | null {
  if (!chainId) return null;
  const chainName = getChainName(chainId);
  if (!chainName) return null;
  return CONTRACT_ADDRESSES[gameId][chainName];
}

export function isGameAvailableOnChain(gameId: GameId, chainId: number | undefined): boolean {
  return getContractAddress(gameId, chainId) !== null;
}

export function getExplorerUrl(chainId: number | undefined): string {
  if (!chainId) return CHAIN_CONFIG.celo.explorerUrl;
  const chainName = getChainName(chainId);
  if (!chainName) return CHAIN_CONFIG.celo.explorerUrl;
  return CHAIN_CONFIG[chainName].explorerUrl;
}

export function getExplorerTxUrl(chainId: number | undefined, txHash: string): string {
  return `${getExplorerUrl(chainId)}/tx/${txHash}`;
}

export function getExplorerAddressUrl(chainId: number | undefined, address: string | null): string {
  return `${getExplorerUrl(chainId)}/address/${address ?? ''}`;
}
