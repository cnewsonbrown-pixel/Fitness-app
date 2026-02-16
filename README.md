# FitStudio - Gym Management Platform

A multi-tenant SaaS platform for boutique fitness studios (Hyrox, yoga, Pilates, cycling, etc.).

## Features

### Base Tier
- Member management and profiles
- Membership types (recurring, class packs, drop-in)
- Class scheduling with waitlist support
- Automated billing via Stripe
- Email and SMS marketing campaigns
- Branded member app

### Mid Tier
- Multi-location support
- Shared packages across locations
- Advanced CRM with journey mapping
- Pre-built campaign templates
- Content feed (articles, recipes)

### Premium Tier
- Custom analytics dashboards
- Gamification (points, badges, challenges)
- Video content with paywalls
- White-label app
- Enterprise API access

## Tech Stack

- **Backend**: Node.js, Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Auth**: JWT + OAuth (Google, Apple)
- **Payments**: Stripe
- **Email**: SendGrid
- **SMS**: Twilio

## Prerequisites

- Node.js 18+
- PostgreSQL 15+
- npm or yarn

## Getting Started

### 1. Clone and Install

```bash
cd server
npm install
```

### 2. Environment Setup

```bash
cp .env.example .env
# Edit .env with your configuration
```

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret for signing JWT tokens
- `JWT_REFRESH_SECRET` - Secret for refresh tokens

Optional (for full functionality):
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` - Google OAuth
- `STRIPE_SECRET_KEY` - Payment processing
- `SENDGRID_API_KEY` - Email sending
- `TWILIO_*` - SMS sending

### 3. Database Setup

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Or push schema directly (development)
npm run db:push
```

### 4. Start Development Server

```bash
npm run dev
```

Server runs at http://localhost:3000

## API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/auth/register` | Register new user |
| POST | `/api/v1/auth/login` | Login with email/password |
| POST | `/api/v1/auth/refresh` | Refresh access token |
| POST | `/api/v1/auth/logout` | Logout (revoke refresh token) |
| POST | `/api/v1/auth/logout-all` | Logout all devices |
| GET | `/api/v1/auth/me` | Get current user profile |
| GET | `/api/v1/auth/google` | Initiate Google OAuth |

### Tenants (Studios)

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/v1/tenants` | Create new studio |
| GET | `/api/v1/tenants/check-slug/:slug` | Check slug availability |
| GET | `/api/v1/tenants/current` | Get current studio |
| PATCH | `/api/v1/tenants/current` | Update studio settings |
| GET | `/api/v1/tenants/current/stats` | Get studio statistics |
| GET | `/api/v1/tenants/:slug` | Get studio public info |

### Members

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/members` | List members (staff only) |
| GET | `/api/v1/members/:id` | Get member details |
| PUT | `/api/v1/members/:id` | Update member profile |
| DELETE | `/api/v1/members/:id` | Deactivate member (staff only) |
| GET | `/api/v1/members/:id/memberships` | Get member's memberships |
| GET | `/api/v1/members/:id/stats` | Get member statistics |
| POST | `/api/v1/members/:id/tags` | Add tags to member (staff only) |
| DELETE | `/api/v1/members/:id/tags/:tag` | Remove tag (staff only) |
| PATCH | `/api/v1/members/:id/lifecycle-stage` | Update lifecycle stage (staff only) |

### Membership Types

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/membership-types` | List membership types |
| GET | `/api/v1/membership-types/:id` | Get membership type details |
| POST | `/api/v1/membership-types` | Create membership type (staff only) |
| PUT | `/api/v1/membership-types/:id` | Update membership type (staff only) |
| DELETE | `/api/v1/membership-types/:id` | Deactivate membership type (staff only) |
| GET | `/api/v1/membership-types/:id/stats` | Get membership type stats (staff only) |

### Member Memberships

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/memberships` | Get my memberships |
| GET | `/api/v1/memberships/check-booking` | Check if can book a class |
| POST | `/api/v1/memberships` | Purchase/assign membership |
| GET | `/api/v1/memberships/:id` | Get membership details |
| POST | `/api/v1/memberships/:id/pause` | Pause membership |
| POST | `/api/v1/memberships/:id/resume` | Resume membership |
| POST | `/api/v1/memberships/:id/cancel` | Cancel membership |

### Health Check

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/v1/health` | Health check |

## Project Structure

```
server/
├── prisma/
│   └── schema.prisma      # Database schema
├── src/
│   ├── config/            # Configuration
│   │   ├── index.ts       # Environment config
│   │   ├── database.ts    # Prisma client
│   │   └── passport.ts    # OAuth strategies
│   ├── controllers/       # Request handlers
│   ├── middleware/        # Express middleware
│   ├── models/            # Data models (if needed)
│   ├── routes/            # Route definitions
│   ├── services/          # Business logic
│   ├── types/             # TypeScript types
│   ├── utils/             # Utilities
│   └── index.ts           # App entry point
└── package.json
```

## Authentication Flow

### Email/Password

1. Register: `POST /auth/register` → Returns user + tokens
2. Login: `POST /auth/login` → Returns user + tokens
3. Use access token in `Authorization: Bearer <token>` header
4. Refresh when expired: `POST /auth/refresh`

### Google OAuth

1. Redirect to: `GET /auth/google`
2. User authenticates with Google
3. Callback redirects to frontend with tokens

## Multi-Tenancy

- All data is scoped by `tenantId`
- Users belong to a single tenant (studio)
- Staff can have different roles: OWNER, ADMIN, MANAGER, INSTRUCTOR, FRONT_DESK
- Row-level security ensures data isolation

## Testing

### Unit Tests (Vitest)

```bash
cd server
npm test
```

### API Integration Tests (Shell Script)

```bash
# Start the server first
npm run dev

# In another terminal, run the test script
chmod +x tests/api.test.sh
./tests/api.test.sh
```

The test script requires `curl` and `jq` to be installed.

### Manual Testing with cURL

```bash
# Health check
curl http://localhost:3000/api/v1/health

# Register
curl -X POST http://localhost:3000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123","firstName":"Test","lastName":"User"}'

# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123"}'

# Get current user (replace TOKEN with actual token)
curl http://localhost:3000/api/v1/auth/me \
  -H "Authorization: Bearer TOKEN"

# Create studio (replace TOKEN)
curl -X POST http://localhost:3000/api/v1/tenants \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer TOKEN" \
  -d '{"name":"My Fitness Studio","slug":"my-studio"}'
```

## License

Proprietary - All rights reserved
