import {defineConfig} from 'vitest/config';

// Unit tests that run in Node.js (formerly Mocha).
export default defineConfig({
  test: {
    include: ['test/node/**/*.test.js'],
    globals: true,
    environment: 'node',
  },
});
