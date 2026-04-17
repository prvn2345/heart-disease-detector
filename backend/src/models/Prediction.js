/**
 * Prediction.js
 * Mongoose schema for storing prediction history.
 */

const mongoose = require("mongoose");

const predictionSchema = new mongoose.Schema(
  {
    user: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    // Raw input features sent to the ML model
    inputData: {
      age:      { type: Number, required: true },
      sex:      { type: Number, required: true },
      cp:       { type: Number, required: true },
      trestbps: { type: Number, required: true },
      chol:     { type: Number, required: true },
      fbs:      { type: Number, required: true },
      restecg:  { type: Number, required: true },
      thalach:  { type: Number, required: true },
      exang:    { type: Number, required: true },
      oldpeak:  { type: Number, required: true },
      slope:    { type: Number, required: true },
      ca:       { type: Number, required: true },
      thal:     { type: Number, required: true },
    },
    // ML model output
    result: {
      prediction:  { type: Number, required: true },   // 0 or 1
      label:       { type: String, required: true },   // "Disease" | "No Disease"
      probability: { type: Number, required: true },   // 0.0 – 1.0
      risk_level:  { type: String, required: true },   // "Low" | "Moderate" | "High"
      confidence:  { type: Number, required: true },
    },
    // Optional patient notes
    notes: {
      type:      String,
      maxlength: 500,
      default:   "",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Prediction", predictionSchema);
