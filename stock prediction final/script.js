document.addEventListener('DOMContentLoaded', () => {

    // ===== Configuration =====
    const API_BASE = 'http://localhost:5000/api';

    // ===== Company Data (fallback — overwritten by live Alpha Vantage data) =====
    const companies = [
        { ticker: 'RELIANCE', name: 'Reliance Industries', price: 2950.45, change: 1.2, sector: 'Energy', signal: 'Strong Buy' },
        { ticker: 'TCS', name: 'Tata Consultancy Services', price: 4120.30, change: 0.8, sector: 'IT', signal: 'Buy' },
        { ticker: 'INFY', name: 'Infosys', price: 1680.15, change: -0.5, sector: 'IT', signal: 'Hold' },
        { ticker: 'HDFCBANK', name: 'HDFC Bank', price: 1450.75, change: 0.3, sector: 'Banking', signal: 'Buy' },
        { ticker: 'ITC', name: 'ITC Limited', price: 420.30, change: 1.5, sector: 'FMCG', signal: 'Strong Buy' },
        { ticker: 'TATAMOTORS', name: 'Tata Motors', price: 1020.90, change: 3.4, sector: 'Auto', signal: 'Strong Buy' },
        { ticker: 'WIPRO', name: 'Wipro', price: 480.20, change: -1.2, sector: 'IT', signal: 'Sell' },
        { ticker: 'SBIN', name: 'State Bank of India', price: 785.60, change: 0.9, sector: 'Banking', signal: 'Buy' },
        { ticker: 'BHARTIARTL', name: 'Bharti Airtel', price: 1560.00, change: 2.1, sector: 'Telecom', signal: 'Buy' },
        { ticker: 'LT', name: 'Larsen & Toubro', price: 3420.50, change: 0.4, sector: 'Infra', signal: 'Hold' },
        { ticker: 'MARUTI', name: 'Maruti Suzuki', price: 12450.00, change: -0.3, sector: 'Auto', signal: 'Hold' },
        { ticker: 'KOTAKBANK', name: 'Kotak Mahindra Bank', price: 1780.55, change: 1.1, sector: 'Banking', signal: 'Buy' },
    ];

    // ===== Intersection Observer (defined early so renderCompanyGrid can use it) =====
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in');
                observer.unobserve(entry.target);
            }
        });
    }, { threshold: 0.1 });

    // ===== Render Company Grid =====
    function renderCompanyGrid(data) {
        const companyGrid = document.getElementById('companyGrid');
        if (!companyGrid) return;

        companyGrid.innerHTML = data.map(c => {
            const changeSign = c.change >= 0 ? '+' : '';
            const changeClass = c.change >= 0 ? 'positive' : 'negative';
            const iconClass = c.change >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            const signalClass = c.signal.includes('Buy') ? 'text-positive' : (c.signal === 'Sell' ? 'text-negative' : 'text-warning');

            return `
                <div class="company-card" id="card-${c.ticker}" onclick="window.location.href='company.html?ticker=${c.ticker}'">
                    <div class="card-header-mini">
                        <span class="ticker-badge">${c.ticker}</span>
                        <span class="sector-tag">${c.sector}</span>
                    </div>
                    <h3>${c.name}</h3>
                    <div class="price-row">
                        <span class="price" id="price-${c.ticker}">₹${c.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                        <span class="change ${changeClass}" id="change-${c.ticker}">${changeSign}${c.change}% <i class="fas ${iconClass}"></i></span>
                    </div>
                    <div class="card-footer-mini">
                        <span>AI Signal: <strong class="${signalClass}">${c.signal}</strong></span>
                    </div>
                </div>
            `;
        }).join('');

        // Re-observe for animations
        document.querySelectorAll('.company-card').forEach(el => observer.observe(el));
    }

    // Render immediately with fallback data
    renderCompanyGrid(companies);

    // ===== Fetch Live Prices from Alpha Vantage =====
    async function fetchLivePrices() {
        try {
            const symbols = companies.map(c => c.ticker).join(',');
            const response = await fetch(`${API_BASE}/quotes?symbols=${symbols}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const data = await response.json();
            const quotes = data.quotes || {};

            // Update each company card with live data
            companies.forEach(c => {
                const liveQuote = quotes[c.ticker];
                if (liveQuote && liveQuote.price > 0) {
                    c.price = liveQuote.price;
                    c.change = parseFloat(liveQuote.change_pct) || c.change;

                    // Update DOM elements directly for smooth update
                    const priceEl = document.getElementById(`price-${c.ticker}`);
                    const changeEl = document.getElementById(`change-${c.ticker}`);

                    if (priceEl) {
                        priceEl.textContent = `₹${c.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                        // Flash animation
                        priceEl.style.transition = 'color 0.3s';
                        priceEl.style.color = c.change >= 0 ? '#3fb950' : '#f85149';
                        setTimeout(() => { priceEl.style.color = ''; }, 1500);
                    }
                    if (changeEl) {
                        const sign = c.change >= 0 ? '+' : '';
                        const cls = c.change >= 0 ? 'positive' : 'negative';
                        const icon = c.change >= 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
                        changeEl.className = `change ${cls}`;
                        changeEl.innerHTML = `${sign}${c.change.toFixed(2)}% <i class="fas ${icon}"></i>`;
                    }
                }
            });

            // Also update hero data with live prices
            updateHeroWithLive(quotes);

            console.log(`✅ Alpha Vantage: Updated ${Object.keys(quotes).length}/${companies.length} live quotes`);
        } catch (err) {
            console.warn('Alpha Vantage unavailable, using fallback prices:', err.message);
        }
    }

    // Fetch live prices on page load
    fetchLivePrices();

    // Refresh live prices every 60 seconds
    setInterval(fetchLivePrices, 60000);

    // ===== Hero Chart =====
    const heroCanvas = document.getElementById('heroChart');
    if (heroCanvas) {
        const ctx = heroCanvas.getContext('2d');
        const generatePrices = (start, count) => {
            let prices = [start];
            for (let i = 1; i < count; i++) {
                prices.push(prices[i - 1] + (Math.random() - 0.45) * 30);
            }
            return prices;
        };

        const historicalData = generatePrices(2700, 30);
        const futureData = generatePrices(historicalData[historicalData.length - 1], 15);
        const labels = [...Array(45).keys()].map(i => i < 30 ? `Day ${i + 1}` : `+${i - 29}`);

        const gradient = ctx.createLinearGradient(0, 0, 0, 180);
        gradient.addColorStop(0, 'rgba(88, 166, 255, 0.3)');
        gradient.addColorStop(1, 'rgba(88, 166, 255, 0.0)');

        new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Historical',
                        data: [...historicalData, ...Array(15).fill(null)],
                        borderColor: '#58a6ff',
                        backgroundColor: gradient,
                        borderWidth: 2,
                        fill: true,
                        tension: 0.4,
                        pointRadius: 0,
                    },
                    {
                        label: 'AI Prediction',
                        data: [...Array(30).fill(null), ...futureData],
                        borderColor: '#3fb950',
                        borderWidth: 2,
                        borderDash: [6, 3],
                        fill: false,
                        tension: 0.4,
                        pointRadius: 0,
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { display: false },
                    y: { display: false }
                },
                interaction: { intersect: false, mode: 'index' },
            }
        });
    }

    // ===== Hero Ticker Rotation =====
    let heroIdx = 0;
    const heroTickers = ['RELIANCE', 'TCS', 'ITC', 'TATAMOTORS', 'HDFCBANK'];
    // Fallback hero data — overwritten by live quotes when available
    const heroData = {
        'RELIANCE': { price: '₹2,950.45', change: '+1.20%', conf: '92%', signal: 'BUY' },
        'TCS': { price: '₹4,120.30', change: '+0.80%', conf: '88%', signal: 'BUY' },
        'ITC': { price: '₹420.30', change: '+1.50%', conf: '95%', signal: 'STRONG BUY' },
        'TATAMOTORS': { price: '₹1,020.90', change: '+3.40%', conf: '93%', signal: 'STRONG BUY' },
        'HDFCBANK': { price: '₹1,450.75', change: '+0.30%', conf: '72%', signal: 'HOLD' },
    };

    function updateHeroWithLive(quotes) {
        heroTickers.forEach(t => {
            const q = quotes[t];
            if (q && q.price > 0) {
                const sign = q.change >= 0 ? '+' : '';
                heroData[t].price = `₹${q.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;
                heroData[t].change = `${sign}${parseFloat(q.change_pct).toFixed(2)}%`;
            }
        });
    }

    setInterval(() => {
        heroIdx = (heroIdx + 1) % heroTickers.length;
        const t = heroTickers[heroIdx];
        const d = heroData[t];
        const el = (id) => document.getElementById(id);
        if (el('heroTicker')) el('heroTicker').textContent = t;
        if (el('heroPrice')) el('heroPrice').textContent = d.price;
        if (el('heroChange')) {
            const isPositive = d.change.startsWith('+');
            const trendIcon = isPositive ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down';
            el('heroChange').innerHTML = `${d.change} <i class="fas ${trendIcon}"></i>`;
            el('heroChange').className = isPositive ? 'price positive' : 'price negative';
        }
        if (el('heroConfidence')) el('heroConfidence').textContent = d.conf;
        if (el('heroSignal')) el('heroSignal').textContent = d.signal;
    }, 3500);

    // ===== Parallax =====
    document.addEventListener('mousemove', (e) => {
        const x = e.clientX / window.innerWidth;
        const y = e.clientY / window.innerHeight;
        document.body.style.setProperty('--mouse-x', `${x * 100}%`);
        document.body.style.setProperty('--mouse-y', `${y * 100}%`);
    });

    // Observe model & feature cards (company cards are observed by renderCompanyGrid)
    document.querySelectorAll('.model-card, .feature-card').forEach(el => {
        observer.observe(el);
    });

    // ===== Sign In Modal — Multi-Step Form =====
    const signInBtn = document.getElementById('signInBtn');
    const signInModal = document.getElementById('signInModal');
    const closeSignInBtn = document.getElementById('closeSignInBtn');
    const signInForm = document.getElementById('signInForm');
    const step1 = document.getElementById('formStep1');
    const step2 = document.getElementById('formStep2');
    const successScreen = document.getElementById('formSuccess');
    const goToStep2Btn = document.getElementById('goToStep2Btn');
    const backToStep1Btn = document.getElementById('backToStep1Btn');
    const modalProgress = document.getElementById('modalProgress');
    const modalStepLabel = document.getElementById('modalStepLabel');

    // Open/close modal
    if (signInBtn && signInModal) {
        signInBtn.addEventListener('click', () => {
            signInModal.style.display = 'flex';
        });
    }
    if (closeSignInBtn && signInModal) {
        closeSignInBtn.addEventListener('click', () => {
            signInModal.style.display = 'none';
        });
    }
    if (signInModal) {
        signInModal.addEventListener('click', (e) => {
            if (e.target === signInModal) signInModal.style.display = 'none';
        });
    }

    // Step 1 → Step 2: validate Step 1 fields first
    if (goToStep2Btn) {
        goToStep2Btn.addEventListener('click', () => {
            const name = document.getElementById('regFullName');
            const age = document.getElementById('regAge');
            const gender = document.getElementById('regGender');
            const dob = document.getElementById('regDob');
            const phone = document.getElementById('regPhone');
            const email = document.getElementById('regEmail');

            // Basic built-in validation check for required Step 1 fields
            const requiredFields = [name, age, gender, dob, phone, email];
            let valid = true;

            requiredFields.forEach(f => {
                if (!f.reportValidity()) {
                    valid = false;
                }
            });

            // Run one at a time — reportValidity focuses the first invalid field
            if (!name.value.trim()) { name.reportValidity(); return; }
            if (!age.value || age.value < 18) { age.reportValidity(); return; }
            if (!gender.value) { gender.reportValidity(); return; }
            if (!dob.value) { dob.reportValidity(); return; }
            if (!phone.value || phone.value.length !== 10) { phone.reportValidity(); return; }
            if (!email.value || !email.validity.valid) { email.reportValidity(); return; }

            // Transition to step 2
            step1.style.display = 'none';
            step2.style.display = 'block';
            modalProgress.style.width = '100%';
            modalStepLabel.textContent = 'Step 2 of 2 — Trading Preferences';
        });
    }

    // Back to Step 1
    if (backToStep1Btn) {
        backToStep1Btn.addEventListener('click', () => {
            step2.style.display = 'none';
            step1.style.display = 'block';
            modalProgress.style.width = '50%';
            modalStepLabel.textContent = 'Step 1 of 2 — Personal Information';
        });
    }

    // Sector chip toggle styling
    const sectorChips = document.querySelectorAll('#sectorChips label');
    sectorChips.forEach(chip => {
        chip.addEventListener('click', () => {
            setTimeout(() => {
                const cb = chip.querySelector('input[type="checkbox"]');
                if (cb.checked) {
                    chip.style.borderColor = 'var(--accent-blue)';
                    chip.style.background = 'rgba(88,166,255,0.12)';
                    chip.style.color = 'var(--accent-blue)';
                } else {
                    chip.style.borderColor = 'var(--border-color)';
                    chip.style.background = 'transparent';
                    chip.style.color = 'var(--text-secondary)';
                }
            });
        });
    });

    // Final form submit — collect all data
    if (signInForm) {
        signInForm.addEventListener('submit', (e) => {
            e.preventDefault();

            // Collect all form data
            const formData = {
                // Step 1 — Personal
                fullName: document.getElementById('regFullName').value.trim(),
                age: parseInt(document.getElementById('regAge').value),
                gender: document.getElementById('regGender').value,
                dob: document.getElementById('regDob').value,
                phone: '+91' + document.getElementById('regPhone').value.trim(),
                email: document.getElementById('regEmail').value.trim(),
                city: document.getElementById('regCity').value.trim() || null,
                occupation: document.getElementById('regOccupation').value || null,
                pan: document.getElementById('regPan').value.trim().toUpperCase() || null,
                // Step 2 — Trading
                broker: document.getElementById('regBroker').value,
                dematId: document.getElementById('regDemat').value.trim(),
                experience: document.getElementById('regExperience').value || null,
                riskTolerance: document.getElementById('regRisk').value || null,
                investmentBudget: document.getElementById('regInvestment').value || null,
                sectors: Array.from(document.querySelectorAll('input[name="sectors"]:checked')).map(cb => cb.value),
                termsAccepted: document.getElementById('regTerms').checked,
                // Metadata
                registeredAt: new Date().toISOString(),
            };

            // Log data (visible in browser console for development)
            console.log('📝 User Registration Data:', formData);

            // Store in localStorage for persistence
            localStorage.setItem('stockPredictor_user', JSON.stringify(formData));

            // Show success screen
            step2.style.display = 'none';
            successScreen.style.display = 'block';
            modalProgress.style.width = '100%';
            modalStepLabel.textContent = 'Registration Complete ✓';

            // Personalized welcome
            const welcomeEl = document.getElementById('welcomeUserName');
            if (welcomeEl) {
                welcomeEl.textContent = `Welcome, ${formData.fullName}!`;
            }

            // Update the Sign In button to show logged-in state
            if (signInBtn) {
                const firstName = formData.fullName.split(' ')[0];
                signInBtn.innerHTML = `<i class="fas fa-user-check" style="margin-right:0.3rem;"></i> ${firstName}`;
                signInBtn.style.color = 'var(--positive)';
                signInBtn.style.borderColor = 'var(--positive)';
            }
        });
    }

    // Restore user session on page load
    const savedUser = localStorage.getItem('stockPredictor_user');
    if (savedUser && signInBtn) {
        try {
            const user = JSON.parse(savedUser);
            const firstName = user.fullName.split(' ')[0];
            signInBtn.innerHTML = `<i class="fas fa-user-check" style="margin-right:0.3rem;"></i> ${firstName}`;
            signInBtn.style.color = 'var(--positive)';
            signInBtn.style.borderColor = 'var(--positive)';
        } catch (e) { /* skip */ }
    }

    // ===== Navbar scroll effect =====
    window.addEventListener('scroll', () => {
        const nav = document.getElementById('navbar');
        if (nav) {
            if (window.scrollY > 50) {
                nav.style.background = 'rgba(10, 14, 23, 0.95)';
                nav.style.boxShadow = '0 2px 20px rgba(0,0,0,0.3)';
            } else {
                nav.style.background = 'rgba(10, 14, 23, 0.8)';
                nav.style.boxShadow = 'none';
            }
        }
    });
});
