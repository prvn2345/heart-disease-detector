/**
 * user.routes.js
 */

const { Router } = require("express");
const { body }   = require("express-validator");
const { getProfile, updateProfile } = require("../controllers/user.controller");
const { protect }  = require("../middleware/auth");
const validate     = require("../middleware/validate");

const router = Router();

router.use(protect);

router.get("/profile", getProfile);
router.put(
  "/profile",
  [body("name").trim().notEmpty().withMessage("Name is required.")],
  validate,
  updateProfile
);

module.exports = router;
