import request from 'supertest';
import express from 'express';
import { PrismaClient } from '@prisma/client';
import boardRoutes from '../../src/routes/boards';
import { authenticateToken } from '../../src/middleware/auth';

// Mock Prisma and auth middleware
jest.mock('@prisma/client');
jest.mock('../../src/middleware/auth');

const mockPrisma = new PrismaClient() as jest.Mocked<PrismaClient>;
const mockAuth = authenticateToken as jest.MockedFunction<typeof authenticateToken>;

// Setup test app
const app = express();
app.use(express.json());
app.use((req: any, res, next) => {
  req.user = { id: 'test-user-id', email: 'test@example.com' };
  next();
});
app.use('/boards', boardRoutes);

describe('Boards Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockAuth.mockImplementation((req: any, res, next) => {
      req.user = { id: 'test-user-id', email: 'test@example.com' };
      next();
    });
  });

  describe('GET /boards', () => {
    it('should return paginated boards for authenticated user', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          title: 'Test Board 1',
          description: 'Description 1',
          visibility: 'private',
          ownerId: 'test-user-id',
          owner: { id: 'test-user-id', name: 'Test User' },
          workspace: null,
          members: [],
          lists: []
        },
        {
          id: 'board-2',
          title: 'Test Board 2',
          description: 'Description 2',
          visibility: 'workspace',
          ownerId: 'test-user-id',
          owner: { id: 'test-user-id', name: 'Test User' },
          workspace: { id: 'workspace-1', name: 'Test Workspace' },
          members: [],
          lists: []
        }
      ];

      // Mock Prisma responses
      (mockPrisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);
      (mockPrisma.board.count as jest.Mock).mockResolvedValue(2);

      const response = await request(app)
        .get('/boards')
        .query({ page: 1, limit: 10 })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.boards).toHaveLength(2);
      expect(response.body.data.pagination).toEqual({
        page: 1,
        limit: 10,
        total: 2,
        totalPages: 1,
        hasNext: false,
        hasPrev: false
      });
    });

    it('should handle pagination correctly', async () => {
      const mockBoards = Array.from({ length: 5 }, (_, i) => ({
        id: `board-${i + 1}`,
        title: `Test Board ${i + 1}`,
        description: `Description ${i + 1}`,
        visibility: 'private',
        ownerId: 'test-user-id',
        owner: { id: 'test-user-id', name: 'Test User' },
        workspace: null,
        members: [],
        lists: []
      }));

      (mockPrisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards.slice(0, 3));
      (mockPrisma.board.count as jest.Mock).mockResolvedValue(5);

      const response = await request(app)
        .get('/boards')
        .query({ page: 1, limit: 3 })
        .expect(200);

      expect(response.body.data.boards).toHaveLength(3);
      expect(response.body.data.pagination.hasNext).toBe(true);
      expect(response.body.data.pagination.totalPages).toBe(2);
    });

    it('should filter boards by sort order', async () => {
      const mockBoards = [
        {
          id: 'board-1',
          title: 'A Board',
          createdAt: new Date('2023-01-01'),
          ownerId: 'test-user-id',
          owner: { id: 'test-user-id', name: 'Test User' },
          workspace: null,
          members: [],
          lists: []
        }
      ];

      (mockPrisma.board.findMany as jest.Mock).mockResolvedValue(mockBoards);
      (mockPrisma.board.count as jest.Mock).mockResolvedValue(1);

      const response = await request(app)
        .get('/boards')
        .query({ sortBy: 'title', sortOrder: 'asc' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(mockPrisma.board.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { title: 'asc' }
        })
      );
    });
  });

  describe('POST /boards', () => {
    it('should create a new board successfully', async () => {
      const boardData = {
        title: 'New Test Board',
        description: 'New board description',
        visibility: 'private'
      };

      const mockCreatedBoard = {
        id: 'new-board-id',
        ...boardData,
        ownerId: 'test-user-id',
        position: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      (mockPrisma.board.create as jest.Mock).mockResolvedValue(mockCreatedBoard);

      const response = await request(app)
        .post('/boards')
        .send(boardData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.board.title).toBe(boardData.title);
      expect(response.body.data.board.description).toBe(boardData.description);
      expect(mockPrisma.board.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          title: boardData.title,
          description: boardData.description,
          ownerId: 'test-user-id'
        })
      });
    });

    it('should reject board creation with invalid data', async () => {
      const invalidBoardData = {
        title: '', // Empty title should fail validation
        description: 'Description'
      };

      const response = await request(app)
        .post('/boards')
        .send(invalidBoardData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Validation failed');
    });
  });

  describe('PUT /boards/:id', () => {
    it('should update board successfully', async () => {
      const boardId = 'board-123';
      const updateData = {
        title: 'Updated Board Title',
        description: 'Updated description'
      };

      const mockBoard = {
        id: boardId,
        ownerId: 'test-user-id'
      };

      const mockUpdatedBoard = {
        ...mockBoard,
        ...updateData,
        updatedAt: new Date()
      };

      (mockPrisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      (mockPrisma.board.update as jest.Mock).mockResolvedValue(mockUpdatedBoard);

      const response = await request(app)
        .put(`/boards/${boardId}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.board.title).toBe(updateData.title);
    });

    it('should reject update of non-existent board', async () => {
      const boardId = 'non-existent-board';
      
      (mockPrisma.board.findUnique as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put(`/boards/${boardId}`)
        .send({ title: 'New Title' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Board not found');
    });

    it('should reject update by non-owner', async () => {
      const boardId = 'board-123';
      const mockBoard = {
        id: boardId,
        ownerId: 'other-user-id' // Different from test-user-id
      };

      (mockPrisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app)
        .put(`/boards/${boardId}`)
        .send({ title: 'New Title' })
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Insufficient permissions');
    });
  });

  describe('DELETE /boards/:id', () => {
    it('should delete board successfully', async () => {
      const boardId = 'board-123';
      const mockBoard = {
        id: boardId,
        ownerId: 'test-user-id'
      };

      (mockPrisma.board.findUnique as jest.Mock).mockResolvedValue(mockBoard);
      (mockPrisma.board.delete as jest.Mock).mockResolvedValue(mockBoard);

      const response = await request(app)
        .delete(`/boards/${boardId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Board deleted successfully');
    });
  });
});
