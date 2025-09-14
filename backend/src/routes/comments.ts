import express, { Response } from 'express';
import { body, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Create comment
router.post('/', [
  body('text').trim().isLength({ min: 1 }),
  body('cardId').isString()
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

    const { text, cardId } = req.body;

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
      },
      include: { list: true }
    });

    if (!card) {
      return res.status(404).json({
        success: false,
        error: 'Card not found or insufficient permissions'
      });
    }

    const comment = await prisma.comment.create({
      data: {
        text,
        cardId,
        authorId: req.user.id
      },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'comment_added',
        data: JSON.stringify({ cardId, commentId: comment.id, commentText: text }),
        cardId,
        boardId: card.list.boardId,
        userId: req.user.id
      }
    });

    res.status(201).json({
      success: true,
      data: { comment }
    });
  } catch (error) {
    console.error('Create comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create comment'
    });
  }
});

// Update comment
router.put('/:id', [
  body('text').trim().isLength({ min: 1 })
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

    const { text } = req.body;

    // Check if user is the author of the comment
    const comment = await prisma.comment.findFirst({
      where: {
        id: req.params.id,
        authorId: req.user.id
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or insufficient permissions'
      });
    }

    const updatedComment = await prisma.comment.update({
      where: { id: req.params.id },
      data: { text },
      include: {
        author: { select: { id: true, name: true, email: true } }
      }
    });

    res.json({
      success: true,
      data: { comment: updatedComment }
    });
  } catch (error) {
    console.error('Update comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update comment'
    });
  }
});

// Delete comment
router.delete('/:id', async (req: any, res) => {
  try {
    // Check if user is the author of the comment or has admin access
    const comment = await prisma.comment.findFirst({
      where: {
        id: req.params.id,
        OR: [
          { authorId: req.user.id },
          {
            card: {
              list: {
                board: {
                  OR: [
                    { ownerId: req.user.id },
                    { members: { some: { userId: req.user.id, role: { in: ['owner', 'admin'] } } } }
                  ]
                }
              }
            }
          }
        ]
      }
    });

    if (!comment) {
      return res.status(404).json({
        success: false,
        error: 'Comment not found or insufficient permissions'
      });
    }

    await prisma.comment.delete({
      where: { id: req.params.id }
    });

    res.json({
      success: true,
      message: 'Comment deleted successfully'
    });
  } catch (error) {
    console.error('Delete comment error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete comment'
    });
  }
});

export default router;
