import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    // VS Code webviews can't resolve hashed asset paths inside JS bundles.
    // Inlining as base64 data URIs avoids all localResourceRoots / CSP issues.
    assetsInlineLimit: 10 * 1024 * 1024, // 10 MB — covers both logo and banner
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.unit.test.{ts,tsx}'],
  },
});
