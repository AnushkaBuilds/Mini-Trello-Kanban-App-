# 🛠️ Development Guide - Mini Trello

## Development Environment Setup

### Prerequisites Checklist
- [ ] Node.js v16+ installed
- [ ] npm v8+ installed  
- [ ] PostgreSQL v12+ installed and running
- [ ] Git installed
- [ ] VS Code (recommended) with extensions:
  - [ ] TypeScript Hero
  - [ ] Prettier
  - [ ] ESLint
  - [ ] Prisma
  - [ ] Thunder Client (for API testing)

### Environment Setup

#### 1. Clone and Initial Setup
```bash
git clone <repository-url>
cd "Trello App"
npm run install:all
```

#### 2. Environment Configuration
```bash
# Copy environment template
cp backend/env.example backend/.env

# Edit backend/.env with your settings:
DATABASE_URL="postgresql://username:password@localhost:5432/trello_db"
JWT_SECRET="your-super-secure-jwt-secret-key-minimum-256-bits"
PORT=3001
NODE_ENV="development"
CORS_ORIGIN="http://localhost:3000"
LOG_LEVEL="debug"
```

#### 3. Database Setup
```bash
# Create database
createdb trello_db

# Run migrations and seed
npm run setup:db
```

## Development Workflow

### Daily Development Routine
```bash
# 1. Pull latest changes
git pull origin main

# 2. Install any new dependencies
npm run install:all

# 3. Apply any new database migrations
npm run db:migrate

# 4. Start development servers
npm run dev
```

### Code Quality Workflow
```bash
# Before committing
npm run type-check    # Check TypeScript
npm run lint         # Check code style
npm run test         # Run tests
```

## Project Architecture

### Backend Structure
```
backend/
├── src/
│   ├── index.ts           # Server entry point
│   ├── middleware/        # Express middleware
│   │   ├── auth.ts        # JWT authentication
│   │   ├── errorHandler.ts # Error handling
│   │   └── security.ts    # Security headers
│   ├── routes/           # API endpoints
│   │   ├── auth.ts       # Authentication routes
│   │   ├── boards.ts     # Board management
│   │   ├── cards.ts      # Card operations
│   │   ├── lists.ts      # List management
│   │   └── users.ts      # User operations
│   └── socket/           # WebSocket handlers
└── prisma/
    └── schema.prisma     # Database schema
```

### Frontend Structure
```
frontend/
├── src/
│   ├── components/       # Reusable UI components
│   │   ├── Card.tsx      # Individual card
│   │   ├── List.tsx      # List container
│   │   └── ...
│   ├── pages/           # Route components
│   │   ├── Dashboard.tsx # Main dashboard
│   │   ├── Board.tsx    # Board view
│   │   └── ...
│   ├── contexts/        # React contexts
│   │   ├── AuthContext.tsx    # Authentication state
│   │   └── SocketContext.tsx  # WebSocket connection
│   └── lib/            # Utilities
       └── api.ts       # API client
```

## Performance Optimizations

### Frontend Performance Features
- **React Query**: Intelligent caching and synchronization
- **React.memo**: Component memoization for expensive renders
- **Lazy Loading**: Code splitting for better initial load
- **Skeleton Loading**: Better perceived performance
- **Debounced Search**: Optimized user input handling

### Backend Performance Features
- **Connection Pooling**: Efficient database connections
- **Query Optimization**: Efficient Prisma queries with proper includes
- **Rate Limiting**: Prevents API abuse
- **Caching Headers**: Browser and CDN caching
- **Compression**: Gzip response compression

## Testing Strategy

### Unit Testing
```bash
# Backend unit tests
cd backend
npm run test

# Frontend component tests  
cd frontend
npm run test
```

### Integration Testing
```bash
# API integration tests
cd backend
npm run test:integration

# E2E tests
cd frontend
npm run test:e2e
```

### Manual Testing Checklist
- [ ] User registration and login
- [ ] Board creation and management
- [ ] Card drag and drop
- [ ] Real-time updates
- [ ] Mobile responsiveness
- [ ] Performance on slow networks

## Debugging

### Backend Debugging
```bash
# Debug mode with detailed logs
NODE_ENV=development LOG_LEVEL=debug npm run dev

# Database query debugging
# Add to backend/.env:
DATABASE_URL="postgresql://user:pass@localhost:5432/db?schema=public&pgbouncer=true&connection_limit=5&pool_timeout=20"
```

### Frontend Debugging
- **React DevTools**: Component inspection
- **React Query DevTools**: Cache inspection
- **Network Tab**: API call monitoring
- **Performance Tab**: Rendering analysis

### Common Issues and Solutions

#### Database Connection Issues
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Reset database
npm run db:reset
```

#### Port Conflicts
```bash
# Kill processes on ports
npx kill-port 3000 3001

# Use different ports
PORT=3002 npm run dev:backend
```

#### TypeScript Errors
```bash
# Regenerate Prisma client
cd backend
npx prisma generate

# Clear TypeScript cache
npx tsc --build --clean
```

## Git Workflow

### Branch Strategy
```bash
# Feature development
git checkout -b feature/card-comments
git commit -m "feat: add card comments functionality"
git push origin feature/card-comments

# Bug fixes
git checkout -b fix/login-validation
git commit -m "fix: resolve login validation issue"
```

### Commit Convention
```bash
# Types: feat, fix, docs, style, refactor, test, chore
git commit -m "feat: add real-time board updates"
git commit -m "fix: resolve card drag and drop issue"
git commit -m "docs: update API documentation"
```

## Code Style Guidelines

### TypeScript Best Practices
- Use strict TypeScript configuration
- Define proper interfaces for all data structures
- Avoid `any` type usage
- Use proper error handling with try-catch

### React Best Practices
- Use functional components with hooks
- Implement proper error boundaries
- Optimize with React.memo when needed
- Use proper key props for lists

### Backend Best Practices
- Validate all input data
- Use proper HTTP status codes
- Implement comprehensive error handling
- Follow RESTful API design principles

## Performance Monitoring

### Metrics to Monitor
- **Response Times**: API endpoint performance
- **Bundle Size**: Frontend application size
- **Memory Usage**: Server and client memory
- **Database Queries**: Query performance and N+1 issues

### Tools
- **Lighthouse**: Frontend performance audit
- **React DevTools Profiler**: Component performance
- **Prisma Studio**: Database inspection
- **Winston Logs**: Server-side monitoring

## Deployment Preparation

### Pre-deployment Checklist
- [ ] All tests passing
- [ ] TypeScript compilation successful
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Performance optimizations verified
- [ ] Security headers configured
- [ ] Error handling tested
- [ ] Mobile responsiveness confirmed

### Production Build
```bash
# Build both projects
npm run build

# Test production builds locally
npm run start
```

---

**Happy Coding! 🚀**

*For questions or issues, check the main README.md or create an issue.*
