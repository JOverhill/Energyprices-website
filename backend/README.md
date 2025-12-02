# Energy Prices Backend

Express.js backend with JWT authentication, CSV export, and SQLite database.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Configure environment:
   - Copy `.env.example` to `.env`
   - Set `JWT_SECRET` to a secure random string
   - Set `FRONTEND_URL` to your frontend URL (default: `http://localhost:5173`)

3. Initialize database:
   ```bash
   npx prisma migrate dev
   ```

4. Run from the root folder:
   ```bash
   npm run dev:all
   ```
   Or run backend only:
   ```bash
   npm run dev
   ```

## API Endpoints

**Authentication:**
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login (sets HttpOnly cookie)
- `GET /api/auth/verify` - Verify authentication
- `POST /api/auth/logout` - Logout

**CSV Export:**
- `POST /api/export` - Export data as CSV (authenticated)

**Health:**
- `GET /health` - Server status

## Database

Uses Prisma with SQLite. Database file: `prisma/dev.db`

View data:
```bash
npx prisma studio
```

## Production

Build and run:
```bash
npm run build
npm start
```

Make sure to set a strong `JWT_SECRET` and update `FRONTEND_URL` for your production domain.
