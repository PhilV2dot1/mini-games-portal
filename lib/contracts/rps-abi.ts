// Rock Paper Scissors Contract ABI
// Contract Address: 0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49
// Deployed and verified on Celo mainnet
// NOTE: Contract uses French function names (jouer, obtenirStats)

export const RPS_CONTRACT_ADDRESS = '0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49' as `0x${string}`;

export const RPS_CONTRACT_ABI = [
  {
    inputs: [{ internalType: 'uint256', name: '_choix', type: 'uint256' }],
    name: 'jouer',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    inputs: [],
    name: 'obtenirStats',
    outputs: [
      { internalType: 'uint256', name: 'victoires', type: 'uint256' },
      { internalType: 'uint256', name: 'defaites', type: 'uint256' },
      { internalType: 'uint256', name: 'egalites', type: 'uint256' },
      { internalType: 'uint256', name: 'totalParties', type: 'uint256' },
      { internalType: 'uint256', name: 'tauxVictoire', type: 'uint256' },
      { internalType: 'uint256', name: 'serieActuelle', type: 'uint256' },
      { internalType: 'uint256', name: 'meilleureSerie', type: 'uint256' },
    ],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [{ internalType: 'address', name: '_joueur', type: 'address' }],
    name: 'joueurExiste',
    outputs: [{ internalType: 'bool', name: '', type: 'bool' }],
    stateMutability: 'view',
    type: 'function',
  },
  {
    inputs: [],
    name: 'version',
    outputs: [{ internalType: 'string', name: '', type: 'string' }],
    stateMutability: 'pure',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: 'address', name: 'joueur', type: 'address' },
      { indexed: false, internalType: 'uint256', name: 'choixJoueur', type: 'uint256' },
      { indexed: false, internalType: 'uint256', name: 'choixOrdinateur', type: 'uint256' },
      { indexed: false, internalType: 'string', name: 'resultat', type: 'string' },
    ],
    name: 'PartieJouee',
    type: 'event',
  },
] as const;
