/**
 * prediction.controller.js
 * Handles forwarding patient data to the Python ML API
 * and persisting results in MongoDB.
 */

const axios      = require("axios");
const Prediction = require("../models/Prediction");

const ML_API_URL = process.env.ML_API_URL || "http://localhost:5001";

/** POST /api/predictions  – create a new prediction */
const createPrediction = async (req, res, next) => {
  try {
    const {
      age, sex, cp, trestbps, chol, fbs,
      restecg, thalach, exang, oldpeak, slope, ca, thal,
      notes,
    } = req.body;

    const inputData = {
      age:      Number(age),
      sex:      Number(sex),
      cp:       Number(cp),
      trestbps: Number(trestbps),
      chol:     Number(chol),
      fbs:      Number(fbs),
      restecg:  Number(restecg),
      thalach:  Number(thalach),
      exang:    Number(exang),
      oldpeak:  Number(oldpeak),
      slope:    Number(slope),
      ca:       Number(ca),
      thal:     Number(thal),
    };

    // ── Call Python ML API ────────────────────────────────────────────────────
    let mlResult;
    try {
      const response = await axios.post(`${ML_API_URL}/predict`, inputData, {
        timeout: 10_000,
      });
      mlResult = response.data;
    } catch (mlErr) {
      const status  = mlErr.response?.status  || 503;
      const message = mlErr.response?.data?.error || "ML service unavailable.";
      return res.status(status).json({ error: message });
    }

    // ── Persist to MongoDB ────────────────────────────────────────────────────
    const prediction = await Prediction.create({
      user:      req.user._id,
      inputData,
      result:    mlResult,
      notes:     notes || "",
    });

    res.status(201).json({ prediction });
  } catch (err) {
    next(err);
  }
};

/** GET /api/predictions  – list current user's predictions */
const getPredictions = async (req, res, next) => {
  try {
    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(50, parseInt(req.query.limit) || 10);
    const skip  = (page - 1) * limit;

    const [predictions, total] = await Promise.all([
      Prediction.find({ user: req.user._id })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Prediction.countDocuments({ user: req.user._id }),
    ]);

    res.json({
      predictions,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

/** GET /api/predictions/:id  – get a single prediction */
const getPredictionById = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOne({
      _id:  req.params.id,
      user: req.user._id,
    }).lean();

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found." });
    }

    res.json({ prediction });
  } catch (err) {
    next(err);
  }
};

/** DELETE /api/predictions/:id  – delete a prediction */
const deletePrediction = async (req, res, next) => {
  try {
    const prediction = await Prediction.findOneAndDelete({
      _id:  req.params.id,
      user: req.user._id,
    });

    if (!prediction) {
      return res.status(404).json({ error: "Prediction not found." });
    }

    res.json({ message: "Prediction deleted." });
  } catch (err) {
    next(err);
  }
};

/** GET /api/predictions/stats  – aggregate stats for the current user */
const getStats = async (req, res, next) => {
  try {
    const stats = await Prediction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id:             null,
          total:           { $sum: 1 },
          diseaseCount:    { $sum: "$result.prediction" },
          avgProbability:  { $avg: "$result.probability" },
          highRiskCount:   { $sum: { $cond: [{ $eq: ["$result.risk_level", "High"] },     1, 0] } },
          moderateCount:   { $sum: { $cond: [{ $eq: ["$result.risk_level", "Moderate"] }, 1, 0] } },
          lowRiskCount:    { $sum: { $cond: [{ $eq: ["$result.risk_level", "Low"] },      1, 0] } },
        },
      },
    ]);

    const result = stats[0] || {
      total: 0, diseaseCount: 0, avgProbability: 0,
      highRiskCount: 0, moderateCount: 0, lowRiskCount: 0,
    };

    res.json({ stats: result });
  } catch (err) {
    next(err);
  }
};

module.exports = {
  createPrediction,
  getPredictions,
  getPredictionById,
  deletePrediction,
  getStats,
};
