import { PrismaClient } from '@prisma/client';
import { validateAndLoadConfig } from '../src/config/env';

// Extend global namespace for test utilities
declare global {
  var testUtils: {
    createMockUser: () => any;
    createMockBoard: () => any;
    createMockCard: () => any;
    generateAuthToken: () => string;
  };
}

// Load test environment configuration
process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/mini_trello_test';
process.env.JWT_SECRET = 'test-jwt-secret-for-testing-purposes-only-32-chars';

// Validate configuration
validateAndLoadConfig();

// Global test setup
const prisma = new PrismaClient();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Setup and teardown
beforeAll(async () => {
  // Database setup would go here in a real environment
  // For now, we'll mock the database interactions
});

afterAll(async () => {
  await prisma.$disconnect();
});

beforeEach(() => {
  jest.clearAllMocks();
});

// Global test utilities
global.testUtils = {
  createMockUser: () => ({
    id: 'test-user-id',
    email: 'test@example.com',
    name: 'Test User',
    password: 'hashedpassword',
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockBoard: () => ({
    id: 'test-board-id',
    title: 'Test Board',
    description: 'Test Description',
    visibility: 'private',
    position: 0,
    ownerId: 'test-user-id',
    workspaceId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  createMockCard: () => ({
    id: 'test-card-id',
    title: 'Test Card',
    description: 'Test card description',
    position: 0,
    listId: 'test-list-id',
    dueDate: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  
  generateAuthToken: () => 'mock-jwt-token',
};
