@echo off
REM Blockchain Tests Runner Script (Windows Batch)
REM This script helps run blockchain integration tests with the proper configuration

echo 🔗 Celo Blockchain Tests Runner
echo ================================
echo.

REM Check if RUN_BLOCKCHAIN_TESTS is already set
if "%RUN_BLOCKCHAIN_TESTS%"=="true" (
    echo ✅ RUN_BLOCKCHAIN_TESTS is already set to true
) else (
    echo ⚙️  Setting RUN_BLOCKCHAIN_TESTS=true
    set RUN_BLOCKCHAIN_TESTS=true
)

REM Check for .env.test file
if exist ".env.test" (
    echo ✅ Found .env.test file
    findstr /C:"TEST_WALLET_PRIVATE_KEY" .env.test >nul
    if %errorlevel%==0 (
        echo ✅ Test wallet configuration detected
    ) else (
        echo ⚠️  No TEST_WALLET_PRIVATE_KEY found in .env.test
        echo    Read-only tests will work, but write tests will be skipped
    )
) else (
    echo ⚠️  No .env.test file found
    echo    Using default test wallet (read-only tests only)
    echo.
    echo To configure a test wallet:
    echo   1. Copy .env.example to .env.test
    echo   2. Add your TEST_WALLET_PRIVATE_KEY
    echo   3. Get testnet CELO from https://faucet.celo.org
)

echo.
echo 🚀 Running blockchain tests...
echo.

REM Run the tests
call npm run test:blockchain %*

REM Check exit code
if %errorlevel%==0 (
    echo.
    echo ✅ Blockchain tests completed successfully!
) else (
    echo.
    echo ❌ Blockchain tests failed. Check the output above for details.
    exit /b 1
)
