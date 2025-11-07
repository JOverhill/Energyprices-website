# 🚀 Setup Guide - Separate Frontend & Backend

## Architecture

```
Frontend (Vite + React)  →  Backend (Express + TypeScript)
Port 5173                    Port 3001
```

## Quick Start

### 1. **Install Backend Dependencies**

```powershell
cd backend
npm install
```

### 2. **Start Backend Server**

```powershell
cd backend
npm run dev
```

You should see:
```
🚀 Server running on http://localhost:3001
📊 CSV Export: http://localhost:3001/api/export
🔐 Auth: http://localhost:3001/api/auth
```

### 3. **Start Frontend (in a new terminal)**

```powershell
# From project root
npm run dev
```

Frontend runs on: `http://localhost:5173`

## Testing the Setup

### Test Backend Health
```powershell
curl http://localhost:3001/health
```

### Test CSV Export
The export button on your frontend should now work!

### Test Authentication (later)
```powershell
# Register
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

## Deployment

### Option 1: Render.com (FREE - Recommended)

**Backend:**
1. Push `backend/` folder to GitHub
2. Go to https://render.com → New → Web Service
3. Connect repository
4. **Settings:**
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm start`
   - Environment: Add variables from `.env`
5. Deploy!

**Frontend:**
1. Deploy to Vercel/Netlify/GitHub Pages
2. Set environment variable: `VITE_BACKEND_URL=https://your-backend.onrender.com`

### Option 2: Railway.app (FREE $5 credit/month)

Similar process to Render, even easier!

### Option 3: Run Backend on Your PC

1. **Install ngrok:** https://ngrok.com/
2. **Start backend:** `npm run dev`
3. **Expose to internet:**
   ```powershell
   ngrok http 3001
   ```
4. Use the ngrok URL as your `VITE_BACKEND_URL`

**Note:** Your PC must stay on and connected!

## Environment Variables

### Backend (`.env`)
```env
PORT=3001
NODE_ENV=development
JWT_SECRET=your-secret-key-change-this
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
```

### Frontend (`.env` in root)
```env
VITE_BACKEND_URL=http://localhost:3001
VITE_ENTSOE_SECURITY_TOKEN=your-token-here
```

## Next Steps

1. ✅ Backend is running separately
2. ✅ JWT auth endpoints ready
3. ✅ CSV export working
4. 🔄 Connect frontend to auth endpoints
5. 🔄 Add protected routes
6. 🔄 Deploy to Render/Railway

## Troubleshooting

**CORS errors?**
- Make sure `FRONTEND_URL` in backend `.env` matches your frontend URL
- Check browser console for specific error

**Backend won't start?**
- Make sure port 3001 is not in use
- Check `.env` file exists in `backend/` folder

**Frontend can't reach backend?**
- Verify backend is running on port 3001
- Check `vite.config.ts` proxy configuration
