# Deployment Guide

Recommended free-tier stack:

| Service | Platform | URL pattern |
|---|---|---|
| Unified Backend (Node.js + Python ML) | **Render** | `https://hdd-api.onrender.com` |
| Frontend (React/Vite) | **Vercel** | `https://hdd.vercel.app` |
| Database (MongoDB) | **MongoDB Atlas** | connection string in env |

> [!NOTE]
> This application uses a **single-server architecture**. Node.js executes Python ML inference locally via child process streams (`stdin`/`stdout`), meaning you only need **one** backend Web Service on Render instead of managing two separate services!

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

## Step 2 — Unified Backend on Render

1. Push your code to GitHub
2. Go to https://render.com → **New Web Service**
3. Connect your repository, set **Root Directory** to `backend`
4. Settings:
   - **Runtime**: Node
   - **Build Command**: `pip install -r ml/requirements.txt && npm install`
   - **Start Command**: `node src/server.js`
5. Environment variables:
   ```env
   NODE_ENV=production
   PORT=5000
   MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/heart-disease-detector
   JWT_SECRET=<generate: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
   JWT_EXPIRES_IN=7d
   FRONTEND_URL=https://hdd.vercel.app
   ```
6. Deploy → copy the service URL (e.g. `https://hdd-api.onrender.com`)

---

## Step 3 — Frontend on Vercel

1. Go to https://vercel.com → **New Project** → import your repo
2. Set **Root Directory** to `frontend`
3. Framework preset: **Vite**
4. Environment variables:
   ```env
   VITE_API_URL=https://hdd-api.onrender.com/api
   ```
5. Deploy → your app is live!

---

## Step 4 — Update Frontend URL in Render

Once you have your real Vercel URL, update `FRONTEND_URL` in your Render backend environment variables:
```env
FRONTEND_URL=https://your-actual-vercel-url.vercel.app
```

---

## Quick Checklist

- [ ] MongoDB Atlas cluster created and connection string copied
- [ ] Backend deployed and `/api/health` returns `{"status":"ok"}`
- [ ] Frontend deployed and login page loads
- [ ] CORS `FRONTEND_URL` env var updated with real Vercel URL
- [ ] `JWT_SECRET` is a long random string
- [ ] Local `.env` files are NOT committed to git
