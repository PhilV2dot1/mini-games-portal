# Blockchain Tests Runner Script (PowerShell)
# This script helps run blockchain integration tests with the proper configuration

Write-Host "🔗 Celo Blockchain Tests Runner" -ForegroundColor Cyan
Write-Host "================================" -ForegroundColor Cyan
Write-Host ""

# Check if RUN_BLOCKCHAIN_TESTS is already set
if ($env:RUN_BLOCKCHAIN_TESTS -eq "true") {
    Write-Host "✅ RUN_BLOCKCHAIN_TESTS is already set to true" -ForegroundColor Green
} else {
    Write-Host "⚙️  Setting RUN_BLOCKCHAIN_TESTS=true" -ForegroundColor Yellow
    $env:RUN_BLOCKCHAIN_TESTS = "true"
}

# Check for .env.test file
if (Test-Path ".env.test") {
    Write-Host "✅ Found .env.test file" -ForegroundColor Green
    # Check if it has TEST_WALLET_PRIVATE_KEY
    $content = Get-Content ".env.test" -Raw
    if ($content -match "TEST_WALLET_PRIVATE_KEY") {
        Write-Host "✅ Test wallet configuration detected" -ForegroundColor Green
    } else {
        Write-Host "⚠️  No TEST_WALLET_PRIVATE_KEY found in .env.test" -ForegroundColor Yellow
        Write-Host "   Read-only tests will work, but write tests will be skipped"
    }
} else {
    Write-Host "⚠️  No .env.test file found" -ForegroundColor Yellow
    Write-Host "   Using default test wallet (read-only tests only)"
    Write-Host ""
    Write-Host "To configure a test wallet:"
    Write-Host "  1. Copy .env.example to .env.test"
    Write-Host "  2. Add your TEST_WALLET_PRIVATE_KEY"
    Write-Host "  3. Get testnet CELO from https://faucet.celo.org"
}

Write-Host ""
Write-Host "🚀 Running blockchain tests..." -ForegroundColor Cyan
Write-Host ""

# Run the tests
$testArgs = $args -join " "
if ($testArgs) {
    npm run test:blockchain -- $testArgs
} else {
    npm run test:blockchain
}

# Check exit code
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Blockchain tests completed successfully!" -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Blockchain tests failed. Check the output above for details." -ForegroundColor Red
    exit 1
}
