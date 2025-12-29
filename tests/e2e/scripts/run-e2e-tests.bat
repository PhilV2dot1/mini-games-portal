@echo off
REM E2E Tests Runner Script (Windows Batch)
REM This script helps run end-to-end tests with Playwright

echo 🎭 Playwright E2E Tests Runner
echo ==============================
echo.

REM Check if Playwright browsers are installed
if not exist "%LOCALAPPDATA%\ms-playwright" (
    echo ⚠️  Playwright browsers not found
    echo    Installing Playwright browsers...
    call npx playwright install chromium firefox
    echo.
)

REM Check if dev server is running
curl -s http://localhost:3000 >nul 2>&1
if %errorlevel%==0 (
    echo ✅ Dev server is running on http://localhost:3000
) else (
    echo ⚠️  Dev server not detected on http://localhost:3000
    echo    Tests will start the dev server automatically
)

echo.

REM Parse command line arguments
set MODE=run
set PROJECT=
set EXTRA_ARGS=

:parse_args
if "%~1"=="" goto run_tests
if "%~1"=="--headed" (
    set MODE=headed
    shift
    goto parse_args
)
if "%~1"=="--debug" (
    set MODE=debug
    shift
    goto parse_args
)
if "%~1"=="--ui" (
    set MODE=ui
    shift
    goto parse_args
)
set EXTRA_ARGS=%EXTRA_ARGS% %~1
shift
goto parse_args

:run_tests
echo 🚀 Running E2E tests...
echo    Mode: %MODE%
if not "%PROJECT%"=="" echo    Project: %PROJECT%
echo.

REM Run tests based on mode
if "%MODE%"=="headed" (
    call npm run test:e2e:headed -- %EXTRA_ARGS%
) else if "%MODE%"=="debug" (
    call npm run test:e2e:debug -- %EXTRA_ARGS%
) else if "%MODE%"=="ui" (
    call npx playwright test --ui %EXTRA_ARGS%
) else (
    if not "%PROJECT%"=="" (
        call npx playwright test --project=%PROJECT% %EXTRA_ARGS%
    ) else (
        call npm run test:e2e -- %EXTRA_ARGS%
    )
)

REM Check exit code
if %errorlevel%==0 (
    echo.
    echo ✅ E2E tests completed successfully!
    echo.
    echo 📊 View detailed report:
    echo    npx playwright show-report
) else (
    echo.
    echo ❌ E2E tests failed. Check the output above for details.
    echo.
    echo 💡 Debugging tips:
    echo    - Run in headed mode: run-e2e-tests.bat --headed
    echo    - Run in debug mode: run-e2e-tests.bat --debug
    echo    - Run test UI: run-e2e-tests.bat --ui
    echo    - View report: npx playwright show-report
    exit /b 1
)
