import { PrismaClient } from '@prisma/client';
import { getConfig } from './env';

// Database connection configuration with optimizations
const createPrismaClient = () => {
  const config = getConfig();
  
  return new PrismaClient({
    log: config.NODE_ENV === 'development' 
      ? ['query', 'info', 'warn', 'error'] 
      : ['error'],
    datasources: {
      db: {
        url: config.DATABASE_URL,
      },
    },
  });
};

// Global instance with connection pooling - initialize lazily
let _prisma: PrismaClient | null = null;

export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    if (!_prisma) {
      _prisma = createPrismaClient();
    }
    return (_prisma as any)[prop];
  }
});

// Query optimization utilities
export const queryOptimizations = {
  // Common select fields to reduce data transfer
  userSelect: {
    id: true,
    name: true,
    email: true,
    createdAt: true,
    updatedAt: true,
  },

  userSelectMinimal: {
    id: true,
    name: true,
  },

  boardSelectMinimal: {
    id: true,
    title: true,
    visibility: true,
    ownerId: true,
    workspaceId: true,
  },

  cardSelectMinimal: {
    id: true,
    title: true,
    position: true,
    listId: true,
  },

  // Optimized board query with selective includes
  getBoardWithOptimizedIncludes: (includeFullDetails = false) => ({
    include: {
      owner: { select: queryOptimizations.userSelectMinimal },
      workspace: { select: { id: true, name: true } },
      members: includeFullDetails ? {
        include: { user: { select: queryOptimizations.userSelectMinimal } }
      } : false,
      lists: includeFullDetails ? {
        include: {
          cards: {
            include: {
              labels: { include: { label: true } },
              assignments: { 
                include: { user: { select: queryOptimizations.userSelectMinimal } } 
              }
            },
            orderBy: { position: 'asc' }
          }
        },
        orderBy: { position: 'asc' }
      } : false,
    }
  }),
};

// Database health check
export const checkDatabaseHealth = async (): Promise<boolean> => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch (error) {
    console.error('Database health check failed:', error);
    return false;
  }
};

// Connection cleanup on app shutdown
export const closeDatabaseConnection = async (): Promise<void> => {
  try {
    await prisma.$disconnect();
    console.log('Database connection closed successfully');
  } catch (error) {
    console.error('Error closing database connection:', error);
  }
};

// Query performance monitoring
export const withQueryPerformance = async <T>(
  queryName: string,
  queryFn: () => Promise<T>
): Promise<T> => {
  const startTime = Date.now();
  try {
    const result = await queryFn();
    const duration = Date.now() - startTime;
    
    if (duration > 1000) { // Log slow queries
      console.warn(`Slow query detected: ${queryName} took ${duration}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error(`Query failed: ${queryName} after ${duration}ms`, error);
    throw error;
  }
};
