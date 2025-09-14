import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create list
router.post('/', [
  body('title').trim().isLength({ min: 1 }),
  body('boardId').isString(),
  body('position').optional().isNumeric()
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { title, boardId, position } = req.body;

    // Check if user has access to board
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
      return res.status(403).json({
        success: false,
        error: 'Access denied to board'
      });
    }

    // Get the highest position if not provided
    let listPosition = position;
    if (listPosition === undefined) {
      const lastList = await prisma.list.findFirst({
        where: { boardId },
        orderBy: { position: 'desc' }
      });
      listPosition = lastList ? lastList.position + 1000 : 1000;
    }

    const list = await prisma.list.create({
      data: {
        title,
        boardId,
        position: listPosition
      },
      include: {
        cards: {
          include: {
            labels: { include: { label: true } },
            assignments: { include: { user: { select: { id: true, name: true } } } }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: { list }
    });
  } catch (error) {
    console.error('Create list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create list'
    });
  }
});

// Update list
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('position').optional().isNumeric()
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    // Check if user has access to the list's board
    const list = await prisma.list.findFirst({
      where: {
        id: req.params.id,
        board: {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } }
          ]
        }
      }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found or insufficient permissions'
      });
    }

    const { title, position } = req.body;
    const updateData: any = {};
    if (title) updateData.title = title;
    if (position !== undefined) updateData.position = position;

    const updatedList = await prisma.list.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        cards: {
          include: {
            labels: { include: { label: true } },
            assignments: { include: { user: { select: { id: true, name: true } } } }
          },
          orderBy: { position: 'asc' }
        }
      }
    });

    res.json({
      success: true,
      data: { list: updatedList }
    });
  } catch (error) {
    console.error('Update list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update list'
    });
  }
});

// Delete list
router.delete('/:id', async (req: any, res) => {
  try {
    // Check if user has access to the list's board
    const list = await prisma.list.findFirst({
      where: {
        id: req.params.id,
        board: {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id, role: { in: ['owner', 'admin'] } } } }
          ]
        }
      }
    });

    if (!list) {
      return res.status(404).json({
        success: false,
        error: 'List not found or insufficient permissions'
      });
    }

    await prisma.list.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'List deleted successfully'
    });
  } catch (error) {
    console.error('Delete list error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete list'
    });
  }
});

// Reorder lists
router.put('/reorder', [
  body('listIds').isArray({ min: 1 }),
  body('boardId').isString()
], async (req: any, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        error: 'Validation failed',
        details: errors.array()
      });
    }

    const { listIds, boardId } = req.body;

    // Check if user has access to board
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
      return res.status(403).json({
        success: false,
        error: 'Access denied to board'
      });
    }

    // Update positions using fractional positioning
    const updates = listIds.map((listId: string, index: number) => 
      prisma.list.update({
        where: { id: listId },
        data: { position: (index + 1) * 1000 }
      })
    );

    await Promise.all(updates);

    res.json({
      success: true,
      message: 'Lists reordered successfully'
    });
  } catch (error) {
    console.error('Reorder lists error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to reorder lists'
    });
  }
});

export default router;
