import { faker } from '@faker-js/faker';

export const createMockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  username: faker.internet.userName().toLowerCase(),
  display_name: faker.person.fullName(),
  wallet_address: faker.finance.ethereumAddress().toLowerCase(),
  total_points: faker.number.int({ min: 0, max: 10000 }),
  avatar_type: 'default',
  avatar_url: '/avatars/predefined/default-player.svg',
  theme_color: 'yellow',
  bio: null,
  profile_visibility: 'public',
  show_stats: true,
  show_badges: true,
  show_game_history: true,
  created_at: faker.date.past().toISOString(),
  updated_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockSession = (overrides = {}) => ({
  id: faker.string.uuid(),
  game_id: faker.helpers.arrayElement(['blackjack', 'rps', 'tictactoe', 'jackpot', '2048', 'mastermind']),
  user_id: faker.string.uuid(),
  result: faker.helpers.arrayElement(['win', 'lose', 'push', 'draw']),
  points_earned: faker.number.int({ min: 0, max: 100 }),
  mode: faker.helpers.arrayElement(['free', 'onchain']),
  tx_hash: null,
  played_at: faker.date.recent().toISOString(),
  ...overrides,
});

export const createMockBadge = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.word.words(2),
  description: faker.lorem.sentence(),
  icon: '🏆',
  category: faker.helpers.arrayElement(['progression', 'performance', 'exploration', 'onchain', 'social']),
  requirement: {
    type: 'games_played',
    value: faker.number.int({ min: 1, max: 100 }),
  },
  points: faker.number.int({ min: 10, max: 1000 }),
  ...overrides,
});
