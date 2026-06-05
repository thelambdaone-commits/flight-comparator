"""
Train ExtraTreesRegressor model for flight price prediction.
"""

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import ExtraTreesRegressor
from sklearn.model_selection import RandomizedSearchCV
from sklearn.metrics import mean_absolute_error, r2_score
from features import compute_features, get_feature_columns
from typing import List, Dict, Optional
import os

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")
os.makedirs(MODEL_DIR, exist_ok=True)


def train_model(price_history: List[Dict]) -> ExtraTreesRegressor:
    df = compute_features(price_history)
    feature_cols = get_feature_columns()

    df = df.dropna()
    if len(df) < 20:
        raise ValueError(f"Not enough data points: {len(df)} < 20")

    X = df[feature_cols].values
    y = df["price"].values

    split = int(len(X) * 0.8)
    X_train, X_test = X[:split], X[split:]
    y_train, y_test = y[:split], y[split:]

    base = ExtraTreesRegressor(random_state=42, n_jobs=-1)

    param_grid = {
        "n_estimators": [50, 100, 200, 300],
        "max_depth": [10, 15, 20, 25, None],
        "min_samples_split": [2, 5, 10],
        "min_samples_leaf": [1, 2, 4],
        "max_features": ["sqrt", "log2", None],
    }

    search = RandomizedSearchCV(
        base,
        param_grid,
        n_iter=50,
        cv=5,
        scoring="neg_mean_absolute_error",
        random_state=42,
        n_jobs=-1,
        verbose=1,
    )

    search.fit(X_train, y_train)

    best = search.best_estimator_

    y_pred = best.predict(X_test)
    mae = mean_absolute_error(y_test, y_pred)
    r2 = r2_score(y_test, y_pred)

    print(f"Model trained: MAE={mae:.2f}, R2={r2:.4f}")
    print(f"Best params: {search.best_params_}")

    model_path = os.path.join(MODEL_DIR, "flight_price_model.pkl")
    joblib.dump(best, model_path)
    print(f"Model saved to {model_path}")

    metadata = {
        "mae": float(mae),
        "r2": float(r2),
        "n_samples": len(df),
        "best_params": search.best_params_,
        "feature_columns": feature_cols,
    }
    meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
    import json
    with open(meta_path, "w") as f:
        json.dump(metadata, f, indent=2)

    return best


def load_model() -> Optional[ExtraTreesRegressor]:
    model_path = os.path.join(MODEL_DIR, "flight_price_model.pkl")
    if os.path.exists(model_path):
        return joblib.load(model_path)
    return None
