/**
 * Multichain Contract Address Management
 *
 * Centralizes all contract addresses per chain (Celo, Base, MegaETH).
 */

import { celo, base } from 'wagmi/chains';
import { megaeth, soneium } from '@/lib/wagmi';

export type SupportedChainId = typeof celo.id | typeof base.id | typeof megaeth.id | typeof soneium.id;
export type SupportedChain = 'celo' | 'base' | 'megaeth' | 'soneium';

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
  | 'snake'
  | 'memory'
  | 'maze'
  | 'tetris'
  | 'poker';

type AddressOrNull = `0x${string}` | null;

interface ChainAddresses {
  celo: AddressOrNull;
  base: AddressOrNull;
  megaeth: AddressOrNull;
  soneium: AddressOrNull;
}

export const CONTRACT_ADDRESSES: Record<GameId, ChainAddresses> = {
  blackjack: {
    celo: '0x6cb9971850767026feBCb4801c0b8a946F28C9Ec',
    base: '0xBA7A613f593bC4B5FCFbd973C2dA628412eEA936',
    megaeth: '0xF60cf158Cd924Cd5edE9b4e9Df75b182c18BA71F',
    soneium: null,
  },
  rps: {
    celo: '0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49',
    base: '0x8F1F830700be81D26C8B0a11D288BfB4b847cd3f',
    megaeth: '0x4B0451C6A151BB16CbdafC5b21237b818D440C3C',
    soneium: null,
  },
  tictactoe: {
    celo: '0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881',
    base: '0x1c50C21AdED605895d6e5cAB93455cf6fd875c07',
    megaeth: '0xd14e153672817C3a95D174D3F9906698e2DF838A',
    soneium: null,
  },
  jackpot: {
    celo: '0x07Bc49E8A2BaF7c68519F9a61FCD733490061644',
    base: '0x1aE5359EE59a01202E22b848156eFd8A682b5977',
    megaeth: '0x855D1738AAf61971934Dc03164dfb89be4568304',
    soneium: null,
  },
  '2048': {
    celo: '0xeD8D3C3aA578049743492a813EC327A3209Ef151',
    base: '0xf2424dE8d85f95F5346bA480a6A72d6d860C153D',
    megaeth: '0x1f54eba95C71bafA5D6Fb311278139602f117C41',
    soneium: null,
  },
  mastermind: {
    celo: '0xA734Ae8A46C5432427Ec2240153020d5ac72f0CE',
    base: '0x84d59CCd16bE252964D790A68296381c1F77782d',
    megaeth: '0xd095536B0D76CBFC1408D8A73fb3Cc557eD2AdF1',
    soneium: null,
  },
  minesweeper: {
    celo: '0x62798e5246169e655901C546c0496bb2C6158041',
    base: '0xe1DB8B061283eBb0052493293eD47b628c7b62C6',
    megaeth: '0x63a83C17B77A036936b1aeA8CE639E149Bb24b0a',
    soneium: null,
  },
  sudoku: {
    celo: '0xB404882d0eb3A7c1022071559ab149e38d60cbE1',
    base: '0x9a842FbFBF2109D6CbF98A9a999da22e52C774b1',
    megaeth: '0x9DD027A09cBEb06466b6f6823bf18C468364e342',
    soneium: null,
  },
  yahtzee: {
    celo: '0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0',
    base: '0x974f1f509b5ad8282b4f0fa46ec6fc89630cb376',
    megaeth: '0xBddc5C0a03D349eC661201b52f44499175A94f1A',
    soneium: null,
  },
  connectfive: {
    celo: '0xd00a6170d83b446314b2e79f9603bc0a72c463e6',
    base: '0xA2017B6A6A04112AB32534a6D1BEFcaA7a75FC9e',
    megaeth: '0x7A6Baea82Fa74adb5C9D7280063a77A3D1AEF43d',
    soneium: null,
  },
  solitaire: {
    celo: '0x552c22fe8e0dbff856d45bcf32ddf6fe1ccb1525',
    base: '0x0c899ae9e0027b8799f60d8d2d0c81c5fb973875',
    megaeth: '0xC02D080C3E6e4A6392755C7a89365edaBE16978F',
    soneium: null,
  },
  snake: {
    celo: '0x5646fda34aaf8a95b9b0607db5ca02bdee267598',
    base: '0xdfe4364e40c79035dadC6B0E9e4a35Bf261412A9',
    megaeth: '0x69acf1A8e589147d823eB1426eAcedf179384E2d',
    soneium: null,
  },
  memory: {
    celo: '0xf387107bb43591c49dca7f46cd3cffc705f0cb0c',
    base: '0x927803e696469ea76f7bc165f5add70c3efec470',
    megaeth: '0xCdd6667418B6891E72fA1DA8117972D07A321688',
    soneium: null,
  },
  maze: {
    celo: '0x15110ed1bff11b2522234a44665bc689c500a285',
    base: '0xed8ae4652ade0aa830f0018d0d458dbcbc42f664',
    megaeth: '0x1dA094416D76501ceF306CF08C2Ea935E12039C3',
    soneium: null,
  },
  tetris: {
    celo: '0x1d24cca8b0c15fef23b37978a3f696a52c0e9116',
    base: '0x3c0022C1e766D20C3e57D273BdcF243d4B5c73C5',
    megaeth: '0x67a9e20aBCbe387e3e228D970fd4A50928972eAB',
    soneium: null,
  },
  poker: {
    celo: null,
    base: null,
    megaeth: null,
    soneium: null,
  },
};

const CHAIN_ID_TO_NAME: Record<number, SupportedChain> = {
  [celo.id]: 'celo',
  [base.id]: 'base',
  [megaeth.id]: 'megaeth',
  [soneium.id]: 'soneium',
};

export interface ChainConfig {
  name: string;
  shortName: string;
  chainId: number;
  icon: string;
  explorerUrl: string;
  explorerName: string;
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
    explorerName: 'Celoscan',
    rpcUrl: 'https://forno.celo.org',
    nativeCurrency: 'CELO',
  },
  base: {
    name: 'Base',
    shortName: 'Base',
    chainId: base.id,
    icon: '🔷',
    explorerUrl: 'https://basescan.org',
    explorerName: 'Basescan',
    rpcUrl: 'https://mainnet.base.org',
    nativeCurrency: 'ETH',
  },
  megaeth: {
    name: 'MegaETH',
    shortName: 'Mega',
    chainId: megaeth.id,
    icon: '⚡',
    explorerUrl: 'https://megaeth.blockscout.com',
    explorerName: 'MegaETH Explorer',
    rpcUrl: 'https://mainnet.megaeth.com/rpc',
    nativeCurrency: 'ETH',
  },
  soneium: {
    name: 'Soneium',
    shortName: 'Soneium',
    chainId: soneium.id,
    icon: '🔮',
    explorerUrl: 'https://soneium.blockscout.com',
    explorerName: 'Blockscout',
    rpcUrl: 'https://rpc.soneium.org',
    nativeCurrency: 'ETH',
  },
};

export const SUPPORTED_CHAIN_IDS: number[] = [celo.id, base.id, megaeth.id, soneium.id];

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

export function getExplorerName(chainId: number | undefined): string {
  if (!chainId) return CHAIN_CONFIG.celo.explorerName;
  const chainName = getChainName(chainId);
  if (!chainName) return CHAIN_CONFIG.celo.explorerName;
  return CHAIN_CONFIG[chainName].explorerName;
}
