/**
 * auth.routes.js
 */

const { Router }                  = require("express");
const { body }                    = require("express-validator");
const { signup, login, getMe }    = require("../controllers/auth.controller");
const { protect }                 = require("../middleware/auth");
const validate                    = require("../middleware/validate");

const router = Router();

router.post(
  "/signup",
  [
    body("name").trim().notEmpty().withMessage("Name is required."),
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters."),
  ],
  validate,
  signup
);

router.post(
  "/login",
  [
    body("email").isEmail().withMessage("Valid email is required.").normalizeEmail(),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validate,
  login
);

router.get("/me", protect, getMe);

module.exports = router;
