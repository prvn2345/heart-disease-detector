/**
 * server.js
 * Entry point for the Express application.
 */

require("dotenv").config();
const app        = require("./app");
const connectDB  = require("./config/db");

const PORT = process.env.PORT || 5000;

// Connect to MongoDB then start the server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
  });
});
