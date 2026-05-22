# Stock Predictor Dashboard Architecture

A comprehensive full-stack modern application for stock market prediction, analysis, and portfolio management.

## Features
- **Real-time Stock Insights:** Visualize stock trends with dynamic, interactive charts (Chart.js).
- **Advanced AI/ML Models:** Leverage LSTM, GRU, Linear Regression, and Random Forest for predicting future trends.
- **Sentiment Analysis:** Analyze market sentiment based on news articles to adjust confidence metrics.
- **Fintech Dashboard:** Responsive, dark-themed UI inspired by modern fintech platforms. 
- **Peer Comparison:** Compare fundamentally and technically with industry competitors.
- **Personal Portfolio & Premium Options:** Secure onboarding, detailed asset tracking, and premium features lock.

## Tech Stack
- **Frontend**: HTML5, CSS3, JavaScript (Vanilla JS), Chart.js
- **Backend**: Python, Flask, Pandas, Scikit-learn, TensorFlow/Keras
- **APIs**: Alpha Vantage (or similar market data providers)

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone <your-repository-url>
   cd "stock prediction final"
   ```

2. **Backend Setup:**
   ```bash
   cd backend
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On macOS/Linux:
   # source venv/bin/activate
   
   pip install -r requirements.txt
   ```
   *Note: If you are using API keys (like Alpha Vantage), it is recommended to set them up using a `.env` file in the `backend` folder.*

3. **Run the Application:**
   - Start the backend server: 
     ```bash
     python app.py
     ```
   - Start a local development server for the static frontend files (or simply open `index.html` in your web browser, though serving via local network is recommended for CORS).

## Project Structure
- `index.html` / `script.js` - Main landing page.
- `company.html` / `company.js` / `company.css` - Detailed view of specific stocks, including charts and predictions.
- `stocks.html` / `stocks.js` - Dashboard listing various stocks.
- `portfolio.html` / `portfolio.js` - User portfolio section.
- `backend/` - Contains all python machine learning models and server endpoints (`app.py`).

## License
MIT
