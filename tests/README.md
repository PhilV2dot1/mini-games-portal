# Tests Documentation - Celo Games Portal

Comprehensive testing documentation for the Celo Games Portal application.

## Table of Contents

- [Overview](#overview)
- [Test Structure](#test-structure)
- [Running Tests](#running-tests)
- [Test Categories](#test-categories)
- [Coverage Requirements](#coverage-requirements)
- [Writing New Tests](#writing-new-tests)
- [Debugging Tests](#debugging-tests)
- [CI/CD Integration](#cicd-integration)
- [Best Practices](#best-practices)

## Overview

The Celo Games Portal uses a comprehensive testing strategy with multiple layers:

- **Unit Tests**: Testing individual functions and components (Vitest + React Testing Library)
- **Integration Tests**: Testing API routes and database interactions (Vitest)
- **E2E Tests**: Testing complete user journeys (Playwright)
- **Blockchain Tests**: Testing smart contract interactions on Alfajores testnet (Vitest + Viem)

**Total Test Coverage**: 570+ tests across all categories

### Technology Stack

- **Unit/Integration Testing**: [Vitest](https://vitest.dev/)
- **React Component Testing**: [@testing-library/react](https://testing-library.com/react)
- **E2E Testing**: [Playwright](https://playwright.dev/)
- **Blockchain Testing**: [Viem](https://viem.sh/) on Celo Alfajores testnet

## Test Structure

```
tests/
├── e2e/                           # End-to-end tests (Playwright)
│   ├── user-registration.spec.ts
│   ├── wallet-connection.spec.ts
│   ├── profile-customization.spec.ts
│   ├── badge-earning.spec.ts
│   └── leaderboard.spec.ts
│
├── integration/                   # Integration tests
│   └── api/
│       ├── auth/
│       ├── user/
│       ├── game/
│       ├── badges/
│       └── leaderboard/
│
├── unit/                          # Unit tests
│   ├── components/                # React component tests
│   │   ├── auth/
│   │   ├── profile/
│   │   └── ui/
│   ├── hooks/                     # Custom React hooks tests
│   │   ├── useBlackjack.test.ts   (56 tests)
│   │   ├── use2048.test.ts        (43 tests)
│   │   ├── useMastermind.test.ts  (37 tests)
│   │   ├── useRockPaperScissors.test.ts (35 tests)
│   │   └── useTicTacToe.test.ts   (44 tests)
│   └── lib/                       # Utility and game logic tests
│       ├── games/
│       ├── utils/
│       └── validations/
│
├── blockchain/                    # Blockchain integration tests
│   ├── contracts/
│   ├── wagmi/
│   └── test-wallet.ts
│
├── factories/                     # Test data factories
│   ├── user.factory.ts
│   └── game.factory.ts
│
├── helpers/                       # Test helpers
│   ├── render.tsx                 # Custom render with providers
│   └── supabase-test.ts           # Supabase test utilities
│
├── mocks/                         # Mock implementations
│   └── wagmi.ts                   # Wagmi hooks mocks
│
└── setup.ts                       # Global test setup
```

## Running Tests

### Install Dependencies

```bash
npm install
```

### Run All Tests

```bash
# Run all unit and integration tests
npm run test

# Run all tests with coverage
npm run test:unit

# Run tests in watch mode (dev)
npm run test:watch

# Run tests with UI
npm run test:ui
```

### Run Specific Test Suites

```bash
# Run only hook tests
npm run test -- tests/unit/hooks

# Run only component tests
npm run test -- tests/unit/components

# Run only game logic tests
npm run test -- tests/unit/lib/games

# Run specific test file
npm run test -- tests/unit/hooks/useBlackjack.test.ts
```

### E2E Tests (Playwright)

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests with browser UI
npm run test:e2e:headed

# Debug E2E tests
npm run test:e2e:debug

# Run specific E2E test
npx playwright test tests/e2e/wallet-connection.spec.ts
```

### Blockchain Tests

```bash
# Run blockchain tests (requires Alfajores testnet connection)
npm run test:blockchain
```

**Note**: Blockchain tests require:
- `TEST_WALLET_PRIVATE_KEY` environment variable in `.env.test`
- Testnet CELO in the test wallet (get from [Celo Faucet](https://faucet.celo.org))

### Run All Tests (Full Suite)

```bash
npm run test:all
```

## Test Categories

### 1. Unit Tests

**Purpose**: Test individual functions and components in isolation

**Location**: `tests/unit/`

**Examples**:
- Game logic (blackjack card calculation, 2048 grid movement, mastermind code evaluation)
- Utility functions (points calculation, validation, formatting)
- React hooks (game state management, blockchain interactions)
- React components (auth, profile, UI elements)

**Total**: 570+ tests

### 2. Integration Tests

**Purpose**: Test API routes and database interactions

**Location**: `tests/integration/`

**Examples**:
- Authentication APIs (wallet login, signup, OAuth)
- User profile APIs (CRUD operations, privacy settings)
- Game session APIs (score submission, leaderboard updates)
- Badge system APIs (achievement unlocking, points calculation)

### 3. E2E Tests

**Purpose**: Test complete user journeys from start to finish

**Location**: `tests/e2e/`

**Examples**:
- User registration flow
- Wallet connection and authentication
- Playing games and earning badges
- Profile customization
- Leaderboard navigation

### 4. Blockchain Tests

**Purpose**: Test smart contract interactions on Celo Alfajores testnet

**Location**: `tests/blockchain/`

**Examples**:
- Reading contract state (getStats, getPlayerData)
- Writing transactions (playGame, submitScore)
- Event parsing (GamePlayed, ScoreSubmitted)
- Chain switching (Celo network detection)

## Coverage Requirements

### Global Coverage Targets

- **Overall**: 70% minimum
- **Critical Game Logic** (`lib/games/*`): 100%
- **Utility Functions** (`lib/utils/*`): 80%
- **API Routes** (`app/api/*`): 70%
- **React Components** (`components/*`): 60%

### View Coverage Report

```bash
# Generate coverage report
npm run test:unit

# Open HTML coverage report (generated in coverage/ directory)
open coverage/index.html
```

### Coverage Thresholds

The project enforces minimum coverage thresholds:
- Lines: 60%
- Functions: 60%
- Branches: 50%
- Statements: 60%

Tests will fail in CI if coverage drops below these thresholds.

## Writing New Tests

### Unit Test Example (Hook)

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useYourHook } from '@/hooks/useYourHook';

describe('useYourHook', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('should initialize with correct default state', () => {
    const { result } = renderHook(() => useYourHook());

    expect(result.current.status).toBe('idle');
    expect(result.current.data).toBe(null);
  });

  it('should update state when action is called', async () => {
    const { result } = renderHook(() => useYourHook());

    await act(async () => {
      await result.current.performAction();
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });
  });
});
```

### Component Test Example

```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { YourComponent } from '@/components/YourComponent';

describe('YourComponent', () => {
  it('should render with correct text', () => {
    render(<YourComponent />);

    expect(screen.getByText('Expected Text')).toBeInTheDocument();
  });

  it('should handle button click', async () => {
    const onClickMock = vi.fn();
    render(<YourComponent onClick={onClickMock} />);

    const button = screen.getByRole('button', { name: 'Submit' });
    fireEvent.click(button);

    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
```

### E2E Test Example

```typescript
import { test, expect } from '@playwright/test';

test('user can complete signup flow', async ({ page }) => {
  await page.goto('/');

  // Click signup button
  await page.click('text=Sign Up');

  // Fill in form
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'securePassword123');
  await page.fill('input[name="username"]', 'testuser');

  // Submit
  await page.click('button[type="submit"]');

  // Verify redirect to profile setup
  await expect(page).toHaveURL('/profile/setup');
});
```

## Debugging Tests

### Debug Single Test

```bash
# Run specific test in watch mode
npm run test:watch -- tests/unit/hooks/useBlackjack.test.ts
```

### Use Vitest UI

```bash
npm run test:ui
```

This opens a browser-based UI where you can:
- See all tests visually
- Filter and search tests
- View test output and errors
- Re-run specific tests

### Debug E2E Tests

```bash
# Open Playwright Inspector
npm run test:e2e:debug

# Run with headed browser (see what's happening)
npm run test:e2e:headed
```

### Common Issues

**Issue**: Tests failing with "Cannot find module"
**Solution**: Check path aliases in `vitest.config.ts` - ensure `@/` resolves to project root

**Issue**: Wagmi hooks not mocked properly
**Solution**: Ensure `vi.mock('wagmi')` is called before importing the component/hook

**Issue**: Timers not advancing in tests
**Solution**: Use `vi.useFakeTimers()` before tests and `vi.advanceTimersByTime(ms)` to advance time

**Issue**: E2E tests timing out
**Solution**: Increase timeout in `playwright.config.ts` or use `test.setTimeout(60000)` for specific tests

## CI/CD Integration

### GitHub Actions Workflow

Tests run automatically on:
- Every push to `master` branch
- Every pull request

### Workflow Configuration

Location: `.github/workflows/test.yml`

The CI pipeline:
1. Installs dependencies
2. Runs unit and integration tests with coverage
3. Runs E2E tests (Playwright)
4. Runs blockchain tests (on master only)
5. Uploads coverage reports
6. Fails if coverage thresholds not met

### Local CI Simulation

```bash
# Run the same checks as CI
npm run test:all
```

## Best Practices

### 1. Follow AAA Pattern

```typescript
test('description', () => {
  // Arrange - Set up test data
  const input = 'test value';

  // Act - Execute the function
  const result = functionToTest(input);

  // Assert - Verify the result
  expect(result).toBe('expected value');
});
```

### 2. Use Descriptive Test Names

✅ Good:
```typescript
test('should return error when username is less than 3 characters')
test('should calculate blackjack hand with soft ace correctly')
```

❌ Bad:
```typescript
test('username validation')
test('blackjack')
```

### 3. Keep Tests Independent

Each test should:
- Set up its own data
- Clean up after itself
- Not depend on other tests running first
- Be idempotent (produce same result every time)

### 4. Mock External Dependencies

✅ Mock these:
- Supabase client
- Wagmi hooks (useAccount, useWriteContract, etc.)
- External APIs
- Browser APIs (localStorage, fetch)

❌ Don't mock these:
- Game logic functions (test the real implementation)
- Internal utility functions
- React hooks (use `renderHook` from Testing Library)

### 5. Test Edge Cases

Don't just test the "happy path":
- Empty inputs
- Null/undefined values
- Maximum/minimum values
- Error conditions
- Network failures
- User rejection (wallet transactions)

### 6. Use Fake Timers for Async Testing

```typescript
beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

test('should delay 500ms before showing result', async () => {
  const { result } = renderHook(() => useYourHook());

  act(() => {
    result.current.startAction();
  });

  // Action hasn't completed yet
  expect(result.current.status).toBe('loading');

  // Advance time
  await act(async () => {
    await vi.advanceTimersByTime(500);
  });

  // Now it's done
  expect(result.current.status).toBe('success');
});
```

### 7. Clean Up Mocks

```typescript
beforeEach(() => {
  vi.clearAllMocks(); // Reset mock call counts
});

afterEach(() => {
  vi.restoreAllMocks(); // Restore original implementations
});
```

## Test Data Factories

Use factories to create consistent test data:

```typescript
import { createMockUser, createMockGameSession } from '@/tests/factories/user.factory';

const testUser = createMockUser({
  username: 'testuser',
  total_points: 1000,
});

const gameSession = createMockGameSession({
  game_id: 'blackjack',
  result: 'win',
  points_earned: 50,
});
```

## Additional Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library Documentation](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Viem Testing Guide](https://viem.sh/docs/getting-started.html)
- [Celo Alfajores Faucet](https://faucet.celo.org)
- [Celo Alfajores Explorer](https://celoscan.io/)

## Support

For issues or questions about testing:
1. Check this README first
2. Review existing tests for examples
3. Check the test output and error messages
4. Open an issue in the GitHub repository

---

**Last Updated**: 2025-12-28

**Test Suite Version**: v1.0

**Total Tests**: 570+
