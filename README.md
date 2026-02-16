# 🎮 Mini Games Portal

A comprehensive multi-chain gaming platform featuring 15 mini-games on Celo, Base & MegaETH blockchains, with user profiles, badges, and leaderboards.

## 🌟 Features

- **15 Blockchain Games**: Blackjack, Rock-Paper-Scissors, TicTacToe, Jackpot, 2048, Mastermind, Connect 4, Snake, Solitaire, Minesweeper, Sudoku, Yahtzee, Memory, Maze & Tetris
- **Multi-Chain**: Play on Celo, Base and MegaETH (45 smart contracts, 15 per chain)
- **Dual Mode Gaming**: Free play (off-chain) and On-chain modes
- **User Profiles**: Customizable profiles with themes, avatars, and social links
- **Badge System**: Earn badges by playing games and achieving milestones
- **Leaderboard**: Global and game-specific rankings
- **Wallet Integration**: RainbowKit + Wagmi for seamless Web3 connectivity
- **Farcaster Integration**: Sign in with Farcaster, mini-app support
- **Multilingual**: English and French (1600+ translation keys)

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- (Optional) Crypto wallet for on-chain features

### Installation

```bash
# Clone the repository
git clone https://github.com/PhilV2dot1/mini-games-portal.git
cd mini-games-portal

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

## 🎯 Supported Chains

| Chain | ID | Explorer |
|-------|-----|---------|
| Celo | 42220 | [Celoscan](https://celoscan.io) |
| Base | 8453 | [Basescan](https://basescan.org) |
| MegaETH | 4326 | [MegaETH Explorer](https://megaexplorer.xyz) |

## 🧪 Testing

We have comprehensive test coverage across all layers of the application.

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

## 🏗️ Tech Stack

### Frontend
- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Custom components with Framer Motion
- **State Management**: React hooks + Tanstack Query

### Web3
- **Wallet**: RainbowKit + Wagmi v2
- **Blockchains**: Celo, Base, MegaETH
- **Smart Contracts**: Solidity (45 contracts across 3 chains)
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
mini-games-portal/
├── app/                      # Next.js app directory
│   ├── blackjack/           # Game pages (older games)
│   ├── games/               # Game pages (newer games)
│   ├── api/                 # API routes
│   ├── leaderboard/         # Leaderboard page
│   └── profile/             # Profile pages
├── components/              # React components
│   ├── auth/               # Authentication components
│   ├── badges/             # Badge system
│   ├── shared/             # Shared components (ChainSelector, etc.)
│   └── ui/                 # Reusable UI components
├── hooks/                   # Custom React hooks
├── lib/                     # Utilities and libraries
│   ├── contracts/          # Smart contract ABIs & addresses
│   ├── constants/          # Design tokens, chain themes
│   ├── i18n/               # Internationalization (EN/FR)
│   └── theme/              # Dark/light theme system
├── tests/                   # Test suites
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
npm run test:e2e     # E2E tests
```

## 🚢 Deployment

### Vercel (Recommended)

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/PhilV2dot1/mini-games-portal)

1. Import your repository to Vercel
2. Configure environment variables
3. Deploy!

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add/update tests
5. Ensure all tests pass (`npm test`)
6. Commit your changes
7. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Celo Foundation** - For the blockchain infrastructure
- **Base (Coinbase)** - For L2 scaling
- **MegaETH** - For high-performance chain
- **Farcaster** - For social authentication
- **Supabase** - For backend services
- **RainbowKit** - For wallet connectivity

## 📞 Support

- **Issues**: [GitHub Issues](https://github.com/PhilV2dot1/mini-games-portal/issues)
- **Discussions**: [GitHub Discussions](https://github.com/PhilV2dot1/mini-games-portal/discussions)

---

**Built with ❤️ for the multi-chain gaming community**

*Last updated: February 2026*
