export default {
  moduleFileExtensions: ['js', 'json', 'ts'],
  rootDir: '.',
  testRegex: '.spec.ts$',
  testPathIgnorePatterns: ['/node_modules/', '/test/'],
  transform: {
    '^.+\\.(t|j)s$': 'ts-jest',
  },
  testEnvironment: 'node',
  coverageDirectory: './coverage',
  collectCoverageFrom: [
    'src/**/*.service.ts',
    'src/**/*.strategy.ts',
    'src/main.ts',
    'src/**/*.module.ts',
    'src/**/*.entity.ts',
    'src/**/*.dto.ts',
    'src/**/*.controller.ts',
    'src/**/*.guard.ts',
    'src/**/*.filter.ts',
    'src/**/*.middleware.ts',
    'src/**/*.repository.ts',
    'src/**/*.validator.ts',
    'src/prisma/prisma.service.ts',
    'src/app.service.ts',
  ],
  setupFilesAfterEnv: ['<rootDir>/tests/jest-setup.ts'],
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(nanoid)/)',
  ],
  coverageThreshold: {
    global: {
      branches: 80,
      functions: 85,
      lines: 85,
      statements: 85,
    },
  },
};
