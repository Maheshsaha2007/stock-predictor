from flask import Flask, jsonify, request
from flask_cors import CORS
import threading
import traceback

# Import all prediction models
from lstm_predictor import train_and_predict_lstm
from rf_predictor import train_and_predict_rf
from gru_predictor import train_and_predict_gru
from linear_predictor import train_and_predict_linear
from sentiment_analyzer import analyze_sentiment
from decision_engine import make_decision
from alpha_vantage_service import (
    get_realtime_quote, get_batch_quotes, get_intraday_prices,
    get_daily_prices, search_symbol
)

app = Flask(__name__)
CORS(app)


@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({"status": "ok", "models": ["LSTM", "Random Forest", "GRU", "Linear Regression", "VADER Sentiment", "Logistic Regression Decision"]})


@app.route('/api/predict/all', methods=['GET'])
def predict_all_models():
    """
    Run ALL models for a given ticker and return unified results.
    This is the primary endpoint used by the dashboard.
    """
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    days = int(request.args.get('days', 15))

    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker_ns = ticker + '.NS'
    else:
        ticker_ns = ticker

    results = {}
    errors = []

    # Run all models (sequentially for reliability)
    # 1. LSTM
    try:
        results['lstm'] = train_and_predict_lstm(ticker_ns, days)
        if results['lstm'] is None:
            errors.append("LSTM: No data returned")
    except Exception as e:
        results['lstm'] = None
        errors.append(f"LSTM: {str(e)}")

    # 2. Random Forest
    try:
        results['rf'] = train_and_predict_rf(ticker_ns, days)
        if results['rf'] is None:
            errors.append("RF: No data returned")
    except Exception as e:
        results['rf'] = None
        errors.append(f"RF: {str(e)}")

    # 3. GRU (fast real-time)
    try:
        results['gru'] = train_and_predict_gru(ticker_ns, days)
        if results['gru'] is None:
            errors.append("GRU: No data returned")
    except Exception as e:
        results['gru'] = None
        errors.append(f"GRU: {str(e)}")

    # 4. Linear Regression (baseline)
    try:
        results['linear'] = train_and_predict_linear(ticker_ns, days)
        if results['linear'] is None:
            errors.append("Linear: No data returned")
    except Exception as e:
        results['linear'] = None
        errors.append(f"Linear: {str(e)}")

    # 5. Sentiment Analysis (VADER)
    try:
        results['sentiment'] = analyze_sentiment(ticker_ns)
    except Exception as e:
        results['sentiment'] = None
        errors.append(f"Sentiment: {str(e)}")

    # 6. Decision Engine (Logistic Regression)
    try:
        model_outputs = [results.get('lstm'), results.get('rf'), results.get('gru'), results.get('linear')]
        valid_outputs = [m for m in model_outputs if m is not None]
        results['decision'] = make_decision(valid_outputs, results.get('sentiment'))
    except Exception as e:
        results['decision'] = None
        errors.append(f"Decision: {str(e)}")

    return jsonify({
        "ticker": ticker,
        "results": results,
        "errors": errors,
        "models_available": sum(1 for v in [results.get('lstm'), results.get('rf'), results.get('gru'), results.get('linear')] if v is not None),
    })


@app.route('/api/predict/lstm', methods=['GET'])
def predict_lstm():
    """Individual LSTM prediction endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    days = int(request.args.get('days', 15))
    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker += '.NS'
    result = train_and_predict_lstm(ticker, days)
    if result:
        return jsonify(result)
    return jsonify({"error": "LSTM prediction failed"}), 500


@app.route('/api/predict/rf', methods=['GET'])
def predict_rf():
    """Individual Random Forest prediction endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    days = int(request.args.get('days', 15))
    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker += '.NS'
    result = train_and_predict_rf(ticker, days)
    if result:
        return jsonify(result)
    return jsonify({"error": "Random Forest prediction failed"}), 500


@app.route('/api/predict/gru', methods=['GET'])
def predict_gru():
    """Individual GRU prediction endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    days = int(request.args.get('days', 15))
    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker += '.NS'
    result = train_and_predict_gru(ticker, days)
    if result:
        return jsonify(result)
    return jsonify({"error": "GRU prediction failed"}), 500


@app.route('/api/predict/linear', methods=['GET'])
def predict_linear():
    """Individual Linear Regression baseline endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    days = int(request.args.get('days', 15))
    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker += '.NS'
    result = train_and_predict_linear(ticker, days)
    if result:
        return jsonify(result)
    return jsonify({"error": "Linear Regression prediction failed"}), 500


@app.route('/api/sentiment', methods=['GET'])
def get_sentiment():
    """VADER sentiment analysis endpoint"""
    ticker = request.args.get('ticker', 'RELIANCE.NS')
    if not ticker.endswith('.NS') and not ticker.endswith('.BO'):
        ticker += '.NS'
    result = analyze_sentiment(ticker)
    return jsonify(result)


# ========== Alpha Vantage Real-Time Data Endpoints ==========

@app.route('/api/quote', methods=['GET'])
def get_quote():
    """Get real-time quote for a single Indian stock via Alpha Vantage"""
    symbol = request.args.get('symbol', 'RELIANCE')
    result = get_realtime_quote(symbol)
    if result:
        return jsonify(result)
    return jsonify({"error": f"No quote data for {symbol}"}), 404


@app.route('/api/quotes', methods=['GET'])
def get_quotes():
    """
    Get real-time quotes for multiple Indian stocks.
    Usage: /api/quotes?symbols=RELIANCE,TCS,INFY,HDFCBANK
    """
    symbols_str = request.args.get('symbols', 'RELIANCE,TCS,INFY,HDFCBANK,ITC,TATAMOTORS')
    symbols = [s.strip() for s in symbols_str.split(',') if s.strip()]
    results = get_batch_quotes(symbols)
    return jsonify({
        "quotes": results,
        "count": len(results),
        "requested": len(symbols),
    })


@app.route('/api/intraday', methods=['GET'])
def get_intraday():
    """Get intraday price series for an Indian stock"""
    symbol = request.args.get('symbol', 'RELIANCE')
    interval = request.args.get('interval', '5min')
    result = get_intraday_prices(symbol, interval)
    if result:
        return jsonify(result)
    return jsonify({"error": f"No intraday data for {symbol}"}), 404


@app.route('/api/daily', methods=['GET'])
def get_daily():
    """Get daily price history for an Indian stock"""
    symbol = request.args.get('symbol', 'RELIANCE')
    size = request.args.get('outputsize', 'compact')
    result = get_daily_prices(symbol, size)
    if result:
        return jsonify(result)
    return jsonify({"error": f"No daily data for {symbol}"}), 404


@app.route('/api/search', methods=['GET'])
def symbol_search():
    """Search for Indian stock symbols on Alpha Vantage"""
    keyword = request.args.get('q', '')
    if not keyword:
        return jsonify({"error": "Missing 'q' parameter"}), 400
    results = search_symbol(keyword)
    return jsonify({"matches": results, "count": len(results)})


if __name__ == '__main__':
    print("\n" + "=" * 60)
    print("  StockPredictor AI — Multi-Model Backend")
    print("  Models: LSTM | Random Forest | GRU | Linear Regression")
    print("  Sentiment: VADER NLP | Decision: Logistic Regression")
    print("  Data: Alpha Vantage Real-Time API")
    print("=" * 60)
    print("  Server running at http://localhost:5000")
    print("=" * 60 + "\n")
    app.run(debug=True, port=5000)
