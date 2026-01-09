# GitHub Actions CI/CD Workflows

This directory contains automated workflows for Continuous Integration and Continuous Deployment.

## Table of Contents
- [Workflows Overview](#workflows-overview)
- [Setup Instructions](#setup-instructions)
- [Workflow Jobs](#workflow-jobs)
- [Configuration](#configuration)
- [Troubleshooting](#troubleshooting)

---

## Workflows Overview

### `ci.yml` - Main CI/CD Pipeline

**Triggers:**
- ✅ Push to `master`, `main`, or `develop` branches
- ✅ Pull requests targeting these branches
- ✅ Manual dispatch (via GitHub UI)

**Jobs:**
1. **Lint & Type Check** - ESLint + TypeScript validation
2. **Tests** - Unit & integration tests with coverage
3. **Build** - Next.js production build
4. **E2E Tests** - Playwright end-to-end tests (optional)
5. **Security Audit** - Dependency vulnerability scanning
6. **Deploy Preview** - Vercel preview deployment (PRs)
7. **Deploy Production** - Vercel production deployment (master)

---

## Setup Instructions

### 1. GitHub Secrets Configuration

Add these secrets to your GitHub repository:

**Settings → Secrets and variables → Actions → New repository secret**

| Secret Name | Description | Required For |
|-------------|-------------|--------------|
| `VERCEL_TOKEN` | Vercel authentication token | Deployment |
| `VERCEL_ORG_ID` | Vercel organization ID | Deployment |
| `VERCEL_PROJECT_ID` | Vercel project ID | Deployment |
| `CODECOV_TOKEN` | Codecov API token | Coverage reports |

#### Getting Vercel Tokens

```bash
# Install Vercel CLI
npm install -g vercel

# Login to Vercel
vercel login

# Link your project
cd /path/to/celo-games-portal
vercel link

# Get project details
cat .vercel/project.json
# → Copy "projectId" and "orgId"

# Create token
# Go to https://vercel.com/account/tokens
# → Create new token → Copy token
```

#### Getting Codecov Token

1. Go to [codecov.io](https://codecov.io)
2. Sign in with GitHub
3. Add repository
4. Copy the upload token

### 2. Package.json Scripts

Ensure these scripts exist in `package.json`:

```json
{
  "scripts": {
    "lint": "next lint",
    "type-check": "tsc --noEmit",
    "test": "vitest",
    "test:e2e": "playwright test",
    "build": "next build"
  }
}
```

### 3. Enable Workflows

Workflows are enabled by default. To disable:

**Settings → Actions → General → Allow all actions**

---

## Workflow Jobs

### 1. Lint & Type Check

**Duration:** ~2-3 minutes

**What it does:**
- Runs ESLint on all TypeScript/JavaScript files
- Checks TypeScript types without emitting files
- Fails on errors, warns on warnings

**Configuration:**
```yaml
# Customize ESLint rules in .eslintrc.json
# Customize TypeScript in tsconfig.json
```

**Common Failures:**
- ❌ Unused variables
- ❌ Type mismatches
- ❌ Missing dependencies in useEffect

### 2. Run Tests

**Duration:** ~3-5 minutes

**What it does:**
- Runs all unit and integration tests
- Generates coverage report
- Uploads coverage to Codecov

**Configuration:**
```yaml
# Customize test coverage in vitest.config.ts
coverage: {
  thresholds: {
    lines: 80,
    functions: 80,
    branches: 80,
    statements: 80
  }
}
```

**Common Failures:**
- ❌ Test failures
- ❌ Coverage below threshold
- ❌ Snapshot mismatches

### 3. Build Application

**Duration:** ~4-6 minutes

**What it does:**
- Installs dependencies
- Runs Next.js production build
- Caches build artifacts for faster subsequent builds

**Caching Strategy:**
- Node modules: `pnpm-lock.yaml` hash
- Next.js cache: Source files hash

**Common Failures:**
- ❌ Build errors (TypeScript, imports)
- ❌ Missing environment variables
- ❌ Build size warnings

### 4. E2E Tests (Optional)

**Duration:** ~5-10 minutes

**What it does:**
- Installs Playwright browsers
- Runs end-to-end tests
- Uploads test reports as artifacts

**Setup:**
```bash
# Initialize Playwright
pnpm create playwright

# Run tests locally
pnpm test:e2e
```

**Common Failures:**
- ❌ Timeout waiting for elements
- ❌ Navigation errors
- ❌ Screenshot mismatches

### 5. Security Audit

**Duration:** ~1-2 minutes

**What it does:**
- Scans dependencies for known vulnerabilities
- Checks for outdated packages
- Allows high/critical severity issues (warning only)

**Manual Fix:**
```bash
# View audit report
pnpm audit

# Fix vulnerabilities
pnpm audit --fix

# Update dependencies
pnpm update
```

### 6. Deploy Preview (PRs)

**Duration:** ~3-5 minutes

**What it does:**
- Deploys PR to unique Vercel preview URL
- Comments on PR with preview link
- Runs only on pull requests

**Preview URL Format:**
```
https://celo-games-portal-{git-branch}-{vercel-org}.vercel.app
```

### 7. Deploy Production

**Duration:** ~3-5 minutes

**What it does:**
- Deploys to production Vercel domain
- Runs only on `master` branch pushes
- Requires all checks to pass

**Production URL:**
```
https://celo-games-portal.vercel.app
```

---

## Configuration

### Environment Variables

#### Build-time Variables

Add to Vercel project settings or `.env.local`:

```env
NEXT_PUBLIC_ALCHEMY_ID=your_alchemy_id
NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID=your_project_id
```

#### Runtime Variables (Edge Functions)

Add to Vercel project settings:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

### Concurrency Control

Prevents multiple workflows running on same branch:

```yaml
concurrency:
  group: ${{ github.workflow }}-${{ github.ref }}
  cancel-in-progress: true
```

**Effect:** Pushing 3 commits rapidly = only latest commit is tested

### Timeout Configuration

Prevents hung jobs from consuming minutes:

```yaml
timeout-minutes: 15  # Adjust per job
```

**Recommended Timeouts:**
- Lint: 10 minutes
- Tests: 15 minutes
- Build: 15 minutes
- E2E: 20 minutes
- Deploy: 10 minutes

---

## Troubleshooting

### Workflow Fails on Lint

**Error:** "ESLint errors found"

**Solution:**
```bash
# Run locally
pnpm run lint

# Auto-fix
pnpm run lint --fix

# Commit fixes
git add .
git commit -m "fix: resolve ESLint errors"
```

### Workflow Fails on Tests

**Error:** "Test suite failed"

**Solution:**
```bash
# Run tests locally
pnpm test

# Run specific test
pnpm test -- path/to/test.test.ts

# Update snapshots
pnpm test -- -u

# View coverage
pnpm test -- --coverage
```

### Workflow Fails on Build

**Error:** "Build failed with exit code 1"

**Solution:**
```bash
# Run build locally
pnpm build

# Check for TypeScript errors
pnpm type-check

# Clear cache
rm -rf .next
pnpm build
```

### Deployment Fails

**Error:** "Vercel deployment failed"

**Possible Causes:**
1. Missing secrets (check GitHub settings)
2. Invalid Vercel token (regenerate)
3. Project not linked (run `vercel link`)

**Solution:**
```bash
# Test deployment locally
vercel --prod

# Check Vercel logs
vercel logs <deployment-url>
```

### Job Takes Too Long

**Error:** "Job exceeded timeout"

**Solution:**
1. Increase `timeout-minutes` in workflow
2. Optimize test suite (use `test.skip()` for slow tests)
3. Split into multiple jobs

### Cache Issues

**Error:** "Unexpected node_modules state"

**Solution:**
```yaml
# Clear cache manually (GitHub UI)
# Settings → Actions → Caches → Delete all caches

# Or add to workflow
- name: Clear cache
  run: pnpm store prune
```

---

## Performance Tips

### Faster Builds

1. **Use pnpm caching**
   - Saves ~2-3 minutes per run
   - Automatically configured

2. **Cache Next.js build**
   - Saves ~1-2 minutes
   - Configured in workflow

3. **Parallel jobs**
   - Lint, test, build run in parallel
   - Total time = slowest job (not sum)

### Faster Tests

1. **Run tests in parallel**
   ```bash
   vitest --threads
   ```

2. **Skip slow tests in CI**
   ```tsx
   test.skipIf(process.env.CI)('slow test', ...)
   ```

3. **Use test coverage caching**
   - Already configured

---

## Monitoring

### GitHub Actions Dashboard

**View all workflows:**
```
https://github.com/PhilV2dot1/celo-games-portal/actions
```

### Badge Status

Add to README.md:

```markdown
[![CI](https://github.com/PhilV2dot1/celo-games-portal/actions/workflows/ci.yml/badge.svg)](https://github.com/PhilV2dot1/celo-games-portal/actions/workflows/ci.yml)
```

### Codecov Dashboard

**View coverage:**
```
https://app.codecov.io/gh/PhilV2dot1/celo-games-portal
```

---

## Cost Estimation

GitHub Actions free tier:
- **2,000 minutes/month** for private repos
- **Unlimited minutes** for public repos

**Expected usage (per workflow run):**
- Lint: ~2 min
- Tests: ~4 min
- Build: ~5 min
- E2E: ~8 min
- Deploy: ~4 min
- **Total: ~23 minutes**

**Monthly estimate:**
- 10 pushes/day × 30 days = 300 runs
- 300 runs × 23 min = 6,900 minutes
- **Public repo:** Free ✅
- **Private repo:** Exceeds free tier ⚠️

**Optimization for private repos:**
- Skip E2E on every push
- Run full suite only on PRs
- Reduces to ~15 min/run = 4,500 min/month

---

## Additional Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel Deployment](https://vercel.com/docs/concepts/git/vercel-for-github)
- [Codecov Integration](https://docs.codecov.com/docs/github-actions)
- [Playwright CI](https://playwright.dev/docs/ci)

---

**Last Updated:** 2026-01-08
**Maintained By:** Development Team
