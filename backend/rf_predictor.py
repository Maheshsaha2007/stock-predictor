import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error
import warnings

warnings.filterwarnings('ignore')


def train_and_predict_rf(ticker_symbol, future_days=15):
    """
    Train a Random Forest Regressor using engineered technical indicators
    (MA5, MA20, RSI, MACD) to predict future stock prices.
    Random Forest captures non-linear feature interactions that linear models miss.
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

        # Feature Engineering: Technical Indicators
        df['MA5'] = df['Close'].rolling(window=5).mean()
        df['MA20'] = df['Close'].rolling(window=20).mean()
        df['MA50'] = df['Close'].rolling(window=50).mean()

        # RSI
        delta = df['Close'].diff()
        gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
        loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
        rs = gain / loss
        df['RSI'] = 100 - (100 / (1 + rs))

        # MACD
        ema12 = df['Close'].ewm(span=12, adjust=False).mean()
        ema26 = df['Close'].ewm(span=26, adjust=False).mean()
        df['MACD'] = ema12 - ema26

        # Volatility (20-day rolling std)
        df['Volatility'] = df['Close'].rolling(window=20).std()

        # Target: Next day's Close
        df['Target'] = df['Close'].shift(-1)
        train_df = df.dropna()

        if len(train_df) < 30:
            return None

        features = ['Close', 'MA5', 'MA20', 'MA50', 'RSI', 'MACD', 'Volatility']
        X = train_df[features].values
        y = train_df['Target'].values

        # Split for validation
        split = int(len(X) * 0.9)
        X_train, X_test = X[:split], X[split:]
        y_train, y_test = y[:split], y[split:]

        # Train Random Forest
        model = RandomForestRegressor(n_estimators=200, max_depth=15, random_state=42, n_jobs=-1)
        model.fit(X_train, y_train)

        # Validation metrics
        y_pred = model.predict(X_test)
        mae = mean_absolute_error(y_test, y_pred)
        rmse = np.sqrt(mean_squared_error(y_test, y_pred))

        # Predict future recursively
        last_row = df.iloc[-1]
        current_features = np.array([
            last_row['Close'], last_row['MA5'], last_row['MA20'],
            last_row['MA50'], last_row['RSI'], last_row['MACD'], last_row['Volatility']
        ]).reshape(1, -1)

        future_predictions = []
        temp_prices = df['Close'].tolist()

        for _ in range(future_days):
            next_price = model.predict(current_features)[0]
            future_predictions.append(next_price)
            temp_prices.append(next_price)

            # Recalculate features
            ma5 = np.mean(temp_prices[-5:])
            ma20 = np.mean(temp_prices[-20:])
            ma50 = np.mean(temp_prices[-50:]) if len(temp_prices) >= 50 else np.mean(temp_prices)
            volatility = np.std(temp_prices[-20:])

            current_features = np.array([
                next_price, ma5, ma20, ma50,
                last_row['RSI'], last_row['MACD'], volatility
            ]).reshape(1, -1)

        # Feature importance
        importance = dict(zip(features, model.feature_importances_.tolist()))

        return {
            "model": "Random Forest",
            "current_price": float(df['Close'].iloc[-1]),
            "historical": df['Close'].iloc[-30:].tolist(),
            "future": [float(p) for p in future_predictions],
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
            "feature_importance": importance
        }
    except Exception as e:
        print(f"Random Forest Error: {e}")
        return None
