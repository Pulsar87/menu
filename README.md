# Digital Menu App - First Milestone Setup

## Prerequisites
- Docker & Docker Compose installed
- Node.js 22+ (for local development)

## Quick Start

### 1. Environment Setup
```bash
# Copy environment variables
cp .env.example .env
```

### 2. Start Docker Containers
```bash
# Start all services (PostgreSQL, Redis, and App)
docker compose up -d --build
```

### 3. Database Migration & Seed
```bash
# Run migrations inside the app container
docker compose exec app npm run db:generate
docker compose exec app npm run db:migrate:deploy
docker compose exec app npm run db:seed
```

### 4. Access the Application
- **Customer PWA**: http://localhost:3000/m/sample-restaurant/t/{table-token}
- **Staff Dashboard**: http://localhost:3000/staff
- **Default Owner Account**: owner@sample-restaurant.com

## Available Commands

```bash
# Development
docker compose up -d              # Start all services
docker compose down               # Stop all services
docker compose logs -f app        # View app logs
docker compose logs -f postgres   # View database logs
docker compose logs -f redis      # View Redis logs

# Database
docker compose exec app npm run db:generate      # Generate Prisma client
docker compose exec app npm run db:migrate       # Run migrations (dev)
docker compose exec app npm run db:migrate:deploy # Run migrations (production)
docker compose exec app npm run db:seed          # Seed database
docker compose exec app npm run db:studio        # Open Prisma Studio

# Testing
docker compose exec app npm test          # Run unit tests
docker compose exec app npm run test:e2e  # Run E2E tests

# Production Build
docker compose build                      # Rebuild containers
docker compose up -d                      # Restart with new build
```

## Database Schema

The application includes the following core entities:
- **Restaurant**: Restaurant profile and settings
- **User**: Staff/owner accounts with role-based access
- **Category**: Menu categories
- **MenuItem**: Menu items with variants and modifiers
- **Table**: Restaurant tables with QR tokens
- **Order**: Customer orders with status tracking
- **OrderItem**: Individual items in an order
- **Review**: Customer reviews and ratings
- **LoyaltyCard**: Customer loyalty program
- **Notification**: System notifications

## First Milestone Features

✅ Completed:
- Project scaffolding with Docker Compose
- Database schema with all core entities
- Sample restaurant, menu items, and tables seeded
- Customer menu browsing (read-only)
- Table QR token system

🚧 Next Steps:
- Menu CRUD operations (staff dashboard)
- Shopping cart functionality
- Order creation and KDS board
- Real-time order status updates via WebSocket

## Troubleshooting

### Database Connection Issues
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View database logs
docker compose logs postgres

# Reset database (WARNING: deletes all data)
docker compose down -v
docker compose up -d postgres
docker compose exec app npm run db:migrate:deploy
docker compose exec app npm run db:seed
```

### App Container Issues
```bash
# Rebuild and restart app
docker compose build app
docker compose up -d app

# View app logs
docker compose logs -f app

# Execute commands inside app container
docker compose exec app bash
```

## Architecture

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Next.js   │────▶│  PostgreSQL  │     │    Redis    │
│    App      │◀────│   (Prisma)   │     │  (Sessions) │
└─────────────┘     └──────────────┘     └─────────────┘
       │
       ▼
┌─────────────┐
│  BullMQ     │
│  Workers    │
└─────────────┘
```

## Environment Variables

See `.env.example` for all required environment variables:
- `DATABASE_URL`: PostgreSQL connection string
- `REDIS_URL`: Redis connection string
- `NEXTAUTH_SECRET`: NextAuth secret key
- `NEXTAUTH_URL`: Application URL
- `STRIPE_SECRET_KEY`: Stripe API key (optional for milestone 1)
