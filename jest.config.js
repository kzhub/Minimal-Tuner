/** @type {import('ts-jest').JestConfigWithTsJest} **/
module.exports = {
  testEnvironment: process.env.NODE_ENV === 'ci' ? 'node' : 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/setupTests.ts'],
  transform: {
    "^.+.tsx?$": ["ts-jest",{}],
  },
};