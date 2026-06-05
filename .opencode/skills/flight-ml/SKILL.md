---
name: flight-ml
description: >
  Prédiction de prix de vols avec ExtraTreesRegressor. Feature engineering
  avancé (day_of_week, month, moving averages, volatility, price lags).
  API FastAPI Python. Donne le "best time to buy" et la confiance.
license: MIT
compatibility: opencode
metadata:
  model: extratreesregressor
  language: python
  framework: fastapi, scikit-learn
---

# Flight ML Prediction Skill

## Triggers
- "prédiction prix {from} → {to}"
- "quel est le meilleur moment pour acheter {from} → {to}"
- "analyse les tendances {from} → {to}"

## ML Pipeline
1. **Features**: day_of_week, month, hour, is_weekend, is_holiday
   price_ma_7d, price_ma_30d, price_volatility, price_lag_1, price_lag_7
2. **Model**: ExtraTreesRegressor + RandomizedSearchCV
3. **Hyperparams**: n_estimators(50-300), max_depth(10-25), min_samples_split(2-10)
4. **Training**: Ré-entraînement hebdomadaire automatique
5. **Output**: predicted_price, best_time_to_buy, confidence, trend

## API Endpoints
- POST /predict — prédiction pour une route
- POST /train — ré-entraînement du modèle
- GET /health — statut du modèle

## Example Response
```json
{
  "predicted_price": 142.50,
  "min_price": 134.00,
  "max_price": 178.00,
  "confidence": 0.82,
  "best_time_to_buy": "Dans 2-3 jours, le prix semble en baisse",
  "trend": "📉 Baisse"
}
```
