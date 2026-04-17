"""
train_model.py
--------------
Trains a Random Forest classifier on the UCI Heart Disease dataset.
Downloads the dataset programmatically, preprocesses it, trains the model,
and saves it to disk using joblib.

Run this script once before starting the Flask server:
    python train_model.py
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.model_selection import train_test_split, cross_val_score
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, accuracy_score, roc_auc_score
from sklearn.pipeline import Pipeline

# ── Dataset ──────────────────────────────────────────────────────────────────
# UCI Heart Disease dataset column names
COLUMNS = [
    "age", "sex", "cp", "trestbps", "chol",
    "fbs", "restecg", "thalach", "exang",
    "oldpeak", "slope", "ca", "thal", "target"
]

def load_dataset() -> pd.DataFrame:
    """
    Load the UCI Heart Disease dataset.
    Tries to load from a local CSV first; falls back to the UCI repository.
    """
    local_path = os.path.join(os.path.dirname(__file__), "data", "heart.csv")

    if os.path.exists(local_path):
        print(f"[INFO] Loading dataset from {local_path}")
        df = pd.read_csv(local_path)
        # Normalise column names if the CSV already has headers
        if df.columns[0].lower() == "age":
            df.columns = [c.lower() for c in df.columns]
        else:
            df.columns = COLUMNS
    else:
        print("[INFO] Downloading UCI Heart Disease dataset …")
        url = (
            "https://archive.ics.uci.edu/ml/machine-learning-databases/"
            "heart-disease/processed.cleveland.data"
        )
        try:
            df = pd.read_csv(url, header=None, names=COLUMNS, na_values="?")
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            df.to_csv(local_path, index=False)
            print(f"[INFO] Dataset saved to {local_path}")
        except Exception:
            print("[WARN] Download failed – generating synthetic dataset for demo.")
            df = _generate_synthetic_dataset()

    return df


def _generate_synthetic_dataset(n: int = 1000) -> pd.DataFrame:
    """
    Generate a realistic synthetic heart disease dataset for demo purposes
    when the UCI dataset is unavailable.
    """
    rng = np.random.default_rng(42)

    age      = rng.integers(29, 77, n)
    sex      = rng.integers(0, 2, n)
    cp       = rng.integers(0, 4, n)
    trestbps = rng.integers(94, 200, n)
    chol     = rng.integers(126, 564, n)
    fbs      = (rng.random(n) > 0.85).astype(int)
    restecg  = rng.integers(0, 3, n)
    thalach  = rng.integers(71, 202, n)
    exang    = (rng.random(n) > 0.68).astype(int)
    oldpeak  = np.round(rng.uniform(0, 6.2, n), 1)
    slope    = rng.integers(0, 3, n)
    ca       = rng.integers(0, 4, n)
    thal     = rng.choice([1, 2, 3], n)

    # Simple rule-based target for realistic class balance
    risk_score = (
        (age > 55).astype(int) +
        (sex == 1).astype(int) +
        (cp > 1).astype(int) +
        (trestbps > 140).astype(int) +
        (chol > 240).astype(int) +
        (fbs == 1).astype(int) +
        (thalach < 140).astype(int) +
        (exang == 1).astype(int) +
        (oldpeak > 2).astype(int) +
        (ca > 0).astype(int)
    )
    target = (risk_score >= 4).astype(int)

    return pd.DataFrame({
        "age": age, "sex": sex, "cp": cp, "trestbps": trestbps,
        "chol": chol, "fbs": fbs, "restecg": restecg, "thalach": thalach,
        "exang": exang, "oldpeak": oldpeak, "slope": slope, "ca": ca,
        "thal": thal, "target": target
    })


# ── Preprocessing ─────────────────────────────────────────────────────────────

def preprocess(df: pd.DataFrame) -> tuple[pd.DataFrame, pd.Series]:
    """Clean and prepare features and labels."""
    df = df.copy()

    # Drop rows with missing values
    df.dropna(inplace=True)

    # Binarise target: 0 = no disease, 1 = disease (values > 0 → 1)
    df["target"] = (df["target"] > 0).astype(int)

    feature_cols = [c for c in COLUMNS if c != "target"]
    X = df[feature_cols]
    y = df["target"]

    return X, y


# ── Training ──────────────────────────────────────────────────────────────────

def train(X: pd.DataFrame, y: pd.Series) -> Pipeline:
    """
    Build and train a pipeline:
      StandardScaler → RandomForestClassifier
    """
    pipeline = Pipeline([
        ("scaler", StandardScaler()),
        ("clf", RandomForestClassifier(
            n_estimators=200,
            max_depth=8,
            min_samples_split=4,
            min_samples_leaf=2,
            random_state=42,
            class_weight="balanced"
        ))
    ])

    pipeline.fit(X, y)
    return pipeline


# ── Evaluation ────────────────────────────────────────────────────────────────

def evaluate(pipeline: Pipeline, X: pd.DataFrame, y: pd.Series) -> None:
    """Print evaluation metrics."""
    cv_scores = cross_val_score(pipeline, X, y, cv=5, scoring="accuracy")
    print(f"\n[EVAL] 5-fold CV Accuracy : {cv_scores.mean():.4f} ± {cv_scores.std():.4f}")

    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=y
    )
    pipeline.fit(X_train, y_train)
    y_pred  = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]

    print(f"[EVAL] Test Accuracy      : {accuracy_score(y_test, y_pred):.4f}")
    print(f"[EVAL] ROC-AUC            : {roc_auc_score(y_test, y_proba):.4f}")
    print("\n[EVAL] Classification Report:")
    print(classification_report(y_test, y_pred, target_names=["No Disease", "Disease"]))


# ── Main ──────────────────────────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("  Heart Disease Model Training")
    print("=" * 60)

    df = load_dataset()
    print(f"[INFO] Dataset shape: {df.shape}")
    print(f"[INFO] Target distribution:\n{df['target'].value_counts().to_string()}\n")

    X, y = preprocess(df)

    # Evaluate before saving
    evaluate(train(X, y), X, y)

    # Retrain on full dataset and save
    final_pipeline = train(X, y)

    models_dir = os.path.join(os.path.dirname(__file__), "models")
    os.makedirs(models_dir, exist_ok=True)
    model_path = os.path.join(models_dir, "heart_disease_model.joblib")

    joblib.dump(final_pipeline, model_path)
    print(f"\n[INFO] Model saved to {model_path}")

    # Save feature names for validation in the API
    feature_path = os.path.join(models_dir, "feature_names.joblib")
    joblib.dump(list(X.columns), feature_path)
    print(f"[INFO] Feature names saved to {feature_path}")
    print("\n[DONE] Training complete.")


if __name__ == "__main__":
    main()
