# 🚀 Quick Start Guide - Mini Trello

## One-Command Setup

```bash
# Clone repository
git clone <your-repo-url>
cd "Trello App"

# Install dependencies and setup
npm run install:all
npm run setup:env
npm run setup:db

# Start application
npm run dev
```

## What This Does

1. **Installs all dependencies** for both backend and frontend
2. **Creates environment file** from template
3. **Sets up database** with Prisma migrations
4. **Starts both servers** simultaneously

## Access Your App

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:3001  
- **API Docs**: http://localhost:3001/api/v1/docs

## Next Steps

1. Update `backend/.env` with your database credentials
2. Ensure PostgreSQL is running
3. Visit the application and start using it!

## Troubleshooting

### Database Issues
```bash
# Reset database
npm run db:reset

# Just run migrations
npm run db:migrate
```

### Port Issues
```bash
# Kill processes on ports
npx kill-port 3000 3001
```

### Clean Install
```bash
# Clean and reinstall
npm run clean
npm run install:all
```

## Development Commands

```bash
# Development
npm run dev              # Start both servers
npm run dev:backend      # Start only backend  
npm run dev:frontend     # Start only frontend

# Building
npm run build            # Build both projects
npm run type-check       # Check TypeScript

# Database
npm run db:reset         # Reset database
npm run seed             # Seed data

# Health Check
npm run health           # Check if servers are running
```

That's it! You're ready to develop with Mini Trello! 🎉
