/**
 * prediction.routes.js
 */

const { Router } = require("express");
const { body }   = require("express-validator");
const {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
  getStats,
} = require("../controllers/prediction.controller");
const { protect } = require("../middleware/auth");
const validate    = require("../middleware/validate");

const router = Router();

// All prediction routes require authentication
router.use(protect);

// Validation rules for prediction input
const predictionValidation = [
  body("age").isFloat({ min: 1, max: 120 }).withMessage("Age must be between 1 and 120."),
  body("sex").isInt({ min: 0, max: 1 }).withMessage("Sex must be 0 or 1."),
  body("cp").isInt({ min: 0, max: 3 }).withMessage("Chest pain type must be 0-3."),
  body("trestbps").isFloat({ min: 50, max: 250 }).withMessage("Blood pressure must be 50-250."),
  body("chol").isFloat({ min: 100, max: 600 }).withMessage("Cholesterol must be 100-600."),
  body("fbs").isInt({ min: 0, max: 1 }).withMessage("Fasting blood sugar must be 0 or 1."),
  body("restecg").isInt({ min: 0, max: 2 }).withMessage("Resting ECG must be 0-2."),
  body("thalach").isFloat({ min: 50, max: 250 }).withMessage("Max heart rate must be 50-250."),
  body("exang").isInt({ min: 0, max: 1 }).withMessage("Exercise angina must be 0 or 1."),
  body("oldpeak").isFloat({ min: 0, max: 10 }).withMessage("Oldpeak must be 0-10."),
  body("slope").isInt({ min: 0, max: 2 }).withMessage("Slope must be 0-2."),
  body("ca").isInt({ min: 0, max: 4 }).withMessage("CA must be 0-4."),
  body("thal").isInt({ min: 1, max: 3 }).withMessage("Thal must be 1-3."),
];

router.get("/stats",  getStats);
router.get("/",       getPredictions);
router.get("/:id",    getPredictionById);
router.post("/",      predictionValidation, validate, createPrediction);
router.delete("/:id", deletePrediction);

module.exports = router;
