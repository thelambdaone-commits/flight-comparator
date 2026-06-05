"""
Feature engineering for flight price prediction.

Features:
- airline_encoded: one-hot encoded airline
- day_of_week: 0=Monday ... 6=Sunday
- month: 1-12
- days_to_departure: days between search and departure
- hour: hour of day (0-23)
- is_weekend: 0 or 1
- is_holiday: 0 or 1 (simplified)
- origin_encoded, destination_encoded: airport codes
- stops: number of stops
- duration_minutes: flight duration
- price_ma_7d: 7-day moving average of price
- price_ma_30d: 30-day moving average
- price_volatility: std deviation of last 7 prices
"""

import pandas as pd
import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict


def compute_features(price_history: List[Dict]) -> pd.DataFrame:
    df = pd.DataFrame(price_history)
    if df.empty:
        return df

    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp")

    df["day_of_week"] = df["timestamp"].dt.dayofweek
    df["month"] = df["timestamp"].dt.month
    df["hour"] = df["timestamp"].dt.hour
    df["is_weekend"] = df["day_of_week"].isin([5, 6]).astype(int)
    df["is_holiday"] = df["month"].isin([7, 8, 12]).astype(int)  # simplified

    # Moving averages
    df["price_ma_7d"] = df["price"].rolling(window=7, min_periods=1).mean()
    df["price_ma_30d"] = df["price"].rolling(window=30, min_periods=1).mean()
    df["price_volatility"] = df["price"].rolling(window=7, min_periods=1).std().fillna(0)

    # Lag features
    df["price_lag_1"] = df["price"].shift(1).fillna(df["price"].mean())
    df["price_lag_7"] = df["price"].shift(7).fillna(df["price"].mean())

    # Price change
    df["price_change_1d"] = df["price"].diff(1).fillna(0)
    df["price_change_7d"] = df["price"].diff(7).fillna(0)

    df["days_to_departure"] = df.get("days_to_departure", 14)  # default if missing

    return df


def get_feature_columns() -> List[str]:
    return [
        "day_of_week",
        "month",
        "hour",
        "is_weekend",
        "is_holiday",
        "price_ma_7d",
        "price_ma_30d",
        "price_volatility",
        "price_lag_1",
        "price_lag_7",
        "price_change_1d",
        "price_change_7d",
        "days_to_departure",
    ]
