# Low-Level Design (LLD)

## Database Schema Design

### Entity Relationship Diagram

```
Users (1) ──┐
            ├── WorkspaceMembers (M) ── Workspaces (1)
            │
            ├── BoardMembers (M) ── Boards (1) ── Workspaces (1)
            │
            ├── CardAssignments (M) ── Cards (1) ── Lists (1) ── Boards (1)
            │
            ├── Comments (M) ── Cards (1)
            │
            └── Activities (M) ── Cards (1)
                                 │
                                 └── Boards (1)

Labels (1) ── CardLabels (M) ── Cards (1)
```

### Table Definitions

#### Users Table
```sql
CREATE TABLE users (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  avatar VARCHAR(500),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_users_email` on `email` (unique)
- `idx_users_created_at` on `created_at`

#### Workspaces Table
```sql
CREATE TABLE workspaces (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  owner_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_workspaces_owner_id` on `owner_id`
- `idx_workspaces_created_at` on `created_at`

#### WorkspaceMembers Table
```sql
CREATE TABLE workspace_members (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  workspace_id VARCHAR(25) NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(workspace_id, user_id)
);
```

**Indexes:**
- `idx_workspace_members_workspace_id` on `workspace_id`
- `idx_workspace_members_user_id` on `user_id`
- `idx_workspace_members_role` on `role`

#### Boards Table
```sql
CREATE TABLE boards (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  visibility VARCHAR(50) DEFAULT 'private',
  position DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  workspace_id VARCHAR(25) REFERENCES workspaces(id) ON DELETE CASCADE,
  owner_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_boards_owner_id` on `owner_id`
- `idx_boards_workspace_id` on `workspace_id`
- `idx_boards_position` on `position`
- `idx_boards_visibility` on `visibility`

#### BoardMembers Table
```sql
CREATE TABLE board_members (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  board_id VARCHAR(25) NOT NULL REFERENCES boards(id) ON DELETE CASCADE,
  user_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role VARCHAR(50) DEFAULT 'member',
  created_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(board_id, user_id)
);
```

**Indexes:**
- `idx_board_members_board_id` on `board_id`
- `idx_board_members_user_id` on `user_id`
- `idx_board_members_role` on `role`

#### Lists Table
```sql
CREATE TABLE lists (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  title VARCHAR(255) NOT NULL,
  position DECIMAL(10,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  board_id VARCHAR(25) NOT NULL REFERENCES boards(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_lists_board_id` on `board_id`
- `idx_lists_position` on `position`

#### Cards Table
```sql
CREATE TABLE cards (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT,
  position DECIMAL(10,2) DEFAULT 0,
  due_date TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  list_id VARCHAR(25) NOT NULL REFERENCES lists(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_cards_list_id` on `list_id`
- `idx_cards_position` on `position`
- `idx_cards_due_date` on `due_date`
- `idx_cards_title` on `title` (for search)

#### Labels Table
```sql
CREATE TABLE labels (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  name VARCHAR(255) NOT NULL,
  color VARCHAR(7) DEFAULT '#61bd4f',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

**Indexes:**
- `idx_labels_name` on `name`

#### CardLabels Table
```sql
CREATE TABLE card_labels (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  card_id VARCHAR(25) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  label_id VARCHAR(25) NOT NULL REFERENCES labels(id) ON DELETE CASCADE,
  UNIQUE(card_id, label_id)
);
```

**Indexes:**
- `idx_card_labels_card_id` on `card_id`
- `idx_card_labels_label_id` on `label_id`

#### CardAssignments Table
```sql
CREATE TABLE card_assignments (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  card_id VARCHAR(25) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  user_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  UNIQUE(card_id, user_id)
);
```

**Indexes:**
- `idx_card_assignments_card_id` on `card_id`
- `idx_card_assignments_user_id` on `user_id`

#### Comments Table
```sql
CREATE TABLE comments (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  text TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  card_id VARCHAR(25) NOT NULL REFERENCES cards(id) ON DELETE CASCADE,
  author_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_comments_card_id` on `card_id`
- `idx_comments_author_id` on `author_id`
- `idx_comments_created_at` on `created_at`

#### Activities Table
```sql
CREATE TABLE activities (
  id VARCHAR(25) PRIMARY KEY DEFAULT cuid(),
  type VARCHAR(100) NOT NULL,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  card_id VARCHAR(25) REFERENCES cards(id) ON DELETE CASCADE,
  board_id VARCHAR(25) REFERENCES boards(id) ON DELETE CASCADE,
  user_id VARCHAR(25) NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
```

**Indexes:**
- `idx_activities_card_id` on `card_id`
- `idx_activities_board_id` on `board_id`
- `idx_activities_user_id` on `user_id`
- `idx_activities_created_at` on `created_at`
- `idx_activities_type` on `type`

## API Design Specifications

### Authentication Endpoints

#### POST /api/auth/register
**Request:**
```typescript
{
  name: string;
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
    token: string;
  };
}
```

**Error Responses:**
- `400`: Validation failed
- `409`: User already exists
- `500`: Internal server error

#### POST /api/auth/login
**Request:**
```typescript
{
  email: string;
  password: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    user: {
      id: string;
      email: string;
      name: string;
      avatar?: string;
    };
    token: string;
  };
}
```

**Error Responses:**
- `400`: Validation failed
- `401`: Invalid credentials
- `500`: Internal server error

### Board Endpoints

#### GET /api/boards
**Query Parameters:**
- `limit?: number` (default: 50)
- `offset?: number` (default: 0)

**Response:**
```typescript
{
  success: boolean;
  data: {
    boards: Array<{
      id: string;
      title: string;
      description?: string;
      visibility: 'private' | 'workspace';
      position: number;
      created_at: string;
      updated_at: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
      workspace?: {
        id: string;
        name: string;
      };
      members: Array<{
        id: string;
        role: string;
        user: {
          id: string;
          name: string;
        };
      }>;
      lists: Array<{
        id: string;
        title: string;
        position: number;
        cards: Array<{
          id: string;
          title: string;
          position: number;
          labels: Array<{
            id: string;
            label: {
              id: string;
              name: string;
              color: string;
            };
          }>;
          assignments: Array<{
            id: string;
            user: {
              id: string;
              name: string;
            };
          }>;
        }>;
      }>;
    }>;
  };
}
```

#### POST /api/boards
**Request:**
```typescript
{
  title: string;
  description?: string;
  visibility?: 'private' | 'workspace';
  workspace_id?: string;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    board: {
      id: string;
      title: string;
      description?: string;
      visibility: 'private' | 'workspace';
      position: number;
      created_at: string;
      updated_at: string;
      owner: {
        id: string;
        name: string;
        email: string;
      };
      workspace?: {
        id: string;
        name: string;
      };
    };
  };
}
```

### Card Endpoints

#### POST /api/cards
**Request:**
```typescript
{
  title: string;
  description?: string;
  list_id: string;
  position?: number;
  due_date?: string; // ISO 8601 format
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    card: {
      id: string;
      title: string;
      description?: string;
      position: number;
      due_date?: string;
      created_at: string;
      updated_at: string;
      list: {
        id: string;
        title: string;
      };
      labels: Array<{
        id: string;
        label: {
          id: string;
          name: string;
          color: string;
        };
      }>;
      assignments: Array<{
        id: string;
        user: {
          id: string;
          name: string;
        };
      }>;
      comments: Array<{
        id: string;
        text: string;
        created_at: string;
        author: {
          id: string;
          name: string;
        };
      }>;
    };
  };
}
```

#### PUT /api/cards/:id/move
**Request:**
```typescript
{
  list_id: string;
  position: number;
}
```

**Response:**
```typescript
{
  success: boolean;
  data: {
    card: {
      id: string;
      title: string;
      position: number;
      list_id: string;
      // ... other card fields
    };
  };
}
```

## Error Handling Strategy

### Error Response Format
```typescript
{
  success: false;
  error: string;
  details?: Array<{
    field: string;
    message: string;
  }>;
  stack?: string; // Only in development
}
```

### Error Categories

#### 4xx Client Errors
- `400 Bad Request`: Invalid request data
- `401 Unauthorized`: Missing or invalid authentication
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `409 Conflict`: Resource already exists
- `422 Unprocessable Entity`: Validation failed

#### 5xx Server Errors
- `500 Internal Server Error`: Unexpected server error
- `503 Service Unavailable`: Service temporarily unavailable

### Error Handling Implementation

#### Frontend Error Handling
```typescript
// API Client Error Interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Redirect to login
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
```

#### Backend Error Handling
```typescript
// Global Error Handler
export const errorHandler = (
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  console.error(err);

  // Handle specific error types
  if (err.name === 'PrismaClientKnownRequestError') {
    const prismaError = err as any;
    switch (prismaError.code) {
      case 'P2002':
        error = { message: 'Duplicate field value entered', statusCode: 400 };
        break;
      case 'P2025':
        error = { message: 'Record not found', statusCode: 404 };
        break;
      default:
        error = { message: 'Database error', statusCode: 500 };
    }
  }

  res.status(error.statusCode || 500).json({
    success: false,
    error: error.message || 'Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};
```

## Ordering Strategy

### Fractional Positioning Implementation

#### Concept
Use decimal numbers to represent positions, allowing efficient insertions without updating all items.

#### Implementation
```typescript
// Initial positions
const initialPosition = 1000;

// Insert at beginning
const newPosition = 500;

// Insert at end
const newPosition = 2000;

// Insert between items
const newPosition = (item1.position + item2.position) / 2;

// Reorder multiple items
const reorderedItems = items.map((item, index) => ({
  ...item,
  position: (index + 1) * 1000
}));
```

#### Benefits
- O(1) insertion complexity
- Minimal database updates
- No need to update all items when reordering
- Maintains order even with concurrent updates

#### Example Scenarios

**Scenario 1: Insert Card at Beginning**
```typescript
// Current cards: [1000, 2000, 3000]
// Insert new card at position 0
const newPosition = 500;
// Result: [500, 1000, 2000, 3000]
```

**Scenario 2: Insert Card Between Items**
```typescript
// Current cards: [1000, 2000, 3000]
// Insert new card between 1000 and 2000
const newPosition = (1000 + 2000) / 2; // 1500
// Result: [1000, 1500, 2000, 3000]
```

**Scenario 3: Reorder Multiple Items**
```typescript
// Drag and drop reordering
const reorderedItems = ['card3', 'card1', 'card2'];
const updatedItems = reorderedItems.map((item, index) => ({
  ...item,
  position: (index + 1) * 1000
}));
// Result: [1000, 2000, 3000]
```

## WebSocket Event Specifications

### Event Types

#### Card Events
```typescript
// Card moved
{
  event: 'card-moved';
  data: {
    cardId: string;
    boardId: string;
    fromListId: string;
    toListId: string;
    position: number;
    movedBy: {
      id: string;
      name: string;
    };
  };
}

// Card updated
{
  event: 'card-updated';
  data: {
    cardId: string;
    boardId: string;
    updates: {
      title?: string;
      description?: string;
      dueDate?: string;
    };
    updatedBy: {
      id: string;
      name: string;
    };
  };
}
```

#### Comment Events
```typescript
// Comment added
{
  event: 'comment-added';
  data: {
    cardId: string;
    boardId: string;
    comment: {
      id: string;
      text: string;
      createdAt: string;
      author: {
        id: string;
        name: string;
      };
    };
    addedBy: {
      id: string;
      name: string;
    };
  };
}
```

#### List Events
```typescript
// List updated
{
  event: 'list-updated';
  data: {
    listId: string;
    boardId: string;
    updates: {
      title?: string;
      position?: number;
    };
    updatedBy: {
      id: string;
      name: string;
    };
  };
}

// Lists reordered
{
  event: 'lists-reordered';
  data: {
    boardId: string;
    listIds: string[];
    reorderedBy: {
      id: string;
      name: string;
    };
  };
}
```

### Room Management

#### Join Board Room
```typescript
socket.emit('join-board', boardId);
```

#### Leave Board Room
```typescript
socket.emit('leave-board', boardId);
```

#### Room-based Broadcasting
```typescript
// Broadcast to all users in a board room
socket.to(`board-${boardId}`).emit('card-moved', data);

// Broadcast to all users except sender
socket.to(`board-${boardId}`).emit('card-updated', data);
```

## Security Implementation

### JWT Token Structure
```typescript
interface JWTPayload {
  userId: string;
  email: string;
  iat: number;
  exp: number;
}
```

### Authentication Middleware
```typescript
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
    
    // Verify user still exists
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: { id: true, email: true, name: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};
```

### Input Validation
```typescript
// Express Validator rules
const validateCard = [
  body('title').trim().isLength({ min: 1 }).withMessage('Title is required'),
  body('description').optional().trim(),
  body('list_id').isString().withMessage('List ID is required'),
  body('position').optional().isNumeric().withMessage('Position must be a number'),
  body('due_date').optional().isISO8601().withMessage('Due date must be valid ISO 8601 format')
];
```

### Rate Limiting
```typescript
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: 'Too many requests from this IP, please try again later.'
});
```

## Performance Optimization

### Database Query Optimization

#### Efficient Board Loading
```typescript
const board = await prisma.board.findUnique({
  where: { id: boardId },
  include: {
    lists: {
      include: {
        cards: {
          include: {
            labels: { include: { label: true } },
            assignments: { include: { user: true } },
            comments: {
              include: { author: true },
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
```

#### Search Optimization
```typescript
// Full-text search with indexes
const cards = await prisma.card.findMany({
  where: {
    AND: [
      { list: { boardId } },
      {
        OR: [
          { title: { contains: searchQuery, mode: 'insensitive' } },
          { description: { contains: searchQuery, mode: 'insensitive' } }
        ]
      }
    ]
  },
  include: {
    list: { select: { id: true, title: true } },
    labels: { include: { label: true } },
    assignments: { include: { user: true } }
  }
});
```

### Frontend Performance

#### React Query Configuration
```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false
    }
  }
});
```

#### Optimistic Updates
```typescript
const moveCardMutation = useMutation({
  mutationFn: moveCard,
  onMutate: async (newCard) => {
    // Cancel outgoing refetches
    await queryClient.cancelQueries(['board', boardId]);
    
    // Snapshot previous value
    const previousBoard = queryClient.getQueryData(['board', boardId]);
    
    // Optimistically update
    queryClient.setQueryData(['board', boardId], (old: any) => ({
      ...old,
      lists: old.lists.map((list: any) =>
        list.id === newCard.listId
          ? { ...list, cards: [...list.cards, newCard] }
          : list
      )
    }));
    
    return { previousBoard };
  },
  onError: (err, newCard, context) => {
    // Rollback on error
    queryClient.setQueryData(['board', boardId], context?.previousBoard);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries(['board', boardId]);
  }
});
```

## Testing Strategy

### Unit Tests
```typescript
// API Route Testing
describe('POST /api/cards', () => {
  it('should create a new card', async () => {
    const cardData = {
      title: 'Test Card',
      list_id: 'list123'
    };
    
    const response = await request(app)
      .post('/api/cards')
      .set('Authorization', `Bearer ${validToken}`)
      .send(cardData)
      .expect(201);
    
    expect(response.body.success).toBe(true);
    expect(response.body.data.card.title).toBe('Test Card');
  });
});
```

### Integration Tests
```typescript
// Database Integration Tests
describe('Card Creation Flow', () => {
  it('should create card and update activity log', async () => {
    const card = await createCard({
      title: 'Test Card',
      listId: 'list123',
      userId: 'user123'
    });
    
    const activity = await prisma.activity.findFirst({
      where: { cardId: card.id, type: 'card_created' }
    });
    
    expect(activity).toBeTruthy();
    expect(activity?.data).toMatchObject({
      cardId: card.id,
      cardTitle: 'Test Card'
    });
  });
});
```

### End-to-End Tests
```typescript
// Frontend E2E Tests
describe('Board Management', () => {
  it('should allow user to create and manage boards', () => {
    cy.visit('/login');
    cy.get('[data-cy=email]').type('john@example.com');
    cy.get('[data-cy=password]').type('password');
    cy.get('[data-cy=login-button]').click();
    
    cy.url().should('include', '/dashboard');
    cy.get('[data-cy=create-board]').click();
    cy.get('[data-cy=board-title]').type('Test Board');
    cy.get('[data-cy=save-board]').click();
    
    cy.get('[data-cy=board-list]').should('contain', 'Test Board');
  });
});
```

## Monitoring and Logging

### Structured Logging
```typescript
// Winston Logger Configuration
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});
```

### Performance Monitoring
```typescript
// Request Timing Middleware
const requestTimer = (req: Request, res: Response, next: NextFunction) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    logger.info('Request completed', {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`
    });
  });
  
  next();
};
```

## Conclusion

This Low-Level Design document provides detailed specifications for implementing the Mini Trello application. The design emphasizes:

1. **Scalability**: Efficient database design with proper indexing
2. **Performance**: Optimized queries and caching strategies
3. **Security**: Comprehensive authentication and authorization
4. **Maintainability**: Clear separation of concerns and modular design
5. **Reliability**: Robust error handling and monitoring

The implementation follows modern web development best practices and provides a solid foundation for future enhancements and scaling.
