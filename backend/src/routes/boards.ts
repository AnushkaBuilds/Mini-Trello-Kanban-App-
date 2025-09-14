import express from 'express';
import { body, validationResult } from 'express-validator';
import { validatePaginationParams, createPaginationResponse, getPrismaSkipTake } from '../utils/pagination';
import { prisma, queryOptimizations, withQueryPerformance } from '../config/database';
import { cacheMiddleware, invalidateCache, conditionalRequest, cache } from '../middleware/cache';

const router = express.Router();

/**
 * @swagger
 * /api/v1/boards:
 *   get:
 *     summary: Get user's boards with pagination
 *     tags: [Boards]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 10
 *         description: Number of boards per page
 *       - in: query
 *         name: sortBy
 *         schema:
 *           type: string
 *           enum: [name, createdAt, updatedAt]
 *           default: createdAt
 *         description: Field to sort by
 *       - in: query
 *         name: sortOrder
 *         schema:
 *           type: string
 *           enum: [asc, desc]
 *           default: desc
 *         description: Sort order
 *     responses:
 *       200:
 *         description: Boards retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     boards:
 *                       type: array
 *                       items:
 *                         $ref: '#/components/schemas/Board'
 *                     pagination:
 *                       $ref: '#/components/schemas/Pagination'
 */
router.get('/', cacheMiddleware(300000), async (req: any, res) => { // Cache for 5 minutes
  try {
    const { page, limit, sortBy, sortOrder } = validatePaginationParams(req.query);
    const { skip, take } = getPrismaSkipTake(page, limit);

    const where = {
      OR: [
        { ownerId: req.user.id },
        { members: { some: { userId: req.user.id } } }
      ]
    };

    const [boards, total] = await withQueryPerformance('getUserBoards', async () => 
      Promise.all([
        prisma.board.findMany({
          where,
          include: {
            owner: { select: queryOptimizations.userSelectMinimal },
            members: { include: { user: { select: queryOptimizations.userSelectMinimal } } },
            workspace: { select: { id: true, name: true } },
            lists: {
              include: {
                cards: {
                  include: {
                    labels: { include: { label: true } },
                    assignments: { include: { user: { select: queryOptimizations.userSelectMinimal } } }
                  },
                  orderBy: { position: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: sortBy === 'title' ? { title: sortOrder } : 
                   sortBy === 'updatedAt' ? { updatedAt: sortOrder } : 
                   { createdAt: sortOrder },
          skip,
          take,
        }),
        prisma.board.count({ where })
      ])
    );

    const response = createPaginationResponse(boards, total, page, limit);

    res.json({
      success: true,
      data: { 
        boards: response.data,
        pagination: response.pagination
      }
    });
  } catch (error) {
    console.error('Get boards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch boards'
    });
  }
});

// Create board
router.post('/', [
  body('title').trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('visibility').optional().isIn(['private', 'workspace']),
  body('workspaceId').optional().isString()
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, description, visibility = 'private', workspaceId } = req.body;

    // If workspaceId provided, verify user has access
    if (workspaceId) {
      const workspace = await prisma.workspace.findFirst({
        where: {
          id: workspaceId,
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } }
          ]
        }
      });

      if (!workspace) {
        return res.status(403).json({
          success: false,
          error: 'Access denied to workspace'
        });
      }
    }

    const board = await prisma.board.create({
      data: {
        title,
        description,
        visibility,
        workspaceId,
        ownerId: req.user.id,
        members: {
          create: {
            userId: req.user.id,
            role: 'owner'
          }
        }
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        workspace: { select: { id: true, name: true } }
      }
    });

    // Invalidate boards cache for user (more aggressive approach)
    invalidateCache.user(req.user.id);
    invalidateCache.pattern('boards');
    invalidateCache.pattern('GET:/boards');
    cache.clear(); // Clear all cache for immediate effect

    res.status(201).json({
      success: true,
      data: { board }
    });
  } catch (error) {
    console.error('Create board error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create board'
    });
  }
});

// Get board by ID
router.get('/:id', async (req: any, res) => {
  try {
    const board = await prisma.board.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        workspace: { select: { id: true, name: true } },
        lists: {
          include: {
            cards: {
              include: {
                labels: { include: { label: true } },
                assignments: { include: { user: { select: { id: true, name: true } } } },
                comments: {
                  include: { author: { select: { id: true, name: true } } },
                  orderBy: { createdAt: 'asc' }
                }
              },
              orderBy: { position: 'asc' }
            }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        error: 'Board not found'
      });
    }

    res.json({
      success: true,
      data: { board }
    });
  } catch (error) {
    console.error('Get board error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch board'
    });
  }
});

// Update board
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('visibility').optional().isIn(['private', 'workspace'])
], async (req: any, res: any) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user has access
    const board = await prisma.board.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id, role: { in: ['owner', 'admin'] } } } }
        ]
      }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        error: 'Board not found or insufficient permissions'
      });
    }

    const { title, description, visibility } = req.body;
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (visibility) updateData.visibility = visibility;

    const updatedBoard = await prisma.board.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        owner: { select: { id: true, name: true, email: true } },
        members: { include: { user: { select: { id: true, name: true } } } },
        workspace: { select: { id: true, name: true } }
      }
    });

    res.json({
      success: true,
      data: { board: updatedBoard }
    });
  } catch (error) {
    console.error('Update board error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update board'
    });
  }
});

// Delete board
router.delete('/:id', async (req: any, res) => {
  try {
    // Check if user is owner
    const board = await prisma.board.findFirst({
      where: {
        id: req.params.id,
        ownerId: req.user.id
      }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        error: 'Board not found or insufficient permissions'
      });
    }

    await prisma.board.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Board deleted successfully'
    });
  } catch (error) {
    console.error('Delete board error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete board'
    });
  }
});

// Search cards in board
router.get('/:id/search', async (req: any, res) => {
  try {
    const { q, label, assignee, dueDate } = req.query;

    // Check if user has access to board
    const board = await prisma.board.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        error: 'Board not found'
      });
    }

    const whereClause: any = {
      list: { boardId: req.params.id }
    };

    if (q) {
      whereClause.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } }
      ];
    }

    if (label) {
      whereClause.labels = {
        some: { label: { name: { contains: label, mode: 'insensitive' } } }
      };
    }

    if (assignee) {
      whereClause.assignments = {
        some: { user: { name: { contains: assignee, mode: 'insensitive' } } }
      };
    }

    if (dueDate) {
      const date = new Date(dueDate as string);
      whereClause.dueDate = {
        gte: new Date(date.setHours(0, 0, 0, 0)),
        lt: new Date(date.setHours(23, 59, 59, 999))
      };
    }

    const cards = await prisma.card.findMany({
      where: whereClause,
      include: {
        list: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } }
      },
      orderBy: { position: 'asc' }
    });

    res.json({
      success: true,
      data: { cards }
    });
  } catch (error) {
    console.error('Search cards error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to search cards'
    });
  }
});

export default router;
