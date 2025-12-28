import { faker } from '@faker-js/faker';

export const createMockBlackjackHand = () => ({
  playerHand: [
    { value: 10, suit: '♠', display: 'K' },
    { value: 1, suit: '♥', display: 'A' },
  ],
  dealerHand: [
    { value: 9, suit: '♦', display: '9' },
    { value: 7, suit: '♣', display: '7' },
  ],
  playerTotal: 21,
  dealerTotal: 16,
});

export const createMockBlackjackCard = (overrides = {}) => ({
  value: faker.number.int({ min: 1, max: 13 }),
  suit: faker.helpers.arrayElement(['♠', '♥', '♦', '♣']),
  display: faker.helpers.arrayElement(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']),
  ...overrides,
});

export const createMock2048Grid = () => [
  [2, 4, 8, 16],
  [32, 64, 128, 256],
  [512, 1024, 0, 0],
  [0, 0, 0, 0],
];

export const createMockMastermindCode = () =>
  Array(4).fill(null).map(() =>
    faker.helpers.arrayElement(['red', 'blue', 'green', 'yellow', 'orange', 'purple'])
  );

export const createMockRPSChoice = () =>
  faker.helpers.arrayElement(['rock', 'paper', 'scissors']);

export const createMockTicTacToeBoard = () => [
  ['X', 'O', 'X'],
  ['O', 'X', 'O'],
  ['', '', ''],
];
