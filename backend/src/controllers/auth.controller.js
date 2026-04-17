/**
 * auth.controller.js
 * Handles user registration and login.
 */

const jwt  = require("jsonwebtoken");
const User = require("../models/User");

/** Generate a signed JWT for a user id */
const signToken = (id) =>
  jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || "7d",
  });

/** POST /api/auth/signup */
const signup = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(409).json({ error: "Email already registered." });
    }

    const user  = await User.create({ name, email, password });
    const token = signToken(user._id);

    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

/** POST /api/auth/login */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Explicitly select password (it's excluded by default)
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user._id);

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/auth/me  (protected) */
const getMe = async (req, res) => {
  res.json({
    user: { id: req.user._id, name: req.user.name, email: req.user.email },
  });
};

module.exports = { signup, login, getMe };
