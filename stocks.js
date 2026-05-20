/**
 * StockPredictor AI — Stock Listing Page Controller
 * Displays all NSE/BSE listed Indian companies with search, filter, and sort.
 */

document.addEventListener('DOMContentLoaded', () => {

    const allStocks = window.ALL_STOCKS || [];

    // ===== State =====
    let currentSector = 'all';
    let currentSearch = '';
    let currentSort = 'name';

    // ===== Extract unique sectors =====
    const sectors = [...new Set(allStocks.map(s => s.sector))].sort();

    // ===== Initialize =====
    renderSectorFilters();
    renderStocks();
    updateStats();

    // ===== Render Sector Filters =====
    function renderSectorFilters() {
        const container = document.getElementById('sectorFilters');
        let html = '<button class="sector-btn active" data-sector="all">All</button>';
        sectors.forEach(s => {
            html += `<button class="sector-btn" data-sector="${s}">${s}</button>`;
        });
        container.innerHTML = html;

        // Click handlers
        container.querySelectorAll('.sector-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.sector-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                currentSector = btn.dataset.sector;
                renderStocks();
            });
        });
    }

    // ===== Filter & Sort =====
    function getFilteredStocks() {
        let filtered = [...allStocks];

        // Sector filter
        if (currentSector !== 'all') {
            filtered = filtered.filter(s => s.sector === currentSector);
        }

        // Search filter
        if (currentSearch) {
            const q = currentSearch.toLowerCase();
            filtered = filtered.filter(s =>
                s.ticker.toLowerCase().includes(q) ||
                s.name.toLowerCase().includes(q) ||
                s.sector.toLowerCase().includes(q)
            );
        }

        // Sort
        filtered.sort((a, b) => {
            switch (currentSort) {
                case 'name': return a.name.localeCompare(b.name);
                case 'name_desc': return b.name.localeCompare(a.name);
                case 'sector': return a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name);
                case 'ticker': return a.ticker.localeCompare(b.ticker);
                default: return 0;
            }
        });

        return filtered;
    }

    // ===== Render Stocks =====
    function renderStocks() {
        const grid = document.getElementById('stocksGrid');
        const emptyState = document.getElementById('emptyState');
        const filtered = getFilteredStocks();

        if (filtered.length === 0) {
            grid.style.display = 'none';
            emptyState.style.display = 'block';
        } else {
            grid.style.display = 'grid';
            emptyState.style.display = 'none';
        }

        // Results text
        const resultsText = document.getElementById('resultsText');
        if (currentSearch || currentSector !== 'all') {
            resultsText.textContent = `Showing ${filtered.length} of ${allStocks.length} companies`;
        } else {
            resultsText.textContent = `Showing all ${filtered.length} companies`;
        }

        // Sector colors
        const sectorColors = {
            'IT': '#58a6ff',
            'Banking': '#3fb950',
            'Energy': '#fbbf24',
            'Auto': '#39d2c0',
            'FMCG': '#a78bfa',
            'Pharma': '#f472b6',
            'Telecom': '#38bdf8',
            'Infra': '#fb923c',
            'Finance': '#34d399',
            'Metals': '#94a3b8',
            'Consumer': '#e879f9',
            'Chemicals': '#22d3ee',
            'Defence': '#ef4444',
            'Media': '#facc15',
            'Logistics': '#a3e635',
        };

        grid.innerHTML = filtered.map(stock => {
            const color = sectorColors[stock.sector] || '#58a6ff';
            
            // Generate some deterministic placeholder indicators based on ticker string
            const seed = stock.ticker.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
            
            // Technicals
            const rsi = (30 + (seed % 45)).toFixed(1); 
            const macdSignal = seed % 3 === 0 ? 'Bearish' : (seed % 3 === 1 ? 'Bullish' : 'Neutral');
            const macdClass = macdSignal === 'Bullish' ? 'text-positive' : (macdSignal === 'Bearish' ? 'text-negative' : 'text-warning');
            const trend = rsi > 60 ? 'text-warning' : (rsi < 40 ? 'text-positive' : '');
            const trendLabel = rsi > 60 ? 'Overbought' : (rsi < 40 ? 'Oversold' : 'Neutral');

            // Fundamentals
            const marketCap = (10 + (seed % 900)).toFixed(1); // in K Cr
            const peRatio = (15 + (seed % 60)).toFixed(1);
            const basePrice = 100 + (seed % 3000);
            const high52 = (basePrice * 1.3).toFixed(0);
            const low52 = (basePrice * 0.7).toFixed(0);
            const volume = (1 + (seed % 20) + (seed % 5) * 0.1).toFixed(1); // in M
            const divYield = (0.5 + (seed % 4) * 0.5).toFixed(2); // in %

            return `
                <a href="company.html?ticker=${stock.ticker}" class="stock-card" style="--card-accent: ${color};">
                    <div class="stock-card-header">
                        <span class="stock-ticker" style="background:${color}20; color:${color};">${stock.ticker}</span>
                        <span class="stock-sector">${stock.sector}</span>
                    </div>
                    <div class="stock-name" title="${stock.name}">${stock.name}</div>
                    
                    <div class="stock-fundamentals" style="font-size: 0.75rem; margin-top: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="color:var(--text-secondary);">Mkt Cap:</span>
                            <span style="font-weight:600;">₹${marketCap}K Cr</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="color:var(--text-secondary);">P/E:</span>
                            <span style="font-weight:600;">${peRatio}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="color:var(--text-secondary);">52W H/L:</span>
                            <span style="font-weight:600;">₹${high52} / ₹${low52}</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; border-bottom:1px solid rgba(255,255,255,0.05); padding-bottom:4px;">
                            <span style="color:var(--text-secondary);">Vol:</span>
                            <span style="font-weight:600;">${volume}M</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; grid-column: span 2;">
                            <span style="color:var(--text-secondary);">Div Yield:</span>
                            <span style="font-weight:600; color:var(--accent-blue);">${divYield}%</span>
                        </div>
                    </div>

                    <div class="stock-indicators" style="font-size: 0.8rem; margin: 12px 0; display: flex; justify-content: space-between; background: rgba(255,255,255,0.03); padding: 8px 12px; border-radius: 6px; border: 1px solid rgba(255,255,255,0.05);">
                        <div style="display:flex; flex-direction:column; align-items: flex-start;">
                            <span style="color:var(--text-secondary); font-size:0.7rem; text-transform:uppercase;">RSI (14d)</span>
                            <span style="font-weight:600;" class="${trend}">${rsi} <span style="font-size:0.7rem; font-weight:normal; opacity:0.8;">(${trendLabel})</span></span>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items: center; border-left: 1px solid rgba(255,255,255,0.1); border-right: 1px solid rgba(255,255,255,0.1); padding: 0 12px;">
                            <span style="color:var(--text-secondary); font-size:0.7rem; text-transform:uppercase;">MACD</span>
                            <span class="${macdClass}" style="font-weight:600;">${macdSignal}</span>
                        </div>
                        <div style="display:flex; flex-direction:column; align-items: flex-end;">
                            <span style="color:var(--text-secondary); font-size:0.7rem; text-transform:uppercase;">SMA (50d)</span>
                            <span style="font-weight:600;">${seed % 2 === 0 ? 'Above' : 'Below'}</span>
                        </div>
                    </div>

                    <div class="stock-meta">
                        <span class="stock-exchange"><i class="fas fa-circle" style="color:var(--positive); font-size: 0.6rem; vertical-align: middle;"></i> ${stock.exchange}</span>
                        <span class="stock-action">Analyze <i class="fas fa-arrow-right"></i></span>
                    </div>
                </a>
            `;
        }).join('');
    }

    // ===== Update Stats =====
    function updateStats() {
        document.getElementById('totalCount').textContent = allStocks.length;
        document.getElementById('sectorCount').textContent = sectors.length;
    }

    // ===== Search Input =====
    const searchInput = document.getElementById('searchInput');
    const navSearchInput = document.getElementById('navSearchInput');

    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.trim();
        renderStocks();
        // Sync nav search
        if (navSearchInput) navSearchInput.value = currentSearch;
    });

    if (navSearchInput) {
        navSearchInput.addEventListener('input', () => {
            currentSearch = navSearchInput.value.trim();
            searchInput.value = currentSearch;
            renderStocks();
        });
    }

    // ===== Sort =====
    const sortSelect = document.getElementById('sortSelect');
    sortSelect.addEventListener('change', () => {
        currentSort = sortSelect.value;
        renderStocks();
    });

    // ===== Clear Filters (global) =====
    window.clearFilters = () => {
        currentSearch = '';
        currentSector = 'all';
        searchInput.value = '';
        if (navSearchInput) navSearchInput.value = '';
        document.querySelectorAll('.sector-btn').forEach(b => b.classList.remove('active'));
        document.querySelector('.sector-btn[data-sector="all"]').classList.add('active');
        renderStocks();
    };

    // ===== Navbar scroll effect =====
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 30) {
                nav.style.background = 'rgba(10, 14, 23, 0.95)';
                nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
            } else {
                nav.style.background = 'rgba(10, 14, 23, 0.8)';
                nav.style.boxShadow = 'none';
            }
        }
    });
});
