/** @type {import('jest').Config} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src/test'],
  testMatch: ['**/*.unit.test.ts'],
  moduleNameMapper: {
    '^vscode$': '<rootDir>/src/test/__mocks__/vscode.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'commonjs',
        target: 'ES2022',
        strict: true,
        esModuleInterop: true,
        skipLibCheck: true,
        types: ['node', 'jest'],
      },
    }],
  },
};
