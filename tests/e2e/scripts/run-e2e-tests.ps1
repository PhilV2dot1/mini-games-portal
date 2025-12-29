# E2E Tests Runner Script (PowerShell)
# This script helps run end-to-end tests with Playwright

Write-Host "🎭 Playwright E2E Tests Runner" -ForegroundColor Cyan
Write-Host "==============================" -ForegroundColor Cyan
Write-Host ""

# Check if Playwright browsers are installed
$playwrightPath = "$env:LOCALAPPDATA\ms-playwright"
if (!(Test-Path $playwrightPath)) {
    Write-Host "⚠️  Playwright browsers not found" -ForegroundColor Yellow
    Write-Host "   Installing Playwright browsers..." -ForegroundColor Yellow
    npx playwright install chromium firefox
    Write-Host ""
}

# Check if dev server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000" -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "✅ Dev server is running on http://localhost:3000" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Dev server not detected on http://localhost:3000" -ForegroundColor Yellow
    Write-Host "   Tests will start the dev server automatically" -ForegroundColor Yellow
}

Write-Host ""

# Parse command line arguments
$mode = "run"
$project = ""
$extraArgs = @()

foreach ($arg in $args) {
    switch -Regex ($arg) {
        "^--headed$" {
            $mode = "headed"
        }
        "^--debug$" {
            $mode = "debug"
        }
        "^--ui$" {
            $mode = "ui"
        }
        "^--project=(.+)$" {
            $project = $Matches[1]
        }
        default {
            $extraArgs += $arg
        }
    }
}

Write-Host "🚀 Running E2E tests..." -ForegroundColor Cyan
Write-Host "   Mode: $mode"
if ($project) {
    Write-Host "   Project: $project"
}
Write-Host ""

# Run tests based on mode
$exitCode = 0
try {
    switch ($mode) {
        "headed" {
            npm run test:e2e:headed -- @extraArgs
        }
        "debug" {
            npm run test:e2e:debug -- @extraArgs
        }
        "ui" {
            npx playwright test --ui @extraArgs
        }
        default {
            if ($project) {
                npx playwright test --project=$project @extraArgs
            } else {
                npm run test:e2e -- @extraArgs
            }
        }
    }

    if ($LASTEXITCODE -ne 0) {
        $exitCode = $LASTEXITCODE
    }
} catch {
    $exitCode = 1
}

# Check exit code
Write-Host ""
if ($exitCode -eq 0) {
    Write-Host "✅ E2E tests completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 View detailed report:"
    Write-Host "   npx playwright show-report"
} else {
    Write-Host "❌ E2E tests failed. Check the output above for details." -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Debugging tips:"
    Write-Host "   - Run in headed mode: .\run-e2e-tests.ps1 --headed"
    Write-Host "   - Run in debug mode: .\run-e2e-tests.ps1 --debug"
    Write-Host "   - Run test UI: .\run-e2e-tests.ps1 --ui"
    Write-Host "   - View report: npx playwright show-report"
    exit $exitCode
}
