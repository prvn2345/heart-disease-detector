import sys
import os
import json
import argparse
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import pandas as pd
import joblib

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, "models", "heart_disease_model.joblib")
FEAT_PATH = os.path.join(BASE_DIR, "models", "feature_names.joblib")

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

_model = None
_feature_names = None

def get_model():
    global _model, _feature_names
    if _model is None:
        if not os.path.exists(MODEL_PATH) or not os.path.exists(FEAT_PATH):
            raise FileNotFoundError(f"Model artifacts missing. Expected {MODEL_PATH} and {FEAT_PATH}")
        _model = joblib.load(MODEL_PATH)
        _feature_names = joblib.load(FEAT_PATH)
    return _model, _feature_names

def validate_and_clean(data):
    cleaned = {}
    for feat, meta in FEATURE_META.items():
        if feat not in data:
            raise ValueError(f"Missing required field: '{feat}'")
        try:
            val = float(data[feat])
        except (ValueError, TypeError):
            raise ValueError(f"Field '{feat}' must be a number, got: {data[feat]!r}")
        if not (meta["min"] <= val <= meta["max"]):
            raise ValueError(f"Field '{feat}' value {val} is out of range [{meta['min']}, {meta['max']}]")
        cleaned[feat] = int(val) if meta["type"] == "int" else val
    return cleaned

def predict(input_data):
    model, feature_names = get_model()
    cleaned = validate_and_clean(input_data)
    feature_df = pd.DataFrame([cleaned])[feature_names]

    prediction = int(model.predict(feature_df)[0])
    probability = float(model.predict_proba(feature_df)[0][1])

    if probability < 0.35:
        risk_level = "Low"
    elif probability < 0.65:
        risk_level = "Moderate"
    else:
        risk_level = "High"

    confidence = probability if prediction == 1 else 1.0 - probability

    return {
        "success": True,
        "prediction": prediction,
        "label": "Disease" if prediction == 1 else "No Disease",
        "probability": round(probability, 4),
        "risk_level": risk_level,
        "confidence": round(confidence, 4),
    }

def main():
    parser = argparse.ArgumentParser(description="Heart Disease Prediction Engine")
    parser.add_argument("--test", action="store_true", help="Run self-test with sample patient data")
    args = parser.parse_args()

    if args.test:
        sample_patient = {
            "age": 52, "sex": 1, "cp": 0, "trestbps": 125, "chol": 212,
            "fbs": 0, "restecg": 1, "thalach": 168, "exang": 0,
            "oldpeak": 1.0, "slope": 2, "ca": 2, "thal": 3
        }
        try:
            result = predict(sample_patient)
            print(json.dumps(result, indent=2))
        except Exception as e:
            print(json.dumps({"success": False, "error": str(e)}, indent=2))
        return

    try:
        raw_input = sys.stdin.read()
        if not raw_input.strip():
            print(json.dumps({"success": False, "error": "Empty input payload"}))
            return
        payload = json.loads(raw_input)
        result = predict(payload)
        print(json.dumps(result))
    except Exception as e:
        print(json.dumps({"success": False, "error": str(e)}))

if __name__ == "__main__":
    main()
