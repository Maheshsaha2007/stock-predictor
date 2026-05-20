import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings

warnings.filterwarnings('ignore')


def train_and_predict_linear(ticker_symbol, future_days=15):
    """
    Linear Regression baseline model for comparison.
    Uses simple lag features, moving averages, and time index as predictors.
    This serves as the 'minimum bar' — all advanced models should beat this.
    """
    try:
        data = yf.download(ticker_symbol, period="2y", interval="1d", progress=False)
        if data.empty:
            return None

        # Handle multi-index columns
        if isinstance(data.columns, pd.MultiIndex):
            df_close = data['Close']
            if isinstance(df_close, pd.DataFrame):
                df_close = df_close.iloc[:, 0]
        else:
            df_close = data['Close']

        df = pd.DataFrame(df_close.dropna())
        df.columns = ['Close']

        # Feature engineering for linear model
        df['Lag1'] = df['Close'].shift(1)
        df['Lag5'] = df['Close'].shift(5)
        df['Lag10'] = df['Close'].shift(10)
        df['MA5'] = df['Close'].rolling(window=5).mean()
        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['TimeIndex'] = np.arange(len(df))

        # Target
        df['Target'] = df['Close'].shift(-1)
        train_df = df.dropna()

        if len(train_df) < 30:
            return None

        features = ['Lag1', 'Lag5', 'Lag10', 'MA5', 'MA20', 'TimeIndex']
        X = train_df[features].values
        y = train_df['Target'].values

        # Split
        split = int(len(X) * 0.9)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        # Train
        model = LinearRegression()
        model.fit(X_train, y_train)

        # Validation
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))
        r2 = model.score(X_test, y_test)

        # Predict future
        last_row = df.iloc[-1]
        temp_prices = df['Close'].tolist()
        time_idx = int(last_row['TimeIndex'])

        future_predictions = []
        for i in range(future_days):
            time_idx += 1
            lag1 = temp_prices[-1]
            lag5 = temp_prices[-5] if len(temp_prices) >= 5 else temp_prices[0]
            lag10 = temp_prices[-10] if len(temp_prices) >= 10 else temp_prices[0]
            ma5 = np.mean(temp_prices[-5:])
            ma20 = np.mean(temp_prices[-20:])

            feat = np.array([lag1, lag5, lag10, ma5, ma20, time_idx]).reshape(1, -1)
            next_price = model.predict(feat)[0]
            future_predictions.append(next_price)
            temp_prices.append(next_price)

        return {
            "model": "Linear Regression",
            "current_price": float(df['Close'].iloc[-1]),
            "historical": df['Close'].iloc[-30:].tolist(),
            "future": [float(p) for p in future_predictions],
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "r2_score": round(float(r2), 4),
        }
    except Exception as e:
        print(f"Linear Regression Error: {e}")
        return None
