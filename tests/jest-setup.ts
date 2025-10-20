import 'reflect-metadata';

jest.setTimeout(10000);

process.env.JWT_SECRET = 'test-secret';
process.env.BASE_URL = 'http://localhost:3000';
process.env.DATABASE_URL = 'postgresql://test-db-url';

global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};
