/**
 * user.controller.js
 * User profile management.
 */

const User = require("../models/User");

/** GET /api/users/profile */
const getProfile = async (req, res) => {
  res.json({
    user: {
      id:        req.user._id,
      name:      req.user.name,
      email:     req.user.email,
      createdAt: req.user.createdAt,
    },
  });
};

/** PUT /api/users/profile */
const updateProfile = async (req, res, next) => {
  try {
    const { name } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { name },
      { new: true, runValidators: true }
    );
    res.json({ user: { id: user._id, name: user.name, email: user.email } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };
