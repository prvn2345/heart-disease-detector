# Deployment Guide

Recommended free-tier stack:

| Service | Platform | URL pattern |
|---------|----------|-------------|
| ML Server (Python/Flask) | **Render** | `https://hdd-ml.onrender.com` |
| Backend (Node/Express) | **Render** | `https://hdd-api.onrender.com` |
| Frontend (React/Vite) | **Vercel** | `https://hdd.vercel.app` |
| Database (MongoDB) | **MongoDB Atlas** | connection string in env |

---

## Step 1 — MongoDB Atlas (Database)

1. Go to https://cloud.mongodb.com → create a free M0 cluster
2. **Database Access** → add a user with password
3. **Network Access** → Add IP `0.0.0.0/0` (allow all, for Render)
4. **Connect** → Drivers → copy the connection string:
   ```
   mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/heart-disease-detector
   ```

---

## Step 2 — ML Server on Render

1. Push your code to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your repo, set **Root Directory** to `ml-server`
4. Settings:
   - **Runtime**: Python 3
   - **Build Command**: `pip install -r requirements.txt && python train_model.py`
   - **Start Command**: `gunicorn wsgi:app --workers 2 --bind 0.0.0.0:$PORT --timeout 120`
5. Environment variables:
   ```
   FLASK_ENV=production
   ALLOWED_ORIGINS=https://hdd-api.onrender.com
   ```
6. Deploy → copy the service URL (e.g. `https://hdd-ml.onrender.com`)

> **Note:** The `train_model.py` in the build command downloads the UCI dataset
> and trains the model automatically on first deploy.

---

## Step 3 — Backend on Render

1. **New Web Service** → same repo, **Root Directory**: `backend`
2. Settings:
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `node src/server.js`
3. Environment variables:
   ```
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net/heart-disease-detector
   JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   JWT_EXPIRES_IN=7d
   ML_API_URL=https://hdd-ml.onrender.com
   FRONTEND_URL=https://hdd.vercel.app
   ```
4. Deploy → copy the service URL

---

## Step 4 — Frontend on Vercel

1. Go to https://vercel.com → **New Project** → import your repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Environment variables:
   ```
   VITE_API_URL=https://hdd-api.onrender.com/api
   ```
5. Deploy → your app is live!

---

## Step 5 — Update CORS after deploy

Once you have all three URLs, update the backend env var on Render:
```
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```
And the ML server:
```
ALLOWED_ORIGINS=https://your-actual-render-backend-url.onrender.com
```

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] ML server deployed and `/health` returns `{"status":"ok","model_loaded":true}`
- [ ] Backend deployed and `/api/health` returns `{"status":"ok"}`
- [ ] Frontend deployed and login page loads
- [ ] CORS env vars updated with real URLs
- [ ] JWT_SECRET is a long random string (not the placeholder)
- [ ] `.env` files are NOT committed to git

---

## Local Development (reminder)

```bash
# Terminal 1
cd ml-server && python app.py

# Terminal 2
cd backend && npm run dev

# Terminal 3
cd frontend && npm run dev
```
