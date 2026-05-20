import yfinance as yf
import numpy as np
import pandas as pd
from sklearn.preprocessing import MinMaxScaler
try:
    from tensorflow.keras.models import Sequential
    from tensorflow.keras.layers import LSTM, Dense, Dropout
except ImportError:
    pass
import os
import warnings

os.environ['TF_CPP_MIN_LOG_LEVEL'] = '3'
warnings.filterwarnings('ignore')


def train_and_predict_lstm(ticker_symbol, future_days=15):
    """
    Train an LSTM neural network on historical stock data and predict future prices.
    LSTM is ideal for capturing long-term temporal dependencies in sequential data.
    """
    try:
        # Fetch last 2 years of daily data
        data = yf.download(ticker_symbol, period="2y", interval="1d", progress=False)
        if data.empty:
            return None

        # Handle multi-index columns from yfinance
        if isinstance(data.columns, pd.MultiIndex):
            df = data['Close'].to_frame()
            if isinstance(df, pd.DataFrame) and df.shape[1] > 1:
                df = df.iloc[:, 0].to_frame()
            df.columns = ['Close']
        else:
            df = data[['Close']].copy()

        df = df.dropna()
        dataset = df.values

        # Scale the data between 0 and 1
        scaler = MinMaxScaler(feature_range=(0, 1))
        scaled_data = scaler.fit_transform(dataset)

        # Training data length (95%)
        training_data_len = int(np.ceil(len(dataset) * 0.95))
        train_data = scaled_data[0:training_data_len, :]

        # 60 days sequence length
        sequence_length = 60
        if len(train_data) <= sequence_length:
            return None

        x_train, y_train = [], []
        for i in range(sequence_length, len(train_data)):
            x_train.append(train_data[i - sequence_length:i, 0])
            y_train.append(train_data[i, 0])

        x_train, y_train = np.array(x_train), np.array(y_train)
        x_train = np.reshape(x_train, (x_train.shape[0], x_train.shape[1], 1))

        # Build LSTM model with dropout for regularization
        model = Sequential()
        model.add(LSTM(64, return_sequences=True, input_shape=(x_train.shape[1], 1)))
        model.add(Dropout(0.2))
        model.add(LSTM(64, return_sequences=False))
        model.add(Dropout(0.2))
        model.add(Dense(32))
        model.add(Dense(1))

        model.compile(optimizer='adam', loss='mean_squared_error')

        # Train (5 epochs for responsiveness; production would use 20-50)
        model.fit(x_train, y_train, batch_size=32, epochs=5, verbose=0)

        # Predict future prices recursively
        last_seq = scaled_data[-sequence_length:]
        current_batch = last_seq.reshape((1, sequence_length, 1))

        predicted_scaled = []
        for _ in range(future_days):
            next_pred = model.predict(current_batch, verbose=0)
            predicted_scaled.append(next_pred[0, 0])
            next_pred_reshaped = np.reshape(next_pred, (1, 1, 1))
            current_batch = np.append(current_batch[:, 1:, :], next_pred_reshaped, axis=1)

        future_prices = scaler.inverse_transform(
            np.array(predicted_scaled).reshape(-1, 1)
        )

        # Validation: predict on test set for accuracy metrics
        test_data = scaled_data[training_data_len - sequence_length:]
        x_test = []
        for i in range(sequence_length, len(test_data)):
            x_test.append(test_data[i - sequence_length:i, 0])
        if len(x_test) > 0:
            x_test = np.array(x_test)
            x_test = np.reshape(x_test, (x_test.shape[0], x_test.shape[1], 1))
            test_predictions = model.predict(x_test, verbose=0)
            test_predictions = scaler.inverse_transform(test_predictions)
            actual = dataset[training_data_len:]
            mae = np.mean(np.abs(test_predictions.flatten() - actual.flatten()))
            rmse = np.sqrt(np.mean((test_predictions.flatten() - actual.flatten()) ** 2))
        else:
            mae = 0
            rmse = 0

        return {
            "model": "LSTM",
            "current_price": float(dataset[-1][0]),
            "historical": dataset[-30:].flatten().tolist(),
            "future": future_prices.flatten().tolist(),
            "mae": round(float(mae), 2),
            "rmse": round(float(rmse), 2),
        }
    except Exception as e:
        print(f"LSTM Error: {e}")
        return None
