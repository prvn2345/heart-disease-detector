/**
 * errorHandler.js
 * Global Express error-handling middleware.
 */

const errorHandler = (err, _req, res, _next) => {
  console.error("[ERROR]", err.stack || err.message);

  // Mongoose validation error
  if (err.name === "ValidationError") {
    const messages = Object.values(err.errors).map((e) => e.message);
    return res.status(422).json({ error: messages.join(", ") });
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    return res.status(409).json({ error: `${field} already in use.` });
  }

  // JWT errors
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({ error: "Invalid token." });
  }

  const status  = err.statusCode || err.status || 500;
  const message = err.message    || "Internal server error.";
  res.status(status).json({ error: message });
};

module.exports = errorHandler;
