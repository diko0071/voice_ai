/**
 * Jest configuration for Voice AI project
 */
module.exports = {
  // Use ts-jest preset for TypeScript support
  preset: 'ts-jest',
  
  // Use node environment for most tests
  testEnvironment: 'node',
  
  // Test pattern matching
  testMatch: ['**/tests/**/*.test.ts', '**/tests/**/*.test.tsx'],
  
  // Verbose output for better debugging
  verbose: true,
  
  // Setup files to run before tests
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  
  // Path mapping for imports
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  
  // File extensions to consider
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  
  // TypeScript handling
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: 'tsconfig.json',
      babelConfig: {
        presets: ['@babel/preset-react']
      }
    }],
  },
  
  // Paths to ignore
  testPathIgnorePatterns: [
    '/node_modules/',
    '/.next/',
  ],
  
  // Coverage collection
  collectCoverage: true,
  collectCoverageFrom: [
    'lib/**/*.ts',
    'hooks/**/*.ts',
    'components/**/*.tsx',
    'app/api/**/*.ts',
    '!**/node_modules/**',
  ],
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'clover'],
}; 