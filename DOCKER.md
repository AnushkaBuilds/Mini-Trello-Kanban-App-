# Docker Scripts for Trello App

## Production Deployment

### Build and start all services
```bash
docker-compose up -d --build
```

### Stop all services
```bash
docker-compose down
```

### View logs
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f backend
docker-compose logs -f frontend
```

## Development

### Start development environment
```bash
docker-compose -f docker-compose.yml -f docker-compose.dev.yml up -d --build
```

### Access services
- Frontend: http://localhost:3000
- Backend API: http://localhost:3001
- PgAdmin: http://localhost:5050 (admin@admin.com / admin)
- PostgreSQL: localhost:5432
- Redis: localhost:6379

## Database Management

### Run migrations
```bash
docker-compose exec backend npx prisma migrate deploy
```

### Seed database
```bash
docker-compose exec backend npx prisma db seed
```

### Reset database
```bash
docker-compose exec backend npx prisma migrate reset
```

### Access database directly
```bash
docker-compose exec db psql -U postgres -d mini_trello
```

## Troubleshooting

### Rebuild specific service
```bash
docker-compose build --no-cache backend
docker-compose up -d backend
```

### Check service health
```bash
docker-compose ps
```

### Clean up
```bash
# Remove containers and networks
docker-compose down

# Remove containers, networks, and volumes
docker-compose down -v

# Remove everything including images
docker-compose down -v --rmi all
```

## Environment Variables

Create a `.env` file in the root directory:

```env
JWT_SECRET=your-very-secure-jwt-secret-at-least-32-characters-long
POSTGRES_PASSWORD=your-secure-postgres-password
```
