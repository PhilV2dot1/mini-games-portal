#!/bin/bash

# E2E Tests Runner Script
# This script helps run end-to-end tests with Playwright

set -e  # Exit on error

echo "🎭 Playwright E2E Tests Runner"
echo "=============================="
echo ""

# Check if Playwright is installed
if ! command -v playwright &> /dev/null; then
  echo "⚠️  Playwright command not found"
  echo "   Installing Playwright browsers..."
  npx playwright install chromium firefox
  echo ""
fi

# Check if dev server is running
if curl -s http://localhost:3000 > /dev/null; then
  echo "✅ Dev server is running on http://localhost:3000"
  SERVER_RUNNING=true
else
  echo "⚠️  Dev server not detected on http://localhost:3000"
  echo "   Tests will start the dev server automatically"
  SERVER_RUNNING=false
fi

echo ""

# Parse command line arguments
MODE="run"
PROJECT=""

while [[ $# -gt 0 ]]; do
  case $1 in
    --headed)
      MODE="headed"
      shift
      ;;
    --debug)
      MODE="debug"
      shift
      ;;
    --ui)
      MODE="ui"
      shift
      ;;
    --project=*)
      PROJECT="${1#*=}"
      shift
      ;;
    *)
      # Pass through other arguments
      EXTRA_ARGS="$EXTRA_ARGS $1"
      shift
      ;;
  esac
done

echo "🚀 Running E2E tests..."
echo "   Mode: $MODE"
if [ -n "$PROJECT" ]; then
  echo "   Project: $PROJECT"
fi
echo ""

# Run tests based on mode
case $MODE in
  headed)
    npm run test:e2e:headed -- $EXTRA_ARGS
    ;;
  debug)
    npm run test:e2e:debug -- $EXTRA_ARGS
    ;;
  ui)
    npx playwright test --ui $EXTRA_ARGS
    ;;
  *)
    if [ -n "$PROJECT" ]; then
      npx playwright test --project=$PROJECT $EXTRA_ARGS
    else
      npm run test:e2e -- $EXTRA_ARGS
    fi
    ;;
esac

# Check exit code
if [ $? -eq 0 ]; then
  echo ""
  echo "✅ E2E tests completed successfully!"
  echo ""
  echo "📊 View detailed report:"
  echo "   npx playwright show-report"
else
  echo ""
  echo "❌ E2E tests failed. Check the output above for details."
  echo ""
  echo "💡 Debugging tips:"
  echo "   - Run in headed mode: ./run-e2e-tests.sh --headed"
  echo "   - Run in debug mode: ./run-e2e-tests.sh --debug"
  echo "   - View test UI: ./run-e2e-tests.sh --ui"
  echo "   - View report: npx playwright show-report"
  exit 1
fi
