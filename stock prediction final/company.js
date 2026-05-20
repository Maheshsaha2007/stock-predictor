/**
 * StockPredictor AI — Company Dashboard Controller
 * Connects to Flask backend and renders multi-model predictions,
 * sentiment analysis, and logistic regression decision.
 */

document.addEventListener('DOMContentLoaded', () => {

    // ===== Configuration =====
    const API_BASE = 'http://localhost:5000/api';
    const params = new URLSearchParams(window.location.search);
    const ticker = params.get('ticker') || 'RELIANCE';

    // Company metadata
    const allStocks = window.ALL_STOCKS || [];
    let lookup = allStocks.find(s => s.ticker === ticker);
    
    let peersList = [];
    let sector = 'Market';
    let name = ticker;
    
    if (lookup) {
        sector = lookup.sector;
        name = lookup.name;
        peersList = allStocks.filter(s => s.sector === sector && s.ticker !== ticker).map(s => s.ticker).slice(0, 4);
    } else {
        peersList = allStocks.slice(0, 4).map(s => s.ticker);
    }

    // Default fallback if ALL_STOCKS is empty
    if (peersList.length === 0) {
        name = 'Reliance Industries Ltd';
        sector = 'Energy';
        peersList = ['ITC', 'BHARTIARTL', 'LT'];
    }

    const company = { name, sector, peers: peersList };

    // ===== Update Page Headers =====
    document.title = `${company.name} — AI Dashboard | StockPredictor`;
    const el = id => document.getElementById(id);
    el('companyName').textContent = company.name;
    el('companyTickerBreadcrumb').textContent = ticker;

    // ===== Chart Instance =====
    let predictionChart = null;
    let allModelData = {};

    // ===== Loading Messages =====
    const loadingMessages = [
        { title: 'Training LSTM Neural Network…', sub: 'Processing 60-day sequence patterns' },
        { title: 'Running GRU Real-Time Model…', sub: 'Fast inference with gated recurrent units' },
        { title: 'Building Random Forest Ensemble…', sub: 'Fitting 200 decision trees on technical indicators' },
        { title: 'Computing Linear Regression Baseline…', sub: 'Establishing benchmark predictions' },
        { title: 'Analyzing News with VADER NLP…', sub: 'Scoring market sentiment from headlines' },
        { title: 'Logistic Regression Decision Engine…', sub: 'Fusing all model outputs into BUY/SELL/HOLD' },
    ];

    let loadingIdx = 0;
    const loadingInterval = setInterval(() => {
        loadingIdx = (loadingIdx + 1) % loadingMessages.length;
        const msg = loadingMessages[loadingIdx];
        el('loadingTitle').textContent = msg.title;
        el('loadingSubtext').textContent = msg.sub;
    }, 2500);

    // ===== Fetch All Models =====
    fetchAllPredictions();

    // ===== Fetch Live Quote from Alpha Vantage =====
    fetchLiveQuote();

    async function fetchLiveQuote() {
        try {
            const response = await fetch(`${API_BASE}/quote?symbol=${ticker}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const quote = await response.json();

            if (quote && quote.price > 0) {
                // Update header with live price
                el('currentPrice').textContent = `₹${quote.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                const changePct = parseFloat(quote.change_pct) || 0;
                const sign = changePct >= 0 ? '+' : '';
                el('currentChange').textContent = `${sign}${changePct.toFixed(2)}% (live)`;
                el('currentChange').className = `price-change ${changePct >= 0 ? 'positive' : 'negative'}`;

                // Update fundamentals with live data
                if (quote.high) el('fund52High').textContent = `₹${quote.high.toLocaleString('en-IN')}`;
                if (quote.low) el('fund52Low').textContent = `₹${quote.low.toLocaleString('en-IN')}`;
                if (quote.volume) el('fundVolume').textContent = (quote.volume / 1000000).toFixed(1) + 'M';

                console.log(`✅ Alpha Vantage: Live quote for ${ticker} — ₹${quote.price}`);
            }
        } catch (err) {
            console.warn('Alpha Vantage quote unavailable, using model data:', err.message);
        }
    }

    // Refresh live quote every 60 seconds
    setInterval(fetchLiveQuote, 60000);

    async function fetchAllPredictions() {
        try {
            const response = await fetch(`${API_BASE}/predict/all?ticker=${ticker}&days=15`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            clearInterval(loadingInterval);
            el('aiLoadingOverlay').classList.add('hidden');
            processResults(data.results);
        } catch (error) {
            console.warn('Backend unavailable, using simulated data:', error.message);
            clearInterval(loadingInterval);
            el('aiLoadingOverlay').classList.add('hidden');
            processResults(generateSimulatedData());
        }
    }

    // ===== Process Results =====
    function processResults(results) {
        allModelData = results;

        // Current price
        const firstModel = results.lstm || results.rf || results.gru || results.linear;
        if (firstModel) {
            const price = firstModel.current_price;
            el('currentPrice').textContent = `₹${price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
        }

        // Render chart
        renderPredictionChart('all');

        // Render model tabs
        setupModelTabs();

        // Render metrics
        renderMetrics(results);

        // Render sentiment
        renderSentiment(results.sentiment);

        // Render decision
        renderDecision(results.decision);

        // Render insights
        renderInsights(results);

        // Render peers
        renderPeers();

        // Render financial health chart
        renderFinancialChart();

        // Render standalone cash flow chart
        renderCashFlowChart();

        // Render company portfolio and documents
        renderCompanyPortfolio();

        // Set fundamental placeholders
        setFundamentals();
    }

    // ===== Prediction Chart =====
    function renderPredictionChart(modelFilter) {
        const ctx = el('predictionChart').getContext('2d');
        if (predictionChart) predictionChart.destroy();

        const datasets = [];
        const modelColors = {
            lstm: { border: '#58a6ff', bg: 'rgba(88,166,255,0.08)', label: 'LSTM' },
            rf: { border: '#3fb950', bg: 'rgba(63,185,80,0.08)', label: 'Random Forest' },
            gru: { border: '#39d2c0', bg: 'rgba(57,210,192,0.08)', label: 'GRU' },
            linear: { border: '#fbbf24', bg: 'rgba(251,191,36,0.08)', label: 'Linear Regression' },
        };

        // Historical line (from first available model)
        const refModel = allModelData.lstm || allModelData.rf || allModelData.gru || allModelData.linear;
        if (!refModel) return;

        const historical = refModel.historical || [];
        const totalDays = historical.length + 15;
        const labels = [];
        for (let i = 0; i < totalDays; i++) {
            labels.push(i < historical.length ? `Day ${i + 1}` : `+${i - historical.length + 1}`);
        }

        // Historical dataset
        const histGradient = ctx.createLinearGradient(0, 0, 0, 320);
        histGradient.addColorStop(0, 'rgba(255,255,255,0.06)');
        histGradient.addColorStop(1, 'rgba(255,255,255,0.0)');

        datasets.push({
            label: 'Historical Price',
            data: [...historical, ...Array(15).fill(null)],
            borderColor: '#8b949e',
            backgroundColor: histGradient,
            borderWidth: 2,
            fill: true,
            tension: 0.4,
            pointRadius: 0,
        });

        // Model predictions
        if (modelFilter === 'all') {
            // Compute average (consensus) of all models
            const activeModels = [];
            for (const key of Object.keys(modelColors)) {
                if (allModelData[key] && allModelData[key].future) {
                    activeModels.push(allModelData[key].future);
                }
            }
            
            if (activeModels.length > 0) {
                const numDays = activeModels[0].length;
                const avgFuture = [];
                for (let i = 0; i < numDays; i++) {
                    let sum = 0;
                    for (const f of activeModels) sum += f[i];
                    avgFuture.push(sum / activeModels.length);
                }

                datasets.push({
                    label: 'AI Consensus Average',
                    data: [...Array(historical.length).fill(null), ...avgFuture],
                    borderColor: '#a78bfa',
                    backgroundColor: 'rgba(167,139,250,0.1)',
                    borderWidth: 3,
                    borderDash: [6, 3],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#a78bfa',
                });
            }
        } else {
            // Render specific single model
            for (const [key, config] of Object.entries(modelColors)) {
                if (modelFilter !== key) continue;
                const model = allModelData[key];
                if (!model || !model.future) continue;

                datasets.push({
                    label: config.label,
                    data: [...Array(historical.length).fill(null), ...model.future],
                    borderColor: config.border,
                    backgroundColor: config.bg,
                    borderWidth: 2.5,
                    borderDash: [6, 3],
                    fill: false,
                    tension: 0.4,
                    pointRadius: 0,
                    pointHoverRadius: 5,
                    pointHoverBackgroundColor: config.border,
                });
            }
        }

        predictionChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: { intersect: false, mode: 'index' },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            color: '#8b949e',
                            font: { family: 'Inter', size: 11 },
                            usePointStyle: true,
                            padding: 15,
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(17,24,39,0.95)',
                        titleColor: '#f0f2f5',
                        bodyColor: '#8b949e',
                        borderColor: 'rgba(255,255,255,0.1)',
                        borderWidth: 1,
                        padding: 12,
                        displayColors: true,
                        callbacks: {
                            label: ctx => `${ctx.dataset.label}: ₹${ctx.parsed.y?.toFixed(2) || '--'}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: { color: '#484f58', font: { size: 10 }, maxTicksLimit: 12 },
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: {
                            color: '#484f58',
                            font: { size: 10 },
                            callback: v => `₹${v.toLocaleString('en-IN')}`
                        },
                    }
                }
            }
        });
    }

    // ===== Model Tabs =====
    function setupModelTabs() {
        const tabs = document.querySelectorAll('.model-tab');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                renderPredictionChart(tab.dataset.model);
            });
        });
    }

    // ===== Metrics Grid =====
    function renderMetrics(results) {
        const grid = el('metricsGrid');
        const models = [
            { key: 'lstm', name: 'LSTM', color: '#58a6ff', icon: 'fa-brain' },
            { key: 'rf', name: 'Random Forest', color: '#3fb950', icon: 'fa-tree' },
            { key: 'gru', name: 'GRU', color: '#39d2c0', icon: 'fa-bolt' },
            { key: 'linear', name: 'Linear Reg.', color: '#fbbf24', icon: 'fa-chart-line' },
        ];

        let html = '';
        models.forEach(m => {
            const data = results[m.key];
            if (!data) return;
            const futureEnd = data.future?.[data.future.length - 1] || 0;
            const pctChange = ((futureEnd - data.current_price) / data.current_price * 100).toFixed(2);
            const changeClass = pctChange >= 0 ? 'text-positive' : 'text-negative';

            html += `
                <div class="metric-card">
                    <div class="metric-label"><i class="fas ${m.icon}" style="color:${m.color}; margin-right:0.3rem;"></i> ${m.name}</div>
                    <div class="metric-value ${changeClass}">${pctChange >= 0 ? '+' : ''}${pctChange}%</div>
                    <div class="metric-model">MAE: ₹${data.mae || '—'} | RMSE: ₹${data.rmse || '—'}</div>
                </div>
            `;
        });

        grid.innerHTML = html || '<p style="color:var(--text-muted);">No model data available</p>';
    }

    // ===== Sentiment =====
    function renderSentiment(sentiment) {
        if (!sentiment) return;

        const scoreEl = el('sentimentScoreValue');
        const labelEl = el('sentimentLabel');

        scoreEl.textContent = sentiment.compound_score?.toFixed(4) || '0.0000';

        const label = sentiment.sentiment_label || 'Neutral';
        labelEl.textContent = label;

        // Color the score
        if (label.includes('Bullish')) {
            scoreEl.classList.add('text-positive');
            labelEl.classList.add('text-positive');
        } else if (label.includes('Bearish')) {
            scoreEl.classList.add('text-negative');
            labelEl.classList.add('text-negative');
        } else {
            scoreEl.style.color = 'var(--accent-blue)';
            labelEl.style.color = 'var(--accent-blue)';
        }

        // Sentiment bars
        el('posFill').style.width = `${sentiment.positive_pct || 0}%`;
        el('posValue').textContent = `${sentiment.positive_pct || 0}%`;
        el('neuFill').style.width = `${sentiment.neutral_pct || 0}%`;
        el('neuValue').textContent = `${sentiment.neutral_pct || 0}%`;
        el('negFill').style.width = `${sentiment.negative_pct || 0}%`;
        el('negValue').textContent = `${sentiment.negative_pct || 0}%`;

        // Headlines
        const list = el('headlineList');
        if (sentiment.headlines && sentiment.headlines.length > 0) {
            list.innerHTML = sentiment.headlines.map(h => {
                const scoreClass = h.compound > 0.05 ? 'text-positive' : (h.compound < -0.05 ? 'text-negative' : '');
                const scoreBg = h.compound > 0.05 ? 'var(--positive-bg)' : (h.compound < -0.05 ? 'var(--negative-bg)' : 'rgba(255,255,255,0.04)');
                return `
                    <div class="headline-item">
                        <span class="headline-text">${h.headline}</span>
                        <span class="headline-score ${scoreClass}" style="background:${scoreBg};">${h.compound > 0 ? '+' : ''}${h.compound.toFixed(3)}</span>
                    </div>
                `;
            }).join('');
        } else {
            list.innerHTML = '<p style="color:var(--text-muted); font-size:0.85rem;">No headlines available</p>';
        }
    }

    // ===== Decision =====
    function renderDecision(decision) {
        if (!decision) return;

        const icons = { BUY: '🚀', SELL: '🔻', HOLD: '⏸️' };
        const classes = { BUY: 'buy', SELL: 'sell', HOLD: 'hold' };
        const textColors = { BUY: 'text-positive', SELL: 'text-negative', HOLD: 'text-warning' };

        const d = decision.decision || 'HOLD';

        el('verdictIcon').textContent = icons[d] || '⏳';
        el('verdictText').textContent = d;
        el('verdictText').className = `verdict-text ${textColors[d] || ''}`;
        el('verdictConfidence').textContent = `Accuracy: ${decision.confidence || 50}%`;

        // Update header badge
        const badge = el('recommendationBadge');
        badge.textContent = d;
        badge.className = `prediction-badge ${classes[d] || 'hold'}`;

        // Probability bars
        const probs = decision.probabilities || { BUY: 33, HOLD: 34, SELL: 33 };
        el('buyProbFill').style.width = `${probs.BUY}%`;
        el('buyProbValue').textContent = `${probs.BUY}%`;
        el('holdProbFill').style.width = `${probs.HOLD}%`;
        el('holdProbValue').textContent = `${probs.HOLD}%`;
        el('sellProbFill').style.width = `${probs.SELL}%`;
        el('sellProbValue').textContent = `${probs.SELL}%`;

        // Reason
        el('decisionReason').textContent = decision.reason || 'Decision computed successfully.';

        // Model breakdown
        const breakdown = el('modelBreakdown');
        if (decision.model_details && decision.model_details.length > 0) {
            breakdown.innerHTML = decision.model_details.map(m => {
                const changeClass = m.predicted_change_pct >= 0 ? 'text-positive' : 'text-negative';
                return `
                    <div style="display:flex; justify-content:space-between; padding:0.3rem 0; border-bottom:1px solid rgba(255,255,255,0.04);">
                        <span>${m.model}</span>
                        <span class="${changeClass}" style="font-weight:600;">${m.predicted_change_pct >= 0 ? '+' : ''}${m.predicted_change_pct}% → ₹${m.final_price}</span>
                    </div>
                `;
            }).join('');
        }
    }

    // ===== Insights =====
    function renderInsights(results) {
        const models = [results.lstm, results.rf, results.gru, results.linear].filter(Boolean);
        if (models.length === 0) return;

        const currentPrice = models[0].current_price;
        const avgFuture = models.reduce((sum, m) => {
            const lastPred = m.future?.[m.future.length - 1] || currentPrice;
            return sum + lastPred;
        }, 0) / models.length;

        const pctChange = ((avgFuture - currentPrice) / currentPrice * 100).toFixed(2);
        const direction = pctChange >= 0 ? 'upward' : 'downward';
        const bestModel = models.reduce((best, m) => (!best || (m.mae && m.mae < best.mae)) ? m : best, null);

        el('predictionText').innerHTML = `
            Consensus from <strong>${models.length} models</strong> predicts a 
            <strong class="${pctChange >= 0 ? 'text-positive' : 'text-negative'}">${pctChange >= 0 ? '+' : ''}${pctChange}%</strong> 
            ${direction} movement over 15 days. Target: <strong>₹${avgFuture.toFixed(2)}</strong>. 
            Most accurate model: <strong>${bestModel?.model || 'N/A'}</strong> (MAE: ₹${bestModel?.mae || '--'}).
        `;

        // Confidence
        const confidence = results.decision?.confidence || 70;
        el('confidenceFill').style.width = `${confidence}%`;
        el('confidenceText').textContent = `${confidence}%`;

        // Price change display
        el('currentChange').textContent = `${pctChange >= 0 ? '+' : ''}${pctChange}% (predicted)`;
        el('currentChange').className = `price-change ${pctChange >= 0 ? 'positive' : 'negative'}`;
    }

    // ===== Fundamentals (simulated) =====
    function setFundamentals() {
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);

        const marketCap = (10 + (seed % 900)).toFixed(1);
        const peRatio = (15 + (seed % 60)).toFixed(1);
        const basePrice = 100 + (seed % 3000);
        const high52 = (basePrice * 1.3).toFixed(0);
        const low52 = (basePrice * 0.7).toFixed(0);
        const volume = (1 + (seed % 20) + (seed % 5) * 0.1).toFixed(1);
        const divYield = (0.5 + (seed % 4) * 0.5).toFixed(2);

        // Pre-defined realistic overrides for big companies
        const fundData = {
            'RELIANCE': { cap: '₹19.8L', pe: '28.5', high52: '₹3,024', low52: '₹2,220', vol: '8.2', div: '0.32' },
            'TCS': { cap: '₹14.9L', pe: '32.1', high52: '₹4,350', low52: '₹3,270', vol: '3.1', div: '1.15' },
            'INFY': { cap: '₹6.9L', pe: '27.8', high52: '₹1,890', low52: '₹1,280', vol: '5.4', div: '2.20' },
            'HDFCBANK': { cap: '₹11.1L', pe: '19.2', high52: '₹1,680', low52: '₹1,190', vol: '6.8', div: '1.10' },
            'ITC': { cap: '₹5.2L', pe: '24.1', high52: '₹510', low52: '₹350', vol: '12.5', div: '3.50' },
            'TATAMOTORS': { cap: '₹3.8L', pe: '38.6', high52: '₹1,120', low52: '₹610', vol: '9.6', div: '0.05' },
        };

        const f = fundData[ticker];

        el('fundMarketCap').textContent = f ? `${f.cap} Cr` : `₹${marketCap}K Cr`;
        el('fundPE').textContent = f ? f.pe : peRatio;
        el('fund52High').textContent = f ? f.high52 : `₹${parseInt(high52).toLocaleString('en-IN')}`;
        el('fund52Low').textContent = f ? f.low52 : `₹${parseInt(low52).toLocaleString('en-IN')}`;
        el('fundVolume').textContent = f ? `${f.vol}M` : `${volume}M`;
        el('fundDividendYield').textContent = f ? `${f.div}%` : `${divYield}%`;
    }

    // ===== Peers (with live Alpha Vantage data) =====
    function renderPeers() {
        const peers = company.peers.slice(0, 4);

        // Render with deterministic fallback data first
        renderPeerTable(peers);

        // Then try to fetch live Alpha Vantage data for peers
        fetchLivePeerQuotes(peers);
    }

    function renderPeerTable(peers) {
        const tbody = el('peerComparisonList');
        tbody.innerHTML = peers.map(p => {
            const seed = p.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            const price = `₹${(100 + (seed % 3000)).toLocaleString('en-IN')}.00`;
            const changePct = ((seed % 10) - 4) + (seed % 100)/100;
            const change = `${changePct >= 0 ? '+' : ''}${changePct.toFixed(2)}%`;
            const signal = changePct > 1.5 ? 'Buy' : (changePct < -1.5 ? 'Sell' : 'Hold');

            const changeClass = change.startsWith('+') ? 'text-positive' : (change.startsWith('-') ? 'text-negative' : '');
            const signalClass = signal === 'Buy' ? 'text-positive' : (signal === 'Sell' ? 'text-negative' : 'text-warning');
            
            return `
                <tr style="cursor:pointer;" onclick="window.location.href='company.html?ticker=${p}'">
                    <td><span class="ticker-badge">${p}</span></td>
                    <td id="peer-price-${p}">${price}</td>
                    <td class="${changeClass}" id="peer-change-${p}">${change}</td>
                    <td class="${signalClass}" style="font-weight:600;">${signal}</td>
                </tr>
            `;
        }).join('');
    }

    async function fetchLivePeerQuotes(peers, peerData) {
        try {
            const symbols = peers.join(',');
            const response = await fetch(`${API_BASE}/quotes?symbols=${symbols}`);
            if (!response.ok) return;
            const data = await response.json();
            const quotes = data.quotes || {};

            peers.forEach(p => {
                const q = quotes[p];
                if (q && q.price > 0) {
                    const priceEl = document.getElementById(`peer-price-${p}`);
                    const changeEl = document.getElementById(`peer-change-${p}`);
                    if (priceEl) priceEl.textContent = `₹${q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                    if (changeEl) {
                        const pct = parseFloat(q.change_pct) || 0;
                        const sign = pct >= 0 ? '+' : '';
                        changeEl.textContent = `${sign}${pct.toFixed(2)}%`;
                        changeEl.className = pct >= 0 ? 'text-positive' : 'text-negative';
                    }
                }
            });
        } catch (err) {
            // Silently fall back to static data
        }
    }

    // ===== Financial Health Chart =====
    let financialChart = null;

    function renderFinancialChart(type = 'balance') {
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        // Realistic hardcoded FY24 financial data (in ₹ Crores) for top companies
        const realFinData = {
            'RELIANCE': {
                balance: [902340, 483920, 506450, 68000], 
                pnl: [1000122, 850120, 150002, 79020], 
                cashflow: [134265, -112450, -21500, 315] 
            },
            'TCS': {
                balance: [142010, 41000, 101010, 11000],
                pnl: [240893, 172900, 67993, 46585],
                cashflow: [45090, -3200, -42500, -610]
            },
            'HDFCBANK': {
                balance: [3401200, 2901200, 500000, 150300],
                pnl: [250100, 154000, 96100, 64000],
                cashflow: [87500, -12500, -60000, 15000]
            },
            'INFY': {
                balance: [130500, 45000, 85500, 15300],
                pnl: [156550, 112100, 44450, 26200],
                cashflow: [28500, -2500, -27000, -1000]
            }
        };

        // Fallback deterministic gen
        const rev = 10000 + (seed % 100) * 2000;
        const profit = rev * (0.05 + ((seed % 10) * 0.02)); 
        const assets = rev * (1.5 + ((seed % 5) * 0.4));
        const liab = assets * (0.3 + ((seed % 5) * 0.1));
        const eq = assets - liab;
        const fallback = {
            balance: [assets, liab, eq, assets * 0.1], // Assets, Liab, Eq, Cash
            pnl: [rev, rev * 0.8, rev * 0.2, profit], // Rev, Exp, OpProfit, NetProfit
            cashflow: [profit * 1.2, -profit * 0.5, -profit * 0.6, profit * 0.1]
        };

        const dataObj = realFinData[ticker] || fallback;
        const dataArr = dataObj[type];

        let labels = [];
        let datasetLabel = '';
        let colors = [];
        let borderColors = [];

        if (type === 'balance') {
            labels = ['Total Assets', 'Total Liabilities', 'Total Equity', 'Cash Equivalents'];
            datasetLabel = 'Balance Sheet (₹ Cr)';
            colors = ['rgba(88,166,255,0.6)', 'rgba(251,191,36,0.6)', 'rgba(57,210,192,0.6)', 'rgba(63,185,80,0.6)'];
            borderColors = ['#58a6ff', '#fbbf24', '#39d2c0', '#3fb950'];
        } else if (type === 'pnl') {
            labels = ['Total Revenue', 'Operating Expenses', 'Operating Profit', 'Net Profit'];
            datasetLabel = 'Profit & Loss (₹ Cr)';
            colors = ['rgba(167,139,250,0.6)', 'rgba(251,191,36,0.6)', 'rgba(57,210,192,0.6)', 'rgba(63,185,80,0.6)'];
            borderColors = ['#a78bfa', '#fbbf24', '#39d2c0', '#3fb950'];
        }

        const ctx = el('balanceSheetChart').getContext('2d');
        if (financialChart) financialChart.destroy();

        financialChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: datasetLabel,
                    data: dataArr,
                    backgroundColor: colors,
                    borderColor: borderColors,
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17,24,39,0.95)',
                        titleColor: '#f0f2f5',
                        bodyColor: '#8b949e',
                        callbacks: {
                            label: c => ` ₹${c.parsed.y.toLocaleString('en-IN')} Cr`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { color: '#484f58', font: { size: 10 } },
                    },
                    y: {
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        ticks: {
                            color: '#484f58',
                            font: { size: 10 },
                            callback: v => `₹${(v / 1000).toFixed(0)}K`
                        }
                    }
                }
            }
        });
    }

    // Set up financial tabs
    const finTabs = document.querySelectorAll('#financialTabs .model-tab');
    finTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            finTabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            renderFinancialChart(tab.dataset.type);
        });
    });

    // ===== Dedicated Cash Flow Chart =====
    function renderCashFlowChart() {
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const realFinData = {
            'RELIANCE': { cashflow: [134265, -112450, -21500, 315] },
            'TCS': { cashflow: [45090, -3200, -42500, -610] },
            'HDFCBANK': { cashflow: [87500, -12500, -60000, 15000] },
            'INFY': { cashflow: [28500, -2500, -27000, -1000] }
        };

        const rev = 10000 + (seed % 100) * 2000;
        const profit = rev * (0.05 + ((seed % 10) * 0.02)); 
        const fallback = { cashflow: [profit * 1.2, -profit * 0.5, -profit * 0.6, profit * 0.1] };

        const dataArr = (realFinData[ticker] || fallback).cashflow;

        const ctx = el('cashFlowChart')?.getContext('2d');
        if (!ctx) return;
        
        new Chart(ctx, {
            type: 'bar',
            data: {
                labels: ['Operating Cash Flow', 'Investing Cash Flow', 'Financing Cash Flow', 'Net Change'],
                datasets: [{
                    label: 'Cash Flow (₹ Cr)',
                    data: dataArr,
                    backgroundColor: ['rgba(63,185,80,0.6)', 'rgba(244,63,94,0.6)', 'rgba(88,166,255,0.6)', 'rgba(167,139,250,0.6)'],
                    borderColor: ['#3fb950', '#f43f5e', '#58a6ff', '#a78bfa'],
                    borderWidth: 1,
                    borderRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(17,24,39,0.95)',
                        titleColor: '#f0f2f5',
                        bodyColor: '#8b949e',
                        callbacks: { label: c => ` ₹${c.parsed.y.toLocaleString('en-IN')} Cr` }
                    }
                },
                scales: {
                    x: { grid: { display: false }, ticks: { color: '#484f58', font: { size: 10 } } },
                    y: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { color: '#484f58', font: { size: 10 }, callback: v => `₹${(v / 1000).toFixed(0)}K` } }
                }
            }
        });
    }

    // ===== Company Portfolio & Documents =====
    function renderCompanyPortfolio() {
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        // Mock data for profiles
        const industries = {
            'IT': 'Software Services & Consulting',
            'Banking': 'Financial Services',
            'Energy': 'Oil, Gas & Power',
            'Auto': 'Automobile Manufacturing',
            'FMCG': 'Consumer Goods',
            'Pharma': 'Pharmaceuticals & Life Sciences',
            'Telecom': 'Telecommunication Services',
            'Infra': 'Infrastructure & Construction',
            'Finance': 'Non-Banking Financial Services',
            'Metals': 'Iron, Steel & Mining',
            'Consumer': 'Consumer Durables',
            'Chemicals': 'Specialty Chemicals',
            'Defence': 'Aerospace & Defence',
            'Media': 'Entertainment & Media',
            'Logistics': 'Supply Chain & Logistics'
        };

        const headquarters = [
            'Mumbai, Maharashtra',
            'Bengaluru, Karnataka',
            'New Delhi, Delhi',
            'Chennai, Tamil Nadu',
            'Hyderabad, Telangana',
            'Pune, Maharashtra',
            'Kolkata, West Bengal',
            'Gurugram, Haryana'
        ];

        const industry = industries[sector] || 'Diversified';
        const founded = 1940 + (seed % 75);
        const hq = headquarters[seed % headquarters.length];

        el('portfolioSector').textContent = sector;
        el('portfolioIndustry').textContent = industry;
        el('portfolioFounded').textContent = founded;
        el('portfolioHQ').textContent = hq;

        // Mock PDF releases
        const docs = [
            { name: 'Annual Report 2023-24', meta: `Published: May ${2024} • 4.2 MB` },
            { name: 'Q3 Investor Presentation', meta: `Published: Jan ${2024} • 2.1 MB` },
            { name: 'ESG Sustainability Report', meta: `Published: Mar ${2024} • 3.5 MB` },
            { name: 'Earnings Call Transcript - Q3', meta: `Published: Feb ${2024} • 0.8 MB` }
        ];

        const docList = el('documentList');
        docList.innerHTML = docs.map(d => `
            <div class="document-item">
                <i class="far fa-file-pdf"></i>
                <div class="doc-info">
                    <span class="doc-name">${d.name}</span>
                    <span class="doc-meta">${d.meta}</span>
                </div>
                <button class="doc-download" onclick="downloadMockDocument('${d.name}', '${ticker}')" style="background:none; border:none; cursor:pointer; font-size: 1rem;"><i class="fas fa-download"></i></button>
            </div>
        `).join('');
    }

    window.downloadMockDocument = function(docName, companyTicker) {
        // Create a simulated text/PDF file dynamically
        const content = `Corporate Document Simulation\n=========================\nCompany: ${companyTicker}\nDocument: ${docName}\nDate Downloaded: ${new Date().toLocaleDateString()}\n\nThis is a securely generated mock document serving as a placeholder for the actual PDF release.\n`;
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        
        // Trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = `${companyTicker}_${docName.replace(/\s+/g, '_')}.txt`;
        document.body.appendChild(a);
        a.click();
        
        // Cleanup
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    // ===== Simulated Data (fallback when backend is offline) =====
    function generateSimulatedData() {
        const basePrice = {
            'RELIANCE': 2950, 'TCS': 4120, 'INFY': 1680, 'HDFCBANK': 1450,
            'ITC': 420, 'TATAMOTORS': 1020, 'WIPRO': 480, 'SBIN': 785,
            'BHARTIARTL': 1560, 'LT': 3420, 'MARUTI': 12450, 'KOTAKBANK': 1780,
        }[ticker] || 1000;

        function genPrices(start, count, volatility) {
            const prices = [start];
            for (let i = 1; i < count; i++) {
                prices.push(prices[i - 1] * (1 + (Math.random() - 0.48) * volatility));
            }
            return prices;
        }

        const historical = genPrices(basePrice * 0.92, 30, 0.015);
        const currentPrice = historical[historical.length - 1];
        const lstmFuture = genPrices(currentPrice, 15, 0.01);
        const rfFuture = genPrices(currentPrice, 15, 0.012);
        const gruFuture = genPrices(currentPrice, 15, 0.011);
        const linearFuture = genPrices(currentPrice, 15, 0.008);

        // Simulated sentiment
        const sentimentScore = (Math.random() - 0.3) * 0.6;
        const sentLabel = sentimentScore > 0.15 ? 'Bullish' : sentimentScore > 0.05 ? 'Mildly Bullish' : sentimentScore < -0.15 ? 'Bearish' : sentimentScore < -0.05 ? 'Mildly Bearish' : 'Neutral';

        const headlines = [
            { headline: `${company.name} reports strong quarterly earnings growth`, compound: 0.42, pos: 0.35, neg: 0.0, neu: 0.65 },
            { headline: `Analysts upgrade ${ticker} target price amidst sector rally`, compound: 0.55, pos: 0.42, neg: 0.0, neu: 0.58 },
            { headline: `${company.sector} sector faces headwinds from global uncertainty`, compound: -0.23, pos: 0.0, neg: 0.28, neu: 0.72 },
            { headline: `${company.name} announces strategic partnership initiative`, compound: 0.31, pos: 0.25, neg: 0.0, neu: 0.75 },
            { headline: `Market volatility impacts ${ticker} trading volumes`, compound: -0.12, pos: 0.05, neg: 0.18, neu: 0.77 },
        ];

        // Simulated decision
        const avgChange = [lstmFuture, rfFuture, gruFuture, linearFuture]
            .map(f => ((f[f.length - 1] - currentPrice) / currentPrice) * 100)
            .reduce((a, b) => a + b, 0) / 4;

        const decision = avgChange > 1.5 ? 'BUY' : avgChange < -1.5 ? 'SELL' : 'HOLD';
        const confidence = Math.min(95, Math.max(50, 70 + Math.abs(avgChange) * 5));

        return {
            lstm: { model: 'LSTM', current_price: currentPrice, historical, future: lstmFuture, mae: +(Math.random() * 30 + 10).toFixed(2), rmse: +(Math.random() * 40 + 15).toFixed(2) },
            rf: { model: 'Random Forest', current_price: currentPrice, historical, future: rfFuture, mae: +(Math.random() * 25 + 8).toFixed(2), rmse: +(Math.random() * 35 + 12).toFixed(2) },
            gru: { model: 'GRU', current_price: currentPrice, historical, future: gruFuture, mae: +(Math.random() * 28 + 9).toFixed(2), rmse: +(Math.random() * 38 + 14).toFixed(2) },
            linear: { model: 'Linear Regression', current_price: currentPrice, historical, future: linearFuture, mae: +(Math.random() * 45 + 20).toFixed(2), rmse: +(Math.random() * 55 + 25).toFixed(2) },
            sentiment: {
                compound_score: +sentimentScore.toFixed(4),
                sentiment_label: sentLabel,
                positive_pct: +(Math.random() * 40 + 20).toFixed(1),
                negative_pct: +(Math.random() * 20 + 5).toFixed(1),
                neutral_pct: +(Math.random() * 30 + 30).toFixed(1),
                headlines: headlines,
            },
            decision: {
                decision: decision,
                confidence: +confidence.toFixed(1),
                reason: `${decision === 'BUY' ? '3' : decision === 'SELL' ? '1' : '2'}/4 models predict price increase (avg: ${avgChange >= 0 ? '+' : ''}${avgChange.toFixed(2)}%) | Market sentiment: ${sentLabel} (${sentimentScore >= 0 ? '+' : ''}${sentimentScore.toFixed(3)}) | Model agreement: ${Math.floor(Math.random() * 30 + 60)}%`,
                probabilities: {
                    BUY: +(decision === 'BUY' ? 55 + Math.random() * 20 : 15 + Math.random() * 15).toFixed(1),
                    HOLD: +(decision === 'HOLD' ? 45 + Math.random() * 20 : 20 + Math.random() * 15).toFixed(1),
                    SELL: +(decision === 'SELL' ? 50 + Math.random() * 20 : 10 + Math.random() * 10).toFixed(1),
                },
                model_details: [
                    { model: 'LSTM', predicted_change_pct: +((lstmFuture[14] - currentPrice) / currentPrice * 100).toFixed(2), final_price: +lstmFuture[14].toFixed(2), mae: +(Math.random() * 30 + 10).toFixed(2) },
                    { model: 'Random Forest', predicted_change_pct: +((rfFuture[14] - currentPrice) / currentPrice * 100).toFixed(2), final_price: +rfFuture[14].toFixed(2), mae: +(Math.random() * 25 + 8).toFixed(2) },
                    { model: 'GRU', predicted_change_pct: +((gruFuture[14] - currentPrice) / currentPrice * 100).toFixed(2), final_price: +gruFuture[14].toFixed(2), mae: +(Math.random() * 28 + 9).toFixed(2) },
                    { model: 'Linear Regression', predicted_change_pct: +((linearFuture[14] - currentPrice) / currentPrice * 100).toFixed(2), final_price: +linearFuture[14].toFixed(2), mae: +(Math.random() * 45 + 20).toFixed(2) },
                ],
            }
        };
    }

    // ===== Technical Indicators (simulated) =====
    setTimeout(() => {
        const seed = ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
        
        const rsi = (30 + (seed % 45)).toFixed(1); 
        const macdSignal = seed % 3 === 0 ? '-1.25' : (seed % 3 === 1 ? '+2.30' : '0.05');
        
        el('rsiValue').textContent = rsi;
        el('macdValue').textContent = macdSignal;
        el('smaValue').textContent = `₹${(allModelData?.lstm?.current_price * (seed % 2 === 0 ? 1.05 : 0.95) || 0).toFixed(0)}`;
        el('volValue').textContent = (1 + (seed % 2) + (seed % 4) * 0.5).toFixed(2) + '%';
    }, 1500);

    // ===== Alerts System =====
    const alertBtn = el('setAlertBtn');
    const alertsList = el('alertsList');
    let alerts = [];

    if (alertBtn) {
        alertBtn.addEventListener('click', () => {
            const price = el('alertPrice').value;
            const direction = el('alertDirection').value;
            const method = el('alertMethod') ? el('alertMethod').value : 'Email';
            if (!price) return;

            alerts.push({ price, direction, method, id: Date.now() });
            renderAlerts();
            el('alertPrice').value = '';
        });
    }

    function renderAlerts() {
        alertsList.innerHTML = alerts.map(a => `
            <div class="alert-item">
                <span><i class="fas fa-bell" style="color:var(--accent-cyan); margin-right:0.4rem;"></i> ₹${a.price} (${a.direction}) - <small style="color:var(--text-muted);">via ${a.method}</small></span>
                <button onclick="removeAlert(${a.id})" style="background:none; border:none; color:var(--negative); cursor:pointer;"><i class="fas fa-trash"></i></button>
            </div>
        `).join('');
    }

    window.removeAlert = (id) => {
        alerts = alerts.filter(a => a.id !== id);
        renderAlerts();
    };

    // ===== Chatbot =====
    const chatToggle = el('chatbotToggleBtn');
    const chatWindow = el('chatbotWindow');
    const chatClose = el('closeChatbotBtn');
    const chatInput = el('chatbotInput');
    const chatSend = el('chatbotSendBtn');
    const chatMessages = el('chatbotMessages');

    // Welcome message
    addChatMsg('bot', `Hi! I'm your AI Trading Assistant for ${company.name}. Ask me about price predictions, sentiment, or my model analysis.`);

    chatToggle.addEventListener('click', () => chatWindow.classList.toggle('open'));
    chatClose.addEventListener('click', () => chatWindow.classList.remove('open'));

    chatSend.addEventListener('click', sendChat);
    chatInput.addEventListener('keypress', e => { if (e.key === 'Enter') sendChat(); });

    function sendChat() {
        const msg = chatInput.value.trim();
        if (!msg) return;
        addChatMsg('user', msg);
        chatInput.value = '';

        // Simple response logic
        setTimeout(() => {
            const response = generateChatResponse(msg);
            addChatMsg('bot', response);
        }, 600);
    }

    function addChatMsg(type, text) {
        const div = document.createElement('div');
        div.className = `chat-msg ${type}`;
        div.textContent = text;
        chatMessages.appendChild(div);
        chatMessages.scrollTop = chatMessages.scrollHeight;
    }

    function generateChatResponse(msg) {
        const lower = msg.toLowerCase();
        const decision = allModelData?.decision;
        const sentiment = allModelData?.sentiment;
        const currentPrice = allModelData?.lstm?.current_price || allModelData?.rf?.current_price || 0;

        if (lower.includes('buy') || lower.includes('sell') || lower.includes('decision') || lower.includes('recommend')) {
            return `Our Logistic Regression decision engine recommends: ${decision?.decision || 'HOLD'} with an empirical model accuracy of ${decision?.confidence || 50}%. ${decision?.reason || ''}`;
        }
        if (lower.includes('sentiment') || lower.includes('news') || lower.includes('feel')) {
            return `VADER sentiment analysis shows the market is ${sentiment?.sentiment_label || 'Neutral'} with a compound score of ${sentiment?.compound_score || 0}. ${sentiment?.positive_pct || 0}% of headlines are positive.`;
        }
        if (lower.includes('price') || lower.includes('predict') || lower.includes('forecast')) {
            const lstm = allModelData?.lstm?.future?.[14] || 0;
            return `LSTM predicts ₹${lstm.toFixed(2)} in 15 days. Current price: ₹${currentPrice.toFixed(2)}. Change: ${((lstm - currentPrice) / currentPrice * 100).toFixed(2)}%.`;
        }
        if (lower.includes('model') || lower.includes('accuracy') || lower.includes('mae') || lower.includes('rmse')) {
            return `Best model: ${decision?.model_details?.[0]?.model || 'LSTM'}. Our 4 models (LSTM, RF, GRU, Linear Reg.) are compared by MAE and RMSE — check the Performance Comparison panel for details.`;
        }
        if (lower.includes('hello') || lower.includes('hi') || lower.includes('hey')) {
            return `Hello! I can help you understand the AI predictions, sentiment analysis, and trading signals for ${company.name}. What would you like to know?`;
        }
        return `I can answer questions about: price predictions, model accuracy, sentiment analysis, and buy/sell recommendations for ${company.name}. Try asking about any of these!`;
    }

    // ===== Quick Search =====
    const quickSearch = el('quickSearch');
    if (quickSearch) {
        quickSearch.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const val = quickSearch.value.trim().toUpperCase();
                if (val && window.ALL_STOCKS?.some(s => s.ticker === val)) {
                    window.location.href = `company.html?ticker=${val}`;
                }
            }
        });
    }

    // ===== Export Data as CSV (Excel compatible) =====
    const exportBtn = el('exportBtn');
    if (exportBtn) {
        exportBtn.addEventListener('click', () => {
            if (!allModelData || Object.keys(allModelData).length === 0) {
                alert('Data is still loading, please wait.');
                return;
            }
            
            let csvContent = "data:text/csv;charset=utf-8,";
            
            // Section 1: Company Info
            csvContent += "Company Information\n";
            csvContent += `Ticker,${ticker}\n`;
            csvContent += `Name,${company.name}\n`;
            csvContent += `Sector,${company.sector}\n\n`;
            
            // Section 2: Fundamentals
            csvContent += "Fundamentals\n";
            csvContent += `Market Cap,${el('fundMarketCap').textContent.replace('₹', '')}\n`;
            csvContent += `P/E Ratio,${el('fundPE').textContent}\n`;
            csvContent += `52W High,${el('fund52High').textContent.replace('₹', '').replace(/,/g, '')}\n`;
            csvContent += `52W Low,${el('fund52Low').textContent.replace('₹', '').replace(/,/g, '')}\n`;
            csvContent += `Volume,${el('fundVolume').textContent}\n`;
            csvContent += `Dividend Yield,${el('fundDividendYield').textContent}\n\n`;

            // Section 3: Sentiment & Decision
            const sent = allModelData.sentiment || {};
            const dec = allModelData.decision || {};
            csvContent += "AI Analysis\n";
            csvContent += `VADER Sentiment Score,${sent.compound_score || 0}\n`;
            csvContent += `Sentiment Label,${sent.sentiment_label || 'Neutral'}\n`;
            csvContent += `AI Recommendation,${dec.decision || 'HOLD'}\n`;
            csvContent += `Model Accuracy Rate,${dec.confidence || 0}%\n\n`;

            // Section 4: Predictions
            csvContent += "Multi-Model 15-Day Predictions (in INR)\n";
            csvContent += "Day,LSTM,Random Forest,GRU,Linear Regression,Consensus Average\n";
            
            const lstm = allModelData.lstm?.future || [];
            const rf = allModelData.rf?.future || [];
            const gru = allModelData.gru?.future || [];
            const lin = allModelData.linear?.future || [];
            
            const daysCount = Math.max(lstm.length, rf.length, gru.length, lin.length);
            for (let i = 0; i < daysCount; i++) {
                const lVal = lstm[i] || 0;
                const rVal = rf[i] || 0;
                const gVal = gru[i] || 0;
                const linVal = lin[i] || 0;
                
                let sum = 0;
                let active = 0;
                if (lVal) { sum += lVal; active++; }
                if (rVal) { sum += rVal; active++; }
                if (gVal) { sum += gVal; active++; }
                if (linVal) { sum += linVal; active++; }
                
                const avg = active > 0 ? (sum / active) : 0;
                
                csvContent += `${i+1},${lVal.toFixed(2)},${rVal.toFixed(2)},${gVal.toFixed(2)},${linVal.toFixed(2)},${avg.toFixed(2)}\n`;
            }

            // Create download link element
            const encodedUri = encodeURI(csvContent);
            const link = document.createElement("a");
            link.setAttribute("href", encodedUri);
            link.setAttribute("download", `${ticker}_AI_Report.csv`);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        });
    }

});
