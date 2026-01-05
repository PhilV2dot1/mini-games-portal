# 🎮 Celo Games Portal

A comprehensive gaming platform built on Celo blockchain featuring multiple games, user profiles, badges, and leaderboards.

## 🌟 Features

- **8 Blockchain Games**: Blackjack, Rock-Paper-Scissors, TicTacToe, Jackpot, 2048, Mastermind, Connect 4, Snake
- **Dual Mode Gaming**: Free play (off-chain) and On-chain modes with real CELO
- **User Profiles**: Customizable profiles with themes, avatars, and social links
- **Badge System**: Earn badges by playing games and achieving milestones
- **Leaderboard**: Global and game-specific rankings
- **Wallet Integration**: RainbowKit + Wagmi for seamless Web3 connectivity
- **Farcaster Integration**: Sign in with Farcaster, mini-app support

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Celo wallet for on-chain features

### Installation

```bash
# Clone the repository
git clone https://github.com/PhilV2dot1/celo-games-portal.git
cd celo-games-portal

# Install dependencies
npm install

# Copy environment variables
cp .env.example .env.local

# Configure your environment variables
# Edit .env.local with your Supabase, WalletConnect credentials

# Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

### Environment Variables

Required variables (see `.env.example` for details):

```bash
# Application
NEXT_PUBLIC_URL=http://localhost:3000

# WalletConnect
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 🎯 Games

### 1. Blackjack (21)
Classic card game where you try to beat the dealer by getting as close to 21 as possible.

**Contract**: `0x6cb9971850767026feBCb4801c0b8a946F28C9Ec` (Alfajores)

### 2. Rock Paper Scissors
Play against the computer in this timeless game of chance.

**Contract**: `0xc4f5f0201bf609535ec7a6d88a05b05013ae0c49` (Alfajores)

### 3. TicTacToe
Strategic game on a 3x3 grid. Get three in a row to win!

**Contract**: `0xa9596b4a5A7F0E10A5666a3a5106c4F2C3838881` (Alfajores)

### 4. Jackpot
Crypto-themed slot machine with weighted outcomes based on market cap rankings.

**Contract**: `0x07Bc49E8A2BaF7c68519F9a61FCD733490061644` (Alfajores)

### 5. 2048
Addictive tile-merging puzzle game. Combine tiles to reach 2048!

**Contract**: `0x3a4A909ed31446FFF21119071F4Db0b7DAe36Ed1` (Alfajores)

### 6. Mastermind
Code-breaking logic game. Guess the secret color combination!

**Contract**: `0x04481EeB5111BDdd2f05A6E20BE51B295b5251C9` (Alfajores)

### 7. Connect 4
Classic strategy game. Connect four pieces in a row to win! Play against AI with 3 difficulty levels.

**Contract**: `0xd00a6170d83b446314b2e79f9603bc0a72c463e6` (Celo Mainnet)
**Documentation**: [contracts/ConnectFive.README.md](contracts/ConnectFive.README.md)

### 8. Snake
Eat food, grow long, and avoid crashing! Classic arcade game with blockchain scoring.

**Contract**: `0x5646fda34aaf8a95b9b0607db5ca02bdee267598` (Celo Mainnet)
**Documentation**: [contracts/Snake.README.md](contracts/Snake.README.md)

## 🧪 Testing

We have comprehensive test coverage across all layers of the application.

### Test Overview

| Type | Count | Coverage | Status |
|------|-------|----------|--------|
| Unit Tests | 614 | 100% | ✅ Passing |
| Component Tests | 404 | 100% | ✅ Passing |
| Integration API Tests | 92 | 100% | ✅ Passing |
| E2E Tests | 54 (162 w/ browsers) | 100% | ✅ Ready |
| Blockchain Tests | 223 | N/A | ⏭️ Skip by default |
| **Total Active** | **1,110+** | **100%** | ✅ **Passing** |

### Running Tests

```bash
# All tests (unit, component, integration)
npm test

# Unit tests only
npm run test:unit

# E2E tests (requires dev server)
npm run test:e2e

# E2E with visible browser
npm run test:e2e:headed

# Blockchain tests (requires network)
RUN_BLOCKCHAIN_TESTS=true npm run test:blockchain
```

### Detailed Testing Documentation

For comprehensive testing documentation, see [TESTING.md](TESTING.md).

**Test-specific documentation**:
- [E2E Tests](tests/e2e/README.md) - End-to-end testing with Playwright
- [Blockchain Tests](tests/blockchain/README.md) - Smart contract integration tests
- [Smart Contracts](tests/blockchain/CONTRACTS.md) - Detailed contract documentation

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Framer Motion
- **State Management**: React hooks + Tanstack Query

### Web3
- **Wallet**: RainbowKit + Wagmi v2
- **Blockchain**: Celo (Alfajores Testnet)
- **Smart Contracts**: Solidity (deployed on Alfajores)
- **RPC**: Viem for blockchain interactions

### Backend
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth + Farcaster
- **API**: Next.js API Routes
- **Storage**: Supabase Storage (avatars, banners)

### Testing
- **Unit/Component**: Vitest + React Testing Library
- **E2E**: Playwright
- **Blockchain**: Viem + Custom test helpers

## 📁 Project Structure

```
celo-games-portal/
├── app/                      # Next.js app directory
│   ├── (games)/             # Game pages
│   ├── api/                 # API routes
│   ├── leaderboard/         # Leaderboard page
│   └── profile/             # Profile pages
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── badges/             # Badge system
│   ├── games/              # Game components
│   ├── profile/            # Profile components
│   └── ui/                 # Reusable UI components
├── hooks/                   # Custom React hooks
│   ├── useJackpot.ts       # Jackpot game logic
│   ├── useTicTacToe.ts     # TicTacToe game logic
│   └── ...
├── lib/                     # Utilities and libraries
│   ├── contracts/          # Smart contract ABIs
│   ├── supabase/           # Supabase client
│   ├── validations/        # Form validations
│   └── utils/              # Helper functions
├── tests/                   # Test suites
│   ├── unit/               # Unit tests (614)
│   ├── component/          # Component tests (404)
│   ├── integration/        # API integration tests (92)
│   ├── e2e/                # End-to-end tests (54)
│   └── blockchain/         # Blockchain tests (223)
└── public/                  # Static assets
```

## 🔧 Development

### Available Scripts

```bash
# Development
npm run dev          # Start dev server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Testing
npm test             # Run all tests
npm run test:unit    # Unit tests
npm run test:watch   # Watch mode
npm run test:ui      # Interactive test UI
npm run test:e2e     # E2E tests
npm run test:e2e:headed  # E2E with browser
npm run test:e2e:debug   # E2E debug mode

# Blockchain
npm run test:blockchain  # Blockchain tests (with RUN_BLOCKCHAIN_TESTS=true)
```

### Development Workflow

1. Create a feature branch
2. Make changes
3. Run tests: `npm test`
4. Run E2E tests (if UI changes): `npm run test:e2e`
5. Commit with descriptive message
6. Create Pull Request

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PhilV2dot1/celo-games-portal)

1. Import your repository to Vercel
2. Configure environment variables
3. Deploy!

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm run start
```

### Environment Setup for Production

Ensure all environment variables are configured:
- Supabase credentials
- WalletConnect Project ID
- (Optional) Analytics tokens
- (Optional) Blockchain test wallet (for automated tests)

## 🎨 Customization

### Themes

Users can choose from 7 color themes:
- Yellow (Celo default)
- Blue
- Purple
- Green
- Red
- Orange
- Pink

Theme configuration: `lib/utils/themes.ts`

### Adding a New Game

1. Create smart contract and deploy to Alfajores
2. Add ABI in `lib/contracts/[game]-abi.ts`
3. Create game component in `components/games/`
4. Create custom hook in `hooks/use[Game].ts`
5. Add route in `app/(games)/[game]/`
6. Add tests in `tests/`
7. Update leaderboard and stats tracking

## 📊 CI/CD

GitHub Actions workflows are configured for:
- **Unit & Integration Tests**: Run on every push/PR
- **E2E Tests**: Chromium & Firefox on every push/PR
- **Mobile E2E Tests**: On main branch only
- **Blockchain Tests**: Manual trigger (workflow_dispatch)

Configuration: [.github/workflows/test.yml](.github/workflows/test.yml)

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add/update tests
5. Ensure all tests pass (`npm test`)
6. Commit your changes (`git commit -m 'Add amazing feature'`)
7. Push to the branch (`git push origin feature/amazing-feature`)
8. Open a Pull Request

### Code Style

- TypeScript for all code
- ESLint + Prettier for formatting
- Meaningful variable names
- Comments for complex logic
- Tests for all new features

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Celo Foundation** - For the blockchain infrastructure
- **Farcaster** - For social authentication
- **Supabase** - For backend services
- **RainbowKit** - For wallet connectivity
- **Playwright** - For E2E testing
- **Vitest** - For unit testing

## 📞 Support

- **Documentation**: [TESTING.md](TESTING.md)
- **Issues**: [GitHub Issues](https://github.com/PhilV2dot1/celo-games-portal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PhilV2dot1/celo-games-portal/discussions)

## 🔗 Links

- **Live Demo**: [celo-games-portal.vercel.app](https://celo-games-portal.vercel.app)
- **Celo Explorer (Alfajores)**: [alfajores.celoscan.io](https://alfajores.celoscan.io)
- **Celo Faucet**: [faucet.celo.org](https://faucet.celo.org)

---

**Built with ❤️ for the Celo community**

*Last updated: December 2025*
