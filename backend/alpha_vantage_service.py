"""
Alpha Vantage API Service
Fetches real-time and intraday stock data for Indian companies (BSE/NSE).
"""

import requests
import time
import warnings

warnings.filterwarnings('ignore')

# Free-tier API key — users should replace with their own from:
# https://www.alphavantage.co/support/#api-key
API_KEY = 'E2DJQ8MTOB6DWA4T'  # Replace with your Alpha Vantage API key
BASE_URL = 'https://www.alphavantage.co/query'

# Cache to avoid hitting rate limits (5 calls/min on free tier)
_cache = {}
_CACHE_TTL = 60  # seconds


def _get_cached(key):
    """Return cached data if still fresh."""
    if key in _cache:
        data, ts = _cache[key]
        if time.time() - ts < _CACHE_TTL:
            return data
    return None


def _set_cache(key, data):
    """Store data in cache."""
    _cache[key] = (data, time.time())


def get_realtime_quote(symbol):
    """
    Fetch real-time quote for an Indian stock using GLOBAL_QUOTE.
    Symbol format: RELIANCE.BSE or RELIANCE.NSE
    """
    cache_key = f"quote_{symbol}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        # Try BSE first, then NSE
        for suffix in ['.BSE', '.NSE', '']:
            ticker = symbol + suffix if not symbol.endswith(('.BSE', '.NSE')) else symbol
            params = {
                'function': 'GLOBAL_QUOTE',
                'symbol': ticker,
                'apikey': API_KEY,
            }
            response = requests.get(BASE_URL, params=params, timeout=10)
            data = response.json()

            quote = data.get('Global Quote', {})
            if quote and quote.get('05. price'):
                result = {
                    'symbol': quote.get('01. symbol', symbol),
                    'price': float(quote.get('05. price', 0)),
                    'change': float(quote.get('09. change', 0)),
                    'change_pct': quote.get('10. change percent', '0%').replace('%', ''),
                    'open': float(quote.get('02. open', 0)),
                    'high': float(quote.get('03. high', 0)),
                    'low': float(quote.get('04. low', 0)),
                    'volume': int(quote.get('06. volume', 0)),
                    'prev_close': float(quote.get('08. previous close', 0)),
                    'latest_day': quote.get('07. latest trading day', ''),
                }
                _set_cache(cache_key, result)
                return result

        return None
    except Exception as e:
        print(f"Alpha Vantage Quote Error for {symbol}: {e}")
        return None


def get_intraday_prices(symbol, interval='5min'):
    """
    Fetch intraday price series for an Indian stock.
    Intervals: 1min, 5min, 15min, 30min, 60min
    """
    cache_key = f"intraday_{symbol}_{interval}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        ticker = symbol if symbol.endswith(('.BSE', '.NSE')) else symbol + '.BSE'
        params = {
            'function': 'TIME_SERIES_INTRADAY',
            'symbol': ticker,
            'interval': interval,
            'apikey': API_KEY,
            'outputsize': 'compact',
        }
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()

        ts_key = f"Time Series ({interval})"
        time_series = data.get(ts_key, {})

        if not time_series:
            return None

        prices = []
        for timestamp, values in sorted(time_series.items()):
            prices.append({
                'time': timestamp,
                'open': float(values['1. open']),
                'high': float(values['2. high']),
                'low': float(values['3. low']),
                'close': float(values['4. close']),
                'volume': int(values['5. volume']),
            })

        result = {'symbol': ticker, 'interval': interval, 'prices': prices}
        _set_cache(cache_key, result)
        return result
    except Exception as e:
        print(f"Alpha Vantage Intraday Error for {symbol}: {e}")
        return None


def get_daily_prices(symbol, outputsize='compact'):
    """
    Fetch daily price history for an Indian stock.
    outputsize: 'compact' (100 days) or 'full' (20+ years)
    """
    cache_key = f"daily_{symbol}_{outputsize}"
    cached = _get_cached(cache_key)
    if cached:
        return cached

    try:
        ticker = symbol if symbol.endswith(('.BSE', '.NSE')) else symbol + '.BSE'
        params = {
            'function': 'TIME_SERIES_DAILY',
            'symbol': ticker,
            'apikey': API_KEY,
            'outputsize': outputsize,
        }
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()

        time_series = data.get('Time Series (Daily)', {})
        if not time_series:
            return None

        prices = []
        for date, values in sorted(time_series.items()):
            prices.append({
                'date': date,
                'open': float(values['1. open']),
                'high': float(values['2. high']),
                'low': float(values['3. low']),
                'close': float(values['4. close']),
                'volume': int(values['5. volume']),
            })

        result = {'symbol': ticker, 'prices': prices}
        _set_cache(cache_key, result)
        return result
    except Exception as e:
        print(f"Alpha Vantage Daily Error for {symbol}: {e}")
        return None


def get_batch_quotes(symbols):
    """
    Fetch real-time quotes for multiple Indian stocks.
    Respects rate limiting by spacing requests.
    Returns a dict mapping symbol -> quote data.
    """
    results = {}
    for i, symbol in enumerate(symbols):
        quote = get_realtime_quote(symbol)
        if quote:
            results[symbol] = quote
        # Rate limit: 5 calls/min on free tier — add 1s delay between calls
        if i < len(symbols) - 1:
            time.sleep(1)
    return results


def search_symbol(keyword):
    """
    Search for Indian stock symbols on Alpha Vantage.
    Useful for finding the correct ticker format.
    """
    try:
        params = {
            'function': 'SYMBOL_SEARCH',
            'keywords': keyword,
            'apikey': API_KEY,
        }
        response = requests.get(BASE_URL, params=params, timeout=10)
        data = response.json()

        matches = data.get('bestMatches', [])
        # Filter for Indian stocks (region = India)
        indian_matches = [
            {
                'symbol': m.get('1. symbol', ''),
                'name': m.get('2. name', ''),
                'type': m.get('3. type', ''),
                'region': m.get('4. region', ''),
                'currency': m.get('8. currency', ''),
            }
            for m in matches
            if 'India' in m.get('4. region', '') or m.get('1. symbol', '').endswith(('.BSE', '.NSE'))
        ]
        return indian_matches
    except Exception as e:
        print(f"Alpha Vantage Search Error: {e}")
        return []
