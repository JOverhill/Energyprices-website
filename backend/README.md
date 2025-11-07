# Energy Prices Backend

Express.js backend for the Energy Prices application with JWT authentication and CSV export.

## Features

- 🔐 JWT Authentication (register, login, verify)
- 📊 CSV Export endpoint
- 🚀 TypeScript
- 🔒 CORS enabled
- 🌍 Environment-based configuration

## Setup

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment variables:**
   - Copy `.env.example` to `.env`
   - Update `JWT_SECRET` with a secure random string
   - Set `FRONTEND_URL` to your frontend URL

3. **Development:**
   ```bash
   npm run dev
   ```

4. **Production:**
   ```bash
   npm run build
   npm start
   ```

## API Endpoints

### Health Check
- `GET /health` - Check if server is running

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify JWT token

### CSV Export
- `POST /api/export` - Export data as CSV

## Deployment

### Render.com (Recommended - Free)

1. Push code to GitHub
2. Go to [render.com](https://render.com)
3. Create new Web Service
4. Connect your repository
5. Set build command: `npm install && npm run build`
6. Set start command: `npm start`
7. Add environment variables from `.env`

### Railway.app

1. Push code to GitHub
2. Go to [railway.app](https://railway.app)
3. New Project → Deploy from GitHub
4. Add environment variables
5. Deploy!

## Environment Variables

```env
PORT=3001
NODE_ENV=production
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=7d
FRONTEND_URL=https://your-frontend-url.com
```

## Notes

- Currently uses in-memory storage for users (will be lost on restart)
- For production, connect to a database (PostgreSQL, MongoDB, etc.)
- Make sure to use a strong JWT_SECRET in production
