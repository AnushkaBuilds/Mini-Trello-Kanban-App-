import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface AuthenticatedSocket extends Socket {
  userId?: string;
  user?: {
    id: string;
    name: string;
    email: string;
  };
}

export const setupSocketHandlers = (io: Server) => {
  // Authentication middleware
  io.use(async (socket: AuthenticatedSocket, next) => {
    try {
      const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
      
      if (!token) {
        return next(new Error('Authentication error'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: { id: true, name: true, email: true }
      });

      if (!user) {
        return next(new Error('User not found'));
      }

      socket.userId = user.id;
      socket.user = user;
      next();
    } catch (error) {
      next(new Error('Authentication error'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    console.log(`User ${socket.user?.name} connected`);

    // Join board rooms
    socket.on('join-board', async (boardId: string) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          socket.join(`board-${boardId}`);
          console.log(`User ${socket.user?.name} joined board ${boardId}`);
        }
      } catch (error) {
        console.error('Error joining board:', error);
      }
    });

    // Leave board rooms
    socket.on('leave-board', (boardId: string) => {
      socket.leave(`board-${boardId}`);
      console.log(`User ${socket.user?.name} left board ${boardId}`);
    });

    // Handle card updates
    socket.on('card-updated', async (data: { cardId: string; boardId: string; updates: any }) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: data.boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          // Broadcast to all users in the board room except sender
          socket.to(`board-${data.boardId}`).emit('card-updated', {
            ...data,
            updatedBy: socket.user
          });
        }
      } catch (error) {
        console.error('Error broadcasting card update:', error);
      }
    });

    // Handle card moved
    socket.on('card-moved', async (data: { 
      cardId: string; 
      boardId: string; 
      fromListId: string; 
      toListId: string; 
      position: number;
    }) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: data.boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          // Broadcast to all users in the board room except sender
          socket.to(`board-${data.boardId}`).emit('card-moved', {
            ...data,
            movedBy: socket.user
          });
        }
      } catch (error) {
        console.error('Error broadcasting card move:', error);
      }
    });

    // Handle new comment
    socket.on('comment-added', async (data: { 
      cardId: string; 
      boardId: string; 
      comment: any;
    }) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: data.boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          // Broadcast to all users in the board room except sender
          socket.to(`board-${data.boardId}`).emit('comment-added', {
            ...data,
            addedBy: socket.user
          });
        }
      } catch (error) {
        console.error('Error broadcasting comment:', error);
      }
    });

    // Handle list updates
    socket.on('list-updated', async (data: { listId: string; boardId: string; updates: any }) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: data.boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          // Broadcast to all users in the board room except sender
          socket.to(`board-${data.boardId}`).emit('list-updated', {
            ...data,
            updatedBy: socket.user
          });
        }
      } catch (error) {
        console.error('Error broadcasting list update:', error);
      }
    });

    // Handle list reordered
    socket.on('lists-reordered', async (data: { boardId: string; listIds: string[] }) => {
      try {
        // Verify user has access to board
        const board = await prisma.board.findFirst({
          where: {
            id: data.boardId,
            OR: [
              { ownerId: socket.userId },
              { members: { some: { userId: socket.userId } } }
            ]
          }
        });

        if (board) {
          // Broadcast to all users in the board room except sender
          socket.to(`board-${data.boardId}`).emit('lists-reordered', {
            ...data,
            reorderedBy: socket.user
          });
        }
      } catch (error) {
        console.error('Error broadcasting list reorder:', error);
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log(`User ${socket.user?.name} disconnected`);
    });
  });
};
