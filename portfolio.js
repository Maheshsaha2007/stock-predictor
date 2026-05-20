/**
 * Full-universe portfolio: all companies in one sortable, filterable table
 * with optional batched live quotes from the Flask API.
 */

document.addEventListener('DOMContentLoaded', () => {
    const API_BASE = 'http://localhost:5000/api';
    const allStocks = window.ALL_STOCKS || [];
    const totalUniverse = allStocks.length;
    const equalWeightPct = totalUniverse ? (100 / totalUniverse) : 0;

    let currentSector = 'all';
    let currentSearch = '';
    let currentSort = 'ticker';
    let quotesLoading = false;
    const liveByTicker = {};

    const sectors = [...new Set(allStocks.map(s => s.sector))].sort();

    const el = (id) => document.getElementById(id);

    function getFiltered() {
        let list = [...allStocks];
        if (currentSector !== 'all') {
            list = list.filter((s) => s.sector === currentSector);
        }
        if (currentSearch) {
            const q = currentSearch.toLowerCase();
            list = list.filter(
                (s) =>
                    s.ticker.toLowerCase().includes(q) ||
                    s.name.toLowerCase().includes(q) ||
                    s.sector.toLowerCase().includes(q)
            );
        }
        list.sort((a, b) => {
            switch (currentSort) {
                case 'name':
                    return a.name.localeCompare(b.name);
                case 'name_desc':
                    return b.name.localeCompare(a.name);
                case 'sector':
                    return a.sector.localeCompare(b.sector) || a.name.localeCompare(b.name);
                case 'ticker_desc':
                    return b.ticker.localeCompare(a.ticker);
                case 'ticker':
                default:
                    return a.ticker.localeCompare(b.ticker);
            }
        });
        return list;
    }

    function renderSectorFilters() {
        const container = el('sectorFilters');
        let html = '<button class="sector-btn active" data-sector="all">All</button>';
        sectors.forEach((s) => {
            html += `<button class="sector-btn" data-sector="${s}">${s}</button>`;
        });
        container.innerHTML = html;
        container.querySelectorAll('.sector-btn').forEach((btn) => {
            btn.addEventListener('click', () => {
                container.querySelectorAll('.sector-btn').forEach((b) => b.classList.remove('active'));
                btn.classList.add('active');
                currentSector = btn.dataset.sector;
                renderTable();
            });
        });
    }

    function fmtPrice(n) {
        if (n == null || Number.isNaN(n)) return '—';
        return `₹${Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    function fmtPct(n) {
        if (n == null || Number.isNaN(n)) return '—';
        const sign = n >= 0 ? '+' : '';
        return `${sign}${Number(n).toFixed(2)}%`;
    }

    function renderTable() {
        const tbody = el('portfolioBody');
        const filtered = getFiltered();
        const resultsText = el('resultsText');

        if (currentSearch || currentSector !== 'all') {
            resultsText.textContent = `Showing ${filtered.length} of ${totalUniverse} companies`;
        } else {
            resultsText.textContent = `Showing all ${filtered.length} companies`;
        }

        const w = equalWeightPct.toFixed(2);
        tbody.innerHTML = filtered
            .map((s, i) => {
                const q = liveByTicker[s.ticker];
                const price = q && q.price > 0 ? q.price : null;
                const ch = q ? parseFloat(q.change_pct) : null;
                const chClass = ch == null || Number.isNaN(ch) ? '' : ch >= 0 ? 'change-pos' : 'change-neg';
                return `
                <tr data-ticker="${s.ticker}">
                    <td class="col-num">${i + 1}</td>
                    <td class="ticker-cell">${s.ticker}</td>
                    <td class="name-cell" title="${s.name.replace(/"/g, '&quot;')}">${s.name}</td>
                    <td><span class="sector-pill">${s.sector}</span></td>
                    <td>${s.exchange || 'NSE'}</td>
                    <td class="num">${w}%</td>
                    <td class="num price-cell">${price != null ? fmtPrice(price) : '—'}</td>
                    <td class="num change-cell ${chClass}">${ch != null && !Number.isNaN(ch) ? fmtPct(ch) : '—'}</td>
                    <td class="action-cell"><a href="company.html?ticker=${encodeURIComponent(s.ticker)}">Analyze</a></td>
                </tr>`;
            })
            .join('');
    }

    function updateRowFromQuote(ticker, quote) {
        const row = document.querySelector(`[data-ticker="${CSS.escape(String(ticker))}"]`);
        if (!row || !quote || !(quote.price > 0)) return;
        const p = row.querySelector('.price-cell');
        const c = row.querySelector('.change-cell');
        if (p) p.textContent = fmtPrice(quote.price);
        if (c) {
            const ch = parseFloat(quote.change_pct);
            c.className = 'num change-cell ';
            if (!Number.isNaN(ch)) {
                c.classList.add(ch >= 0 ? 'change-pos' : 'change-neg');
                c.textContent = fmtPct(ch);
            }
        }
    }

    async function loadLiveQuotesBatched() {
        if (!totalUniverse || quotesLoading) return;
        quotesLoading = true;
        const btn = el('refreshQuotesBtn');
        const prog = el('quoteProgress');
        btn.disabled = true;

        const tickers = allStocks.map((s) => s.ticker);
        const chunkSize = 5;
        let done = 0;

        for (let i = 0; i < tickers.length; i += chunkSize) {
            const chunk = tickers.slice(i, i + chunkSize);
            const sym = chunk.join(',');
            prog.innerHTML = `Fetching quotes… <strong>${Math.min(done + chunk.length, tickers.length)}</strong> / ${tickers.length}`;
            try {
                const res = await fetch(`${API_BASE}/quotes?symbols=${encodeURIComponent(sym)}`);
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
                const data = await res.json();
                const quotes = data.quotes || {};
                Object.keys(quotes).forEach((t) => {
                    liveByTicker[t] = quotes[t];
                    updateRowFromQuote(t, quotes[t]);
                });
            } catch (e) {
                prog.textContent = `Quote fetch stopped: ${e.message || e}. Is the backend running on port 5000?`;
                break;
            }
            done += chunk.length;
        }

        prog.innerHTML = `Last quote pass: <strong>${done}</strong> symbols requested (some may be blank if the data provider has no match).`;
        quotesLoading = false;
        btn.disabled = false;
    }

    el('totalCount').textContent = String(totalUniverse);
    el('weightEach').textContent = `${equalWeightPct.toFixed(2)}%`;

    renderSectorFilters();
    renderTable();

    const searchInput = el('searchInput');
    const navSearchInput = el('navSearchInput');

    searchInput.addEventListener('input', () => {
        currentSearch = searchInput.value.trim();
        if (navSearchInput) navSearchInput.value = currentSearch;
        renderTable();
    });
    if (navSearchInput) {
        navSearchInput.addEventListener('input', () => {
            currentSearch = navSearchInput.value.trim();
            searchInput.value = currentSearch;
            renderTable();
        });
    }

    el('sortSelect').addEventListener('change', () => {
        currentSort = el('sortSelect').value;
        renderTable();
    });

    el('refreshQuotesBtn').addEventListener('click', () => {
        loadLiveQuotesBatched();
    });

    window.addEventListener('scroll', () => {
        const nav = el('navbar');
        if (!nav) return;
        if (window.scrollY > 30) {
            nav.style.background = 'rgba(10, 14, 23, 0.95)';
            nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
        } else {
            nav.style.background = 'rgba(10, 14, 23, 0.8)';
            nav.style.boxShadow = 'none';
        }
    });
});
