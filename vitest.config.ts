import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: ['./tests/setup.ts'],
    include: ['**/*.{test,spec}.{ts,tsx}'],
    exclude: ['**/node_modules/**', '**/dist/**', '**/.next/**', '**/e2e/**', '**/*.spec.ts'],
    deps: {
      inline: [
        '@farcaster/miniapp-sdk',
        '@vanilla-extract/sprinkles',
        '@vanilla-extract/sprinkles/createUtils',
        '@vanilla-extract/css',
        '@vanilla-extract/dynamic',
        '@vanilla-extract/recipes',
        '@rainbow-me/rainbowkit',
      ],
    },
    pool: 'forks',
    poolOptions: {
      forks: {
        isolate: true,
        execArgv: ['--max-old-space-size=8192'],
      },
    },
    // Increase memory for CI and prevent heap exhaustion
    testTimeout: 10000,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.config.{ts,js}',
        '**/*.d.ts',
        '**/types/**',
        'lib/contracts/*-abi.ts', // ABIs are auto-generated
        '.next/**', // Exclude Next.js build files
        '**/vendor-chunks/**', // Exclude vendor bundles
        '**/_app.{js,ts,tsx}',
        '**/_document.{js,ts,tsx}',
        '**/middleware.{js,ts}',
      ],
      include: [
        'app/**/*.{ts,tsx}',
        'components/**/*.{ts,tsx}',
        'hooks/**/*.{ts,tsx}',
        'lib/**/*.{ts,tsx}',
      ],
      thresholds: {
        lines: 25,
        functions: 40,
        branches: 50,
        statements: 25,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
    },
  },
});
