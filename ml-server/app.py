"""
app.py
------
Flask REST API for the Heart Disease prediction model.

Endpoints:
  GET  /health   – liveness check
  POST /predict  – returns prediction + probability
"""

import os
import logging
import numpy as np
import joblib
from flask import Flask, request, jsonify
from flask_cors import CORS

# ── Logging ───────────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s"
)
logger = logging.getLogger(__name__)

# ── App setup ─────────────────────────────────────────────────────────────────
app = Flask(__name__)

# Allow requests from the Node.js backend (set ALLOWED_ORIGINS in env for production)
_raw_origins = os.environ.get("ALLOWED_ORIGINS", "*")
_origins = [o.strip() for o in _raw_origins.split(",")] if _raw_origins != "*" else "*"
CORS(app, origins=_origins)

# ── Load model ────────────────────────────────────────────────────────────────
BASE_DIR    = os.path.dirname(__file__)
MODEL_PATH  = os.path.join(BASE_DIR, "models", "heart_disease_model.joblib")
FEAT_PATH   = os.path.join(BASE_DIR, "models", "feature_names.joblib")

model         = None
feature_names = None

def load_model():
    """Load the trained model and feature names from disk."""
    global model, feature_names
    if not os.path.exists(MODEL_PATH):
        logger.error(
            "Model file not found at %s. "
            "Run `python train_model.py` first.", MODEL_PATH
        )
        return False
    model         = joblib.load(MODEL_PATH)
    feature_names = joblib.load(FEAT_PATH)
    logger.info("Model loaded successfully. Features: %s", feature_names)
    return True


# ── Feature metadata (for validation & UI hints) ──────────────────────────────
FEATURE_META = {
    "age":      {"type": "int",   "min": 1,   "max": 120, "desc": "Age in years"},
    "sex":      {"type": "int",   "min": 0,   "max": 1,   "desc": "Sex (0=Female, 1=Male)"},
    "cp":       {"type": "int",   "min": 0,   "max": 3,   "desc": "Chest pain type (0-3)"},
    "trestbps": {"type": "float", "min": 50,  "max": 250, "desc": "Resting blood pressure (mm Hg)"},
    "chol":     {"type": "float", "min": 100, "max": 600, "desc": "Serum cholesterol (mg/dl)"},
    "fbs":      {"type": "int",   "min": 0,   "max": 1,   "desc": "Fasting blood sugar > 120 mg/dl (1=True)"},
    "restecg":  {"type": "int",   "min": 0,   "max": 2,   "desc": "Resting ECG results (0-2)"},
    "thalach":  {"type": "float", "min": 50,  "max": 250, "desc": "Maximum heart rate achieved"},
    "exang":    {"type": "int",   "min": 0,   "max": 1,   "desc": "Exercise induced angina (1=Yes)"},
    "oldpeak":  {"type": "float", "min": 0,   "max": 10,  "desc": "ST depression induced by exercise"},
    "slope":    {"type": "int",   "min": 0,   "max": 2,   "desc": "Slope of peak exercise ST segment (0-2)"},
    "ca":       {"type": "int",   "min": 0,   "max": 4,   "desc": "Number of major vessels (0-4)"},
    "thal":     {"type": "int",   "min": 1,   "max": 3,   "desc": "Thalassemia (1=Normal, 2=Fixed defect, 3=Reversible defect)"},
}


def validate_input(data: dict) -> tuple[dict | None, str | None]:
    """
    Validate and coerce input data.
    Returns (cleaned_dict, None) on success or (None, error_message) on failure.
    """
    cleaned = {}
    for feat, meta in FEATURE_META.items():
        if feat not in data:
            return None, f"Missing required field: '{feat}'"
        try:
            val = float(data[feat])
        except (ValueError, TypeError):
            return None, f"Field '{feat}' must be a number, got: {data[feat]!r}"
        if not (meta["min"] <= val <= meta["max"]):
            return None, (
                f"Field '{feat}' value {val} is out of range "
                f"[{meta['min']}, {meta['max']}]"
            )
        cleaned[feat] = int(val) if meta["type"] == "int" else val
    return cleaned, None


# ── Routes ────────────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Liveness / readiness check."""
    return jsonify({
        "status": "ok",
        "model_loaded": model is not None
    }), 200


@app.route("/predict", methods=["POST"])
def predict():
    """
    Predict heart disease risk.

    Request body (JSON):
    {
        "age": 52, "sex": 1, "cp": 0, "trestbps": 125, "chol": 212,
        "fbs": 0, "restecg": 1, "thalach": 168, "exang": 0,
        "oldpeak": 1.0, "slope": 2, "ca": 2, "thal": 3
    }

    Response:
    {
        "prediction": 1,           // 0 = No Disease, 1 = Disease
        "label": "Disease",
        "probability": 0.82,       // probability of disease
        "risk_level": "High",      // Low / Moderate / High
        "confidence": 0.82
    }
    """
    if model is None:
        return jsonify({"error": "Model not loaded. Run train_model.py first."}), 503

    body = request.get_json(silent=True)
    if not body:
        return jsonify({"error": "Request body must be JSON."}), 400

    cleaned, err = validate_input(body)
    if err:
        return jsonify({"error": err}), 422

    # Build feature vector in the correct order
    feature_vector = np.array([[cleaned[f] for f in feature_names]])

    prediction  = int(model.predict(feature_vector)[0])
    probability = float(model.predict_proba(feature_vector)[0][1])

    # Determine risk level
    if probability < 0.35:
        risk_level = "Low"
    elif probability < 0.65:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    logger.info(
        "Prediction: %s | Probability: %.4f | Risk: %s",
        prediction, probability, risk_level
    )

    return jsonify({
        "prediction":  prediction,
        "label":       "Disease" if prediction == 1 else "No Disease",
        "probability": round(probability, 4),
        "risk_level":  risk_level,
        "confidence":  round(probability if prediction == 1 else 1 - probability, 4),
    }), 200


@app.route("/features", methods=["GET"])
def features():
    """Return feature metadata for the frontend form."""
    return jsonify(FEATURE_META), 200


# ── Entry point ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    if load_model():
        port = int(os.environ.get("PORT", 5001))
        debug = os.environ.get("FLASK_ENV", "production") == "development"
        logger.info("Starting Flask ML server on port %d (debug=%s)…", port, debug)
        app.run(host="0.0.0.0", port=port, debug=debug)
    else:
        logger.error("Exiting: model could not be loaded.")
        raise SystemExit(1)
