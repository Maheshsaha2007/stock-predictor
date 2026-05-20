import numpy as np
from sklearn.linear_model import LogisticRegression
import warnings

warnings.filterwarnings('ignore')


def make_decision(model_results, sentiment_result):
    """
    Decision Layer using Logistic Regression.
    
    Aggregates outputs from all prediction models + sentiment analysis
    and produces a final BUY / HOLD / SELL recommendation with confidence.
    
    Feature vector for the decision model:
    - Price change % from each model (LSTM, RF, GRU, Linear)
    - Sentiment compound score
    - Model agreement score
    """
    try:
        current_price = None
        predicted_changes = []
        model_details = []

        for result in model_results:
            if result is None:
                continue
            if current_price is None:
                current_price = result.get('current_price', 0)

            future = result.get('future', [])
            if future and current_price and current_price > 0:
                avg_future = np.mean(future[-5:])  # Average of last 5 predicted days
                pct_change = ((avg_future - current_price) / current_price) * 100
                predicted_changes.append(pct_change)
                model_details.append({
                    "model": result.get('model', 'Unknown'),
                    "predicted_change_pct": round(pct_change, 2),
                    "final_price": round(float(future[-1]), 2),
                    "mae": result.get('mae', 0),
                    "rmse": result.get('rmse', 0),
                })

        if not predicted_changes or current_price is None:
            return {
                "decision": "HOLD",
                "confidence": 50,
                "reason": "Insufficient model data for decision.",
                "model_details": [],
            }

        # Sentiment score
        compound_score = sentiment_result.get('compound_score', 0) if sentiment_result else 0
        sentiment_label = sentiment_result.get('sentiment_label', 'Neutral') if sentiment_result else 'Neutral'

        # --- Build a synthetic training set for Logistic Regression ---
        # We create labeled examples based on known market heuristics
        # This is a self-supervised approach since we don't have historical decision labels
        np.random.seed(42)
        n_samples = 300

        # Synthetic features: [avg_model_change, model_agreement, sentiment]
        synth_changes = np.random.normal(0, 3, n_samples)
        synth_agreement = np.random.uniform(0, 1, n_samples)
        synth_sentiment = np.random.uniform(-1, 1, n_samples)

        X_train = np.column_stack([synth_changes, synth_agreement, synth_sentiment])

        # Labels: 0=SELL, 1=HOLD, 2=BUY
        y_train = []
        for i in range(n_samples):
            combined = synth_changes[i] + synth_sentiment[i] * 2
            if combined > 2.0 and synth_agreement[i] > 0.4:
                y_train.append(2)  # BUY
            elif combined < -2.0 and synth_agreement[i] > 0.4:
                y_train.append(0)  # SELL
            else:
                y_train.append(1)  # HOLD
        y_train = np.array(y_train)

        # Train logistic regression
        lr_model = LogisticRegression(multi_class='multinomial', max_iter=500, random_state=42)
        lr_model.fit(X_train, y_train)

        # Prepare real features
        avg_change = np.mean(predicted_changes)
        # Model agreement: how many models agree on direction
        directions = [1 if c > 0 else (-1 if c < 0 else 0) for c in predicted_changes]
        if len(directions) > 0:
            agreement = abs(sum(directions)) / len(directions)
        else:
            agreement = 0

        real_features = np.array([[avg_change, agreement, compound_score]])

        # Predict
        prediction = lr_model.predict(real_features)[0]
        probabilities = lr_model.predict_proba(real_features)[0]

        decision_map = {0: "SELL", 1: "HOLD", 2: "BUY"}
        decision = decision_map[prediction]
        confidence = round(float(max(probabilities)) * 100, 1)

        # Build reasoning
        bullish_models = sum(1 for c in predicted_changes if c > 0)
        bearish_models = sum(1 for c in predicted_changes if c < 0)
        total_models = len(predicted_changes)

        reason_parts = []
        reason_parts.append(
            f"{bullish_models}/{total_models} models predict price increase "
            f"(avg: {'+' if avg_change > 0 else ''}{avg_change:.2f}%)"
        )
        reason_parts.append(f"Market sentiment: {sentiment_label} ({compound_score:+.3f})")
        reason_parts.append(f"Model agreement: {agreement * 100:.0f}%")

        return {
            "decision": decision,
            "confidence": confidence,
            "reason": " | ".join(reason_parts),
            "avg_predicted_change": round(avg_change, 2),
            "model_agreement": round(agreement * 100, 1),
            "sentiment_impact": sentiment_label,
            "probabilities": {
                "BUY": round(float(probabilities[2]) * 100, 1),
                "HOLD": round(float(probabilities[1]) * 100, 1),
                "SELL": round(float(probabilities[0]) * 100, 1),
            },
            "model_details": model_details,
        }

    except Exception as e:
        print(f"Decision Engine Error: {e}")
        return {
            "decision": "HOLD",
            "confidence": 50,
            "reason": f"Decision computation error: {str(e)}",
            "model_details": [],
        }
