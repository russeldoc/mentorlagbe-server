# MentorLagbe Server

Express + MongoDB REST API for the MentorLagbe tuition and mentorship platform. Handles authentication, tuition listings, student applications, Stripe payments, and role-based stats for students, tutors, and admins.

## Tech Stack

- **Runtime:** Node.js (ES modules)
- **Framework:** Express 4
- **Database:** MongoDB (native driver, connection pooling + index bootstrapping)
- **Auth:** JWT (custom session routes) + [Better Auth](https://www.better-auth.com/) at `/api/auth` (MongoDB adapter, email/password, admin plugin)
- **Payments:** Stripe Checkout (session create + webhook verification)
- **Security:** scrypt password hashing, role guards, CORS allowlist

## Project Structure

```
index.js                 # Entry point (starts server unless running on Vercel)
src/
  app.js                 # Express app: CORS, webhook, Better Auth, routes, error handlers
  config/
    db.js                # Mongo client, connectDB(), collections, ObjectId helper
    auth.js              # Better Auth configuration
    stripe.js            # Stripe client
  controllers/           # Route handlers (auth, user, tuition, application, payment, stats)
  middlewares/            # verifyToken, verifyRole, errorHandler
  routes/                # Routers mounted under /api/*
  scripts/seed.js        # Test data seeder
```

## Getting Started

### Prerequisites

- Node.js 18+
- A MongoDB database (local or Atlas)
- Stripe test keys (optional, for payments)

### Setup

```bash
npm install
cp .env.example .env   # then fill in real values
npm run seed           # optional: load test users/tuitions
npm run dev            # http://localhost:5000 (auto-restart)
# or
npm start
```

### Environment Variables

| Variable | Purpose |
|---|---|
| `PORT` | Server port (default 5000) |
| `NODE_ENV` | `development` / `production` |
| `CLIENT_URL` | Allowed frontend origin for CORS + Better Auth trusted origins |
| `MONGODB_URI` | MongoDB connection string (required) |
| `BETTER_AUTH_SECRET` | Better Auth signing secret |
| `BETTER_AUTH_URL` | Public base URL of this API |
| `JWT_SECRET` | Secret for session JWTs |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook signing secret |
| `PRO_TUTOR_PRICE_USD` | Tutor Pro plan price (default 15) |
| `PRO_STUDENT_PRICE_USD` | Student Pro plan price (default 10) |

## API Reference

Base URL: `/api`. Protected routes expect `Authorization: Bearer <token>`.

### Health

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | — | Health check |

### Authentication

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth-session/register` | — | Register (`name`, `email`, `password`, `role`) → `{ token, user }` |
| POST | `/api/auth-session/login` | — | Login (`email`, `password`) → `{ token, user }` |
| GET | `/api/auth-session/me` | JWT | Current user |

Better Auth endpoints (sign-in, sign-up, session, etc.) are served at `/api/auth/*`.

### Users

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| PATCH | `/api/users/profile` | JWT | Update own profile |
| GET | `/api/users` | Admin | List all users |
| PATCH | `/api/users/:id/role` | Admin | Change a user's role |

### Tuitions

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/tuitions` | — | Public tuition list (filters: subject, search, etc.) |
| GET | `/api/tuitions/:id` | — | Tuition details |
| GET | `/api/tuitions/tutor/my` | Tutor | Own tuitions |
| POST | `/api/tuitions` | Tutor | Create tuition |
| PATCH | `/api/tuitions/:id` | Tutor | Update own tuition |
| DELETE | `/api/tuitions/:id` | Tutor | Delete own tuition |
| GET | `/api/tuitions/admin/all` | Admin | All tuitions |
| PATCH | `/api/tuitions/:id/moderate` | Admin | Approve/reject tuition |

### Applications & Bookmarks

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/applications` | Student | Apply to a tuition |
| GET | `/api/applications/student/my` | Student | Own applications |
| DELETE | `/api/applications/:id` | Student | Cancel pending application |
| POST | `/api/applications/bookmarks/toggle` | Student | Toggle bookmark |
| GET | `/api/applications/bookmarks/my` | Student | Bookmarked tuitions |
| GET | `/api/applications/tutor/applicants` | Tutor | Applicants to own tuitions |
| PATCH | `/api/applications/:id/status` | Tutor | Accept/reject applicant |

### Payments (Stripe)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/payments/create-checkout-session` | JWT | Create Stripe Checkout session |
| POST | `/api/payments/verify-session` | JWT | Verify session after checkout |
| POST | `/api/payments/webhook` | Stripe sig | Stripe webhook (raw body) |
| GET | `/api/payments/admin/all` | Admin | All payments |

### Stats

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| GET | `/api/stats/student` | Student | Student dashboard stats |
| GET | `/api/stats/tutor` | Tutor | Tutor dashboard stats |
| GET | `/api/stats/admin` | Admin | Admin dashboard stats |

## Roles

- **student** — apply to tuitions, bookmark, own stats
- **tutor** — create/manage tuitions, review applicants
- **admin** — moderate tuitions, manage users/roles, view all payments

Role guards live in `src/middlewares/verifyRole.js`; JWT verification in `src/middlewares/verifyToken.js`.

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start with `node --watch` |
| `npm start` | Start server |
| `npm run seed` | Seed test tutors, students, and tuitions |

## Deployment (Vercel):
https://mentorlagbe-server-one.vercel.app

- `index.js` exports the Express app as the default and skips `app.listen()` when `process.env.VERCEL` is set.
- The Stripe webhook route is mounted with `express.raw()` **before** `express.json()` so signature verification works.
- Set all environment variables above in your deployment dashboard.
- CORS allows `CLIENT_URL`, the production client domain, and `https://mentorlagbe-client*.vercel.app` previews.
