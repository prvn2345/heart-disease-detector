# Heart Disease Detector

A full-stack web application that predicts the likelihood of heart disease using Machine Learning, built with Python (Flask + scikit-learn) and the MERN stack (MongoDB, Express.js, React.js, Node.js).

## Project Structure

```
heart-disease-detector/
├── ml-server/          # Python Flask ML API
├── backend/            # Node.js + Express API
└── frontend/           # React + Tailwind CSS
```

## Prerequisites

- Python 3.8+
- Node.js 18+
- MongoDB (local or Atlas)
- npm or yarn

---

## 1. ML Server Setup (Python)

```bash
cd ml-server
pip install -r requirements.txt

# Train the model first
python train_model.py

# Start the Flask server
python app.py
# Runs on http://localhost:5001
```

---

## 2. Backend Setup (Node.js)

```bash
cd backend
npm install

# Create .env file
cp .env.example .env
# Edit .env with your MongoDB URI and JWT secret

npm run dev
# Runs on http://localhost:5000
```

---

## 3. Frontend Setup (React)

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
```
PORT=5000
MONGO_URI=mongodb://localhost:27017/heart-disease-detector
JWT_SECRET=your_super_secret_jwt_key_here
ML_API_URL=http://localhost:5001
```

### frontend/.env
```
VITE_API_URL=http://localhost:5000/api
```

---

## Running the Full Stack

Open 3 terminals:

```bash
# Terminal 1 - ML Server
cd ml-server && python app.py

# Terminal 2 - Backend
cd backend && npm run dev

# Terminal 3 - Frontend
cd frontend && npm run dev
```

Then open http://localhost:5173 in your browser.

---

## Features

- JWT-based user authentication (signup/login)
- Heart disease risk prediction using ML model
- Prediction history stored in MongoDB
- Risk visualization with charts
- Responsive UI with Tailwind CSS
- Input validation on frontend and backend
- Loading states and error handling
