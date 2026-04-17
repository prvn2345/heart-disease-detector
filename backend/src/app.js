/**
 * app.js
 * Express application setup – middleware, routes, error handling.
 */

const express      = require("express");
const cors         = require("cors");
const morgan       = require("morgan");
const rateLimit    = require("express-rate-limit");

const authRoutes       = require("./routes/auth.routes");
const predictionRoutes = require("./routes/prediction.routes");
const userRoutes       = require("./routes/user.routes");
const errorHandler     = require("./middleware/errorHandler");

const app = express();

// ── Middleware ────────────────────────────────────────────────────────────────

app.use(cors({
  origin: (origin, callback) => {
    const allowed = (process.env.FRONTEND_URL || "http://localhost:5173")
      .split(",")
      .map((u) => u.trim());
    // Allow requests with no origin (server-to-server, curl, Postman)
    if (!origin || allowed.includes(origin)) return callback(null, true);
    callback(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

// Global rate limiter – 100 requests per 15 minutes per IP
app.use(rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." },
}));

// ── Routes ────────────────────────────────────────────────────────────────────

app.use("/api/auth",        authRoutes);
app.use("/api/predictions", predictionRoutes);
app.use("/api/users",       userRoutes);

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 404 handler
app.use((_req, res) => {
  res.status(404).json({ error: "Route not found." });
});

// Global error handler
app.use(errorHandler);

module.exports = app;
