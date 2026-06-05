"""
FastAPI prediction service for flight prices.

Usage:
    uvicorn src.predict:app --reload --port 8000

Endpoints:
    POST /predict      - Predict price for a route
    GET  /health       - Health check
"""

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Optional
from features import compute_features, get_feature_columns
from train import load_model, train_model
import numpy as np
import pandas as pd
import json
import os

app = FastAPI(title="Flight ML Engine", version="0.1.0")

MODEL_DIR = os.path.join(os.path.dirname(__file__), "..", "models")


class PricePoint(BaseModel):
    price: float
    timestamp: str
    pointOfSale: Optional[str] = "FR"


class PredictRequest(BaseModel):
    origin: str
    destination: str
    price_history: List[PricePoint]


class PredictResponse(BaseModel):
    predicted_price: float
    min_price: float
    max_price: float
    confidence: float
    best_time_to_buy: str
    trend: str


class TrainRequest(BaseModel):
    route_origin: str
    route_destination: str
    price_history: List[PricePoint]


@app.get("/health")
async def health():
    model = load_model()
    return {
        "status": "ok",
        "model_loaded": model is not None,
        "model_dir": MODEL_DIR,
    }


@app.post("/predict", response_model=PredictResponse)
async def predict(req: PredictRequest):
    model = load_model()
    if model is None:
        raise HTTPException(status_code=503, detail="Model not trained yet. POST /train first.")

    data = [p.model_dump() for p in req.price_history]
    df = compute_features(data)

    if df.empty or len(df) < 5:
        raise HTTPException(status_code=400, detail="Need at least 5 price points")

    feature_cols = get_feature_columns()
    last_row = df.iloc[-1:][feature_cols].fillna(0)

    predicted = float(model.predict(last_row)[0])
    current = data[-1]["price"]

    prices = [p["price"] for p in data]
    min_price = float(np.min(prices))
    max_price = float(np.max(prices))
    avg_price = float(np.mean(prices))

    # Confidence based on model metadata
    meta_path = os.path.join(MODEL_DIR, "model_metadata.json")
    confidence = 0.5
    if os.path.exists(meta_path):
        with open(meta_path) as f:
            meta = json.load(f)
            r2 = meta.get("r2", 0)
            confidence = min(0.95, max(0.3, r2))

    # Best time to buy heuristic
    if predicted < current * 0.9:
        best_time = "Maintenant ! Le prix devrait encore baisser"
    elif predicted < current:
        best_time = "Dans 2-3 jours, le prix semble en baisse"
    elif predicted > current * 1.1:
        best_time = "Le prix va monter, achetez maintenant"
    else:
        best_time = "Prix stable, surveillez encore quelques jours"

    # Trend
    if len(prices) >= 7:
        recent = prices[:7]
        if recent[0] < recent[-1] * 0.95:
            trend = "📉 Baisse"
        elif recent[0] > recent[-1] * 1.05:
            trend = "📈 Hausse"
        else:
            trend = "➡️ Stable"
    else:
        trend = "➡️ Données insuffisantes"

    return PredictResponse(
        predicted_price=round(predicted, 2),
        min_price=round(min_price, 2),
        max_price=round(max_price, 2),
        confidence=round(confidence, 2),
        best_time_to_buy=best_time,
        trend=trend,
    )


@app.post("/train")
async def train(req: TrainRequest):
    data = [p.model_dump() for p in req.price_history]
    if len(data) < 20:
        raise HTTPException(status_code=400, detail=f"Need at least 20 data points, got {len(data)}")
    try:
        model = train_model(data)
        return {
            "status": "ok",
            "message": f"Model trained on {len(data)} data points",
            "route": f"{req.route_origin}→{req.route_destination}",
            "n_samples": len(data),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
