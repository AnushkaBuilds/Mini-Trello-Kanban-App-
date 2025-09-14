import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create card
router.post('/', [
  body('title').trim().isLength({ min: 1 }),
  body('listId').isString(),
  body('description').optional().trim(),
  body('position').optional().isNumeric(),
  body('dueDate').optional().isISO8601()
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

    const { title, listId, description, position, dueDate } = req.body;

    // Check if user has access to the list's board
    const list = await prisma.list.findFirst({
      where: {
        id: listId,
        board: {
          OR: [
            { ownerId: req.user.id },
            { members: { some: { userId: req.user.id } } }
          ]
        }
      }
    });

    if (!list) {
      return res.status(403).json({
        success: false,
        error: 'Access denied to list'
      });
    }

    // Get the highest position if not provided
    let cardPosition = position;
    if (cardPosition === undefined) {
      const lastCard = await prisma.card.findFirst({
        where: { listId },
        orderBy: { position: 'desc' }
      });
      cardPosition = lastCard ? lastCard.position + 1000 : 1000;
    }

    const card = await prisma.card.create({
      data: {
        title,
        description,
        listId,
        position: cardPosition,
        dueDate: dueDate ? new Date(dueDate) : null
      },
      include: {
        list: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'card_created',
        data: JSON.stringify({ cardId: card.id, cardTitle: card.title }),
        cardId: card.id,
        boardId: list.boardId,
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: { card }
    });
  } catch (error) {
    console.error('Create card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create card'
    });
  }
});

// Get card by ID
router.get('/:id', async (req: any, res) => {
  try {
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
        list: {
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } }
            ]
          }
        }
      },
      include: {
        list: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found'
      });
    }

    res.json({
      success: true,
      data: { card }
    });
  } catch (error) {
    console.error('Get card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch card'
    });
  }
});

// Update card
router.put('/:id', [
  body('title').optional().trim().isLength({ min: 1 }),
  body('description').optional().trim(),
  body('dueDate').optional().isISO8601()
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

    // Check if user has access to the card's board
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
        list: {
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } }
            ]
          }
        }
      },
      include: {
        list: { select: { id: true, boardId: true } }
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found or insufficient permissions'
      });
    }

    const { title, description, dueDate } = req.body;
    const updateData: any = {};
    if (title) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;

    const updatedCard = await prisma.card.update({
      where: { id: req.params.id },
      data: updateData,
      include: {
        list: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'card_updated',
        data: JSON.stringify({ cardId: updatedCard.id, changes: updateData }),
        cardId: updatedCard.id,
        boardId: card.list.boardId,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      data: { card: updatedCard }
    });
  } catch (error) {
    console.error('Update card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update card'
    });
  }
});

// Move card
router.put('/:id/move', [
  body('listId').isString(),
  body('position').isNumeric()
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

    const { listId, position } = req.body;

    // Check if user has access to both the card and the target list
    const [card, targetList] = await Promise.all([
      prisma.card.findFirst({
        where: {
          id: req.params.id,
          list: {
            board: {
              OR: [
                { ownerId: req.user.id },
                { members: { some: { userId: req.user.id } } }
              ]
            }
          }
        },
        include: { list: true }
      }),
      prisma.list.findFirst({
        where: {
          id: listId,
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } }
            ]
          }
        }
      })
    ]);

    if (!card || !targetList) {
      return res.status(404).json({
        success: false,
        error: 'Card or target list not found or insufficient permissions'
      });
    }

    const updatedCard = await prisma.card.update({
      where: { id: req.params.id },
      data: {
        listId,
        position
      },
      include: {
        list: { select: { id: true, title: true } },
        labels: { include: { label: true } },
        assignments: { include: { user: { select: { id: true, name: true } } } },
        comments: {
          include: { author: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'asc' }
        }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'card_moved',
        data: JSON.stringify({ 
          cardId: updatedCard.id, 
          fromListId: card.listId, 
          toListId: listId,
          fromListTitle: card.list.title,
          toListTitle: targetList.title
        }),
        cardId: updatedCard.id,
        boardId: targetList.boardId,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      data: { card: updatedCard }
    });
  } catch (error) {
    console.error('Move card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to move card'
    });
  }
});

// Delete card
router.delete('/:id', async (req: any, res) => {
  try {
    // Check if user has access to the card's board
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
        list: {
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id, role: { in: ['owner', 'admin'] } } } }
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

    await prisma.card.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Card deleted successfully'
    });
  } catch (error) {
    console.error('Delete card error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete card'
    });
  }
});

// Add label to card
router.post('/:id/labels', [
  body('labelId').isString()
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

    const { labelId } = req.body;

    // Check if user has access to the card
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
        list: {
          board: {
            OR: [
              { ownerId: req.user.id },
              { members: { some: { userId: req.user.id } } }
            ]
          }
        }
      },
      include: {
        list: { select: { id: true, boardId: true } }
      }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found or insufficient permissions'
      });
    }

    // Check if label exists
    const label = await prisma.label.findUnique({
      where: { id: labelId }
    });

    if (!label) {
      return res.status(404).json({
        success: false,
        error: 'Label not found'
      });
    }

    // Add label to card
    await prisma.cardLabel.create({
      data: {
        cardId: req.params.id,
        labelId
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'label_added',
        data: JSON.stringify({ cardId: req.params.id, labelId, labelName: label.name }),
        cardId: req.params.id,
        boardId: card.list.boardId,
        userId: req.user.id
      }
    });

    res.json({
      success: true,
      message: 'Label added to card'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'Label already added to card'
      });
    }
    console.error('Add label error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to add label to card'
    });
  }
});

// Remove label from card
router.delete('/:id/labels/:labelId', async (req: any, res) => {
  try {
    // Check if user has access to the card
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
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

    await prisma.cardLabel.delete({
      where: {
        cardId_labelId: {
          cardId: req.params.id,
          labelId: req.params.labelId
        }
      }
    });

    res.json({
      success: true,
      message: 'Label removed from card'
    });
  } catch (error) {
    console.error('Remove label error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove label from card'
    });
  }
});

// Assign user to card
router.post('/:id/assignments', [
  body('userId').isString()
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

    const { userId } = req.body;

    // Check if user has access to the card
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
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

    // Check if user to be assigned exists
    const userToAssign = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!userToAssign) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }

    // Assign user to card
    await prisma.cardAssignment.create({
      data: {
        cardId: req.params.id,
        userId
      }
    });

    res.json({
      success: true,
      message: 'User assigned to card'
    });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({
        success: false,
        error: 'User already assigned to card'
      });
    }
    console.error('Assign user error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to assign user to card'
    });
  }
});

// Remove user assignment from card
router.delete('/:id/assignments/:userId', async (req: any, res) => {
  try {
    // Check if user has access to the card
    const card = await prisma.card.findFirst({
      where: {
        id: req.params.id,
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

    await prisma.cardAssignment.delete({
      where: {
        cardId_userId: {
          cardId: req.params.id,
          userId: req.params.userId
        }
      }
    });

    res.json({
      success: true,
      message: 'User assignment removed from card'
    });
  } catch (error) {
    console.error('Remove assignment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove user assignment from card'
    });
  }
});

export default router;
