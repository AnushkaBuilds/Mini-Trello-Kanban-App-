import express from 'express';
import { validatePaginationParams, createPaginationResponse, getPrismaSkipTake } from '../utils/pagination';
import { prisma, queryOptimizations, withQueryPerformance } from '../config/database';

const router = express.Router();

/**
 * @swagger
 * /api/v1/activities/board/{boardId}:
 *   get:
 *     summary: Get activities for a board with pagination
 *     tags: [Activities]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *         description: Board ID
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
 *           default: 20
 *         description: Number of activities per page
 *     responses:
 *       200:
 *         description: Activities retrieved successfully
 *       404:
 *         description: Board not found or insufficient permissions
 */
router.get('/board/:boardId', async (req: any, res: any) => {
  try {
    const { boardId } = req.params;
    const { page, limit } = validatePaginationParams(req.query);
    const { skip, take } = getPrismaSkipTake(page, limit);

    // Check if user has access to the board
    const board = await prisma.board.findFirst({
      where: {
        id: boardId,
        OR: [
          { ownerId: req.user.id },
          { members: { some: { userId: req.user.id } } }
        ]
      }
    });

    if (!board) {
      return res.status(404).json({
        success: false,
        error: 'Board not found or insufficient permissions'
      });
    }

    const [activities, total] = await withQueryPerformance('getBoardActivities', async () =>
      Promise.all([
        prisma.activity.findMany({
          where: { boardId },
          include: {
            user: { select: queryOptimizations.userSelectMinimal },
            card: { select: queryOptimizations.cardSelectMinimal }
          },
          orderBy: { createdAt: 'desc' },
          skip,
          take,
        }),
        prisma.activity.count({ where: { boardId } })
      ])
    );

    const response = createPaginationResponse(activities, total, page, limit);

    res.json({
      success: true,
      data: { 
        activities: response.data,
        pagination: response.pagination
      }
    });
  } catch (error) {
    console.error('Get board activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

// Get activities for a card
router.get('/card/:cardId', async (req: any, res) => {
  try {
    const { cardId } = req.params;
    const { limit = 20, offset = 0 } = req.query;

    // Check if user has access to the card's board
    const card = await prisma.card.findFirst({
      where: {
        id: cardId,
        list: {
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } }
            ]
          }
        }
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found or insufficient permissions'
      });
    }

    const activities = await prisma.activity.findMany({
      where: { cardId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        card: { select: { id: true, title: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: parseInt(limit as string),
      skip: parseInt(offset as string)
    });

    res.json({
      success: true,
      data: { activities }
    });
  } catch (error) {
    console.error('Get card activities error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch activities'
    });
  }
});

export default router;
