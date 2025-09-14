import { Router } from 'express';
import authRoutes from '../auth';
import userRoutes from '../users';
import workspaceRoutes from '../workspaces';
import boardRoutes from '../boards';
import listRoutes from '../lists';
import cardRoutes from '../cards';
import commentRoutes from '../comments';
import activityRoutes from '../activities';
import { authenticateToken } from '../../middleware/auth';

const router = Router();

// Public routes (no auth required)
router.use('/auth', authRoutes);

// Protected routes (auth required)
router.use('/users', authenticateToken, userRoutes);
router.use('/workspaces', authenticateToken, workspaceRoutes);
router.use('/boards', authenticateToken, boardRoutes);
router.use('/lists', authenticateToken, listRoutes);
router.use('/cards', authenticateToken, cardRoutes);
router.use('/comments', authenticateToken, commentRoutes);
router.use('/activities', authenticateToken, activityRoutes);

export default router;
