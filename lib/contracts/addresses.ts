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
  | 'poker'
  | 'wordle'
  | 'brickbreaker'
  | 'flappybird'
  | 'plinko'
  | 'coinflip'
  | 'roulette'
  | 'watersort';

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
    soneium: '0xFa46Af31c890c72AEf7ad8aCC3eA4dc22C61b88A',
  },
  rps: {
    celo: '0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49',
    base: '0x8F1F830700be81D26C8B0a11D288BfB4b847cd3f',
    megaeth: '0x4B0451C6A151BB16CbdafC5b21237b818D440C3C',
    soneium: '0xeAE049C9F574A452A3A7CC3D5B8BfF91C2Cd6Ce1',
  },
  tictactoe: {
    celo: '0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881',
    base: '0x1c50C21AdED605895d6e5cAB93455cf6fd875c07',
    megaeth: '0xd14e153672817C3a95D174D3F9906698e2DF838A',
    soneium: '0x79c2E18ec129A0359304214f88A5527e9Fc03473',
  },
  jackpot: {
    celo: '0x07Bc49E8A2BaF7c68519F9a61FCD733490061644',
    base: '0x1aE5359EE59a01202E22b848156eFd8A682b5977',
    megaeth: '0x855D1738AAf61971934Dc03164dfb89be4568304',
    soneium: '0x00D45A43fa6Ec4aef5f32F7E8FA56F8A37dc0Ab1',
  },
  '2048': {
    celo: '0xeD8D3C3aA578049743492a813EC327A3209Ef151',
    base: '0xf2424dE8d85f95F5346bA480a6A72d6d860C153D',
    megaeth: '0x1f54eba95C71bafA5D6Fb311278139602f117C41',
    soneium: '0xAC7B2e266713Cc2aE37b9d583A5b35c6B8216410',
  },
  mastermind: {
    celo: '0xA734Ae8A46C5432427Ec2240153020d5ac72f0CE',
    base: '0x84d59CCd16bE252964D790A68296381c1F77782d',
    megaeth: '0xd095536B0D76CBFC1408D8A73fb3Cc557eD2AdF1',
    soneium: '0xB9470c2D3428C325e773910885006a4Af75ccA00',
  },
  minesweeper: {
    celo: '0x62798e5246169e655901C546c0496bb2C6158041',
    base: '0xe1DB8B061283eBb0052493293eD47b628c7b62C6',
    megaeth: '0x63a83C17B77A036936b1aeA8CE639E149Bb24b0a',
    soneium: '0x6CDc983eC17e641Cd69f8720f7c03ED6Cb4bD653',
  },
  sudoku: {
    celo: '0xB404882d0eb3A7c1022071559ab149e38d60cbE1',
    base: '0x9a842FbFBF2109D6CbF98A9a999da22e52C774b1',
    megaeth: '0x9DD027A09cBEb06466b6f6823bf18C468364e342',
    soneium: '0x1030C16D2574529354357d9E657f20574E55d434',
  },
  yahtzee: {
    celo: '0xfff18d55e8365a9d60971543d9f7f3541c0a9ce0',
    base: '0x974f1f509b5ad8282b4f0fa46ec6fc89630cb376',
    megaeth: '0xBddc5C0a03D349eC661201b52f44499175A94f1A',
    soneium: '0x3f45e7413E2CE0fB9dB1aDe6A1aa16bab40C55Ec',
  },
  connectfive: {
    celo: '0xd00a6170d83b446314b2e79f9603bc0a72c463e6',
    base: '0xA2017B6A6A04112AB32534a6D1BEFcaA7a75FC9e',
    megaeth: '0x7A6Baea82Fa74adb5C9D7280063a77A3D1AEF43d',
    soneium: '0x6740bcbe5462d1d72CE0159a7d2faEd49ef2f702',
  },
  solitaire: {
    celo: '0x552c22fe8e0dbff856d45bcf32ddf6fe1ccb1525',
    base: '0x0c899ae9e0027b8799f60d8d2d0c81c5fb973875',
    megaeth: '0xC02D080C3E6e4A6392755C7a89365edaBE16978F',
    soneium: '0xf1D78Ce92dCCE33c0E2e8b6a07E0005d3beBb4E2',
  },
  snake: {
    celo: '0x5646fda34aaf8a95b9b0607db5ca02bdee267598',
    base: '0xdfe4364e40c79035dadC6B0E9e4a35Bf261412A9',
    megaeth: '0x69acf1A8e589147d823eB1426eAcedf179384E2d',
    soneium: '0x2b7f1C218448c48338778F9dD80a1aAa1E1E06eD',
  },
  memory: {
    celo: '0xf387107bb43591c49dca7f46cd3cffc705f0cb0c',
    base: '0x927803e696469ea76f7bc165f5add70c3efec470',
    megaeth: '0xCdd6667418B6891E72fA1DA8117972D07A321688',
    soneium: '0xE1AC6a10b9dbcF456BD702406C9227Bb51B7bF0A',
  },
  maze: {
    celo: '0x15110ed1bff11b2522234a44665bc689c500a285',
    base: '0xed8ae4652ade0aa830f0018d0d458dbcbc42f664',
    megaeth: '0x1dA094416D76501ceF306CF08C2Ea935E12039C3',
    soneium: '0x88ce9eE98A859c7Ec3e0104DDec3048B31Da9Ee7',
  },
  tetris: {
    celo: '0x1d24cca8b0c15fef23b37978a3f696a52c0e9116',
    base: '0x3c0022C1e766D20C3e57D273BdcF243d4B5c73C5',
    megaeth: '0x67a9e20aBCbe387e3e228D970fd4A50928972eAB',
    soneium: '0xE2B431F45D042C2cA0735D089aD20AB77DC6B319',
  },
  poker: {
    celo: '0xe446ee939ba9f508e4f4fcbf10c10172ac4df267',
    base: '0x901617E83B9C3DdDE729b5C1A68743EfF3538Aa9',
    megaeth: '0x72cA73D209dC23B406762b7230F3cF8Cf001658A',
    soneium: '0x96492b9aa802DA6C0922eEa89bEDDB05433D05FF',
  },
  wordle: {
    celo: '0x3Be204FcE03b7ec24e85C1d4320A81Df59cF34f0',
    base: '0x4871109f8f2448d3ae77771c1e2b49cc345b082c',
    megaeth: '0x6b3f81c561E40Ac3F1BAA16cbE456a584F26dB84',
    soneium: '0x7ed323C0d67A190673A62C5d1480284b14FA4E7b',
  },
  brickbreaker: { celo: '0xde31f2cfcf6b351cb5eefb951889d12206616008', base: '0x5D2F8f9EcA52C51e26D9224eDF61bA72Bac93743', megaeth: '0x07D3E0fdFcF7417A6Ef98Fa51b9f08d55D616818', soneium: '0x48D1acD1b7d6afD459a109cB4D706979b8883eEC' },
  flappybird:   { celo: '0x6b0f0a8dfcd4faa3166261e026a4bcaae8f28057', base: '0xfecd3ef79cc68dbdd7f0917ee7bd87bfb038fdb6', megaeth: '0xe7765646da6631ab3ed8e3544dfaabdd927751fa', soneium: '0x2A5c10182b9B6a67c198f5A981A09D4990396cE0' },
  plinko:       { celo: '0x2d65202f305e18672a56de2c499e7cb0be74ea94', base: '0xbb59cb3fa35329ce68e33678263dc5e8937352e6', megaeth: '0xEb90D2638Ebd2a8a4A8F3E30792f80e372C06E3a', soneium: '0x995a9394d45b427B4102Bd3B4897d44b1b1BFB4A' },
  coinflip:     { celo: '0x57912445add80bbf98802ec7ebc281f554e91380', base: '0x21153a79E0d788D13EAbE7f6B28375DFd678f839', megaeth: '0x0e60f4cf609d1c6f1a67639517bf0cd2110fa09e', soneium: '0x15905bf6Cf99569552e197b3e829D640afA9F1F8' },
  roulette:     { celo: '0xc90044f8c7c0fc8a07117d4e0f6ea33558f908e4', base: '0x03a056dc19886504778be9bfaedffff5edd4ad71', megaeth: null, soneium: '0x2D22EE1d3520921E83B9E163f74349FcA9ad2517' },
  watersort:    { celo: null, base: null, megaeth: null, soneium: null },
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
