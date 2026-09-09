# Heart Disease Detector

A full-stack web application that predicts the likelihood of heart disease using Machine Learning, built with Python (scikit-learn) and the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Architecture

This project uses a **single-server architecture**:
- The **Node.js Express** backend handles authentication, history persistence in MongoDB, and API routing.
- When an inference request is made, Node.js invokes a standalone Python script (`backend/ml/predict.py`) via `child_process.spawn`.
- Patient feature data is streamed via `stdin` in JSON format, and Python streams the prediction result back via `stdout` in JSON format.
- A pure JavaScript heuristic fallback is included to guarantee 100% uptime even if Python is temporarily unreachable.
- No separate Flask / Python web server process is required!

## Project Structure

```
heart-disease-detector/
├── backend/            # Unified Node.js API + embedded ML inference engine
│   ├── ml/             # Python ML prediction script and trained joblib models
│   │   ├── predict.py
│   │   ├── requirements.txt
│   │   └── models/
│   │       ├── heart_disease_model.joblib
│   │       └── feature_names.joblib
│   └── src/            # Express controllers, routes, models, middleware
├── frontend/           # React + Tailwind CSS client
└── ml-server/          # (Optional) Legacy standalone Flask server & training scripts
```

## Prerequisites

- Python 3.8+ (with `scikit-learn`, `joblib`, `numpy`, `pandas`)
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

## 1. Backend Setup (Node.js + Python ML)

```bash
cd backend
npm install
pip install -r ml/requirements.txt

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm run dev
# Runs on http://localhost:5000
```

---

## 2. Frontend Setup (React)

```bash
cd frontend
npm install

# Create .env file
cp .env.example .env

npm run dev
# Runs on http://localhost:5173
```

---

## Environment Variables

### backend/.env
```env
PORT=5000
MONGO_URI=mongodb+srv://<user>:<password>@cluster0.xxxxx.mongodb.net/heart-disease-detector
JWT_SECRET=your_super_secret_jwt_key_here
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:5173
# Optional override if Python binary is not in default PATH:
# PYTHON_PATH=python3
```

### frontend/.env
```env
VITE_API_URL=http://localhost:5000/api
```

---

## Running Locally

Only 2 terminals needed:

```bash
# Terminal 1 - Backend API (with embedded Python ML)
cd backend && npm run dev

# Terminal 2 - Frontend UI
cd frontend && npm run dev
```
