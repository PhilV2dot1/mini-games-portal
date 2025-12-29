#!/bin/bash

# Blockchain Tests Runner Script
# This script helps run blockchain integration tests with the proper configuration

set -e  # Exit on error

echo "🔗 Celo Blockchain Tests Runner"
echo "================================"
echo ""

# Check if RUN_BLOCKCHAIN_TESTS is already set
if [ "$RUN_BLOCKCHAIN_TESTS" = "true" ]; then
  echo "✅ RUN_BLOCKCHAIN_TESTS is already set to true"
else
  echo "⚙️  Setting RUN_BLOCKCHAIN_TESTS=true"
  export RUN_BLOCKCHAIN_TESTS=true
fi

# Check for .env.test file
if [ -f ".env.test" ]; then
  echo "✅ Found .env.test file"
  # Check if it has TEST_WALLET_PRIVATE_KEY
  if grep -q "TEST_WALLET_PRIVATE_KEY" .env.test; then
    echo "✅ Test wallet configuration detected"
  else
    echo "⚠️  No TEST_WALLET_PRIVATE_KEY found in .env.test"
    echo "   Read-only tests will work, but write tests will be skipped"
  fi
else
  echo "⚠️  No .env.test file found"
  echo "   Using default test wallet (read-only tests only)"
  echo ""
  echo "To configure a test wallet:"
  echo "  1. Copy .env.example to .env.test"
  echo "  2. Add your TEST_WALLET_PRIVATE_KEY"
  echo "  3. Get testnet CELO from https://faucet.celo.org"
fi

echo ""
echo "🚀 Running blockchain tests..."
echo ""

# Run the tests
npm run test:blockchain -- "$@"

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ Blockchain tests completed successfully!"
else
  echo ""
  echo "❌ Blockchain tests failed. Check the output above for details."
  exit 1
fi
