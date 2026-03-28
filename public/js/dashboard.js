// dashboard.js — Market overview cards with animated data

const growthColors = {
  'Very High': '#22d3a5',
  'High': '#60a5fa',
  'Medium': '#fbbf24',
  'Low': '#f87171',
};

const riskColors = {
  'Low': '#22d3a5',
  'Low-Medium': '#60a5fa',
  'Medium': '#fbbf24',
  'High': '#f87171',
};

function createCityCard(city) {
  const growthColor = growthColors[city.growth] || '#60a5fa';
  const riskColor = riskColors[city.riskLevel] || '#fbbf24';

  const card = document.createElement('div');
  card.className = 'city-card';
  card.dataset.slug = city.slug;

  card.innerHTML = `
    <div class="city-card-header">
      <div>
        <div class="city-name">${city.name}</div>
        <div class="city-state">${city.state}</div>
      </div>
      <div class="city-badges">
        <span class="badge" style="background: ${growthColor}22; color: ${growthColor}; border-color: ${growthColor}44">${city.growth} Growth</span>
      </div>
    </div>

    <div class="city-metrics">
      <div class="metric">
        <div class="metric-label">Price Range</div>
        <div class="metric-value">₹${city.priceRangeMin}–${city.priceRangeMax} Cr</div>
      </div>
      <div class="metric">
        <div class="metric-label">ROI</div>
        <div class="metric-value roi-value">${city.roiMin}–${city.roiMax}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Rental Yield</div>
        <div class="metric-value yield-value">${city.rentalYieldMin}–${city.rentalYieldMax}%</div>
      </div>
      <div class="metric">
        <div class="metric-label">Risk</div>
        <div class="metric-value" style="color: ${riskColor}">${city.riskLevel}</div>
      </div>
    </div>

    <div class="demand-bar-container">
      <div class="demand-bar-label">
        <span>Market Demand Score</span>
        <span class="demand-score">${city.demandScore}/100</span>
      </div>
      <div class="demand-bar-track">
        <div class="demand-bar-fill" data-score="${city.demandScore}" style="width: 0%; background: ${growthColor}"></div>
      </div>
    </div>

    <div class="city-highlights">
      ${city.highlights.slice(0, 3).map(h => `<div class="highlight-item">✓ ${h}</div>`).join('')}
    </div>

    <div class="city-verdict">
      <span class="verdict-label">Verdict:</span> ${city.verdict}
    </div>

    <div class="city-price-sqft">
      ₹${city.avgPricePerSqFt.min.toLocaleString('en-IN')}–₹${city.avgPricePerSqFt.max.toLocaleString('en-IN')} per sq.ft
    </div>
  `;

  return card;
}

async function initDashboard() {
  const grid = document.getElementById('cities-grid');
  const budgetFilter = document.getElementById('budget-filter');
  const searchFilter = document.getElementById('city-search');

  grid.innerHTML = '<div class="loading-spinner"><div class="spinner"></div><p>Loading market data...</p></div>';

  let allCities = [];

  try {
    const { cities } = await api.getCities();
    allCities = cities;
    renderCities(allCities);
  } catch (err) {
    grid.innerHTML = `<div class="error-msg">Failed to load market data: ${err.message}</div>`;
    return;
  }

  function renderCities(cities) {
    grid.innerHTML = '';
    if (!cities.length) {
      grid.innerHTML = '<div class="no-data">No cities match your filter.</div>';
      return;
    }

    cities.forEach((city, i) => {
      const card = createCityCard(city);
      card.style.animationDelay = `${i * 80}ms`;
      card.classList.add('card-animate-in');
      grid.appendChild(card);
    });

    // Animate demand bars after paint
    requestAnimationFrame(() => {
      setTimeout(() => {
        document.querySelectorAll('.demand-bar-fill').forEach(bar => {
          bar.style.width = bar.dataset.score + '%';
        });
      }, 200);
    });
  }

  function applyFilters() {
    const budget = parseFloat(budgetFilter.value) || Infinity;
    const search = searchFilter.value.toLowerCase();

    const filtered = allCities.filter(c => {
      const matchesBudget = c.priceRangeMin <= budget;
      const matchesSearch = !search ||
        c.name.toLowerCase().includes(search) ||
        c.city.toLowerCase().includes(search) ||
        c.state.toLowerCase().includes(search);
      return matchesBudget && matchesSearch;
    });

    renderCities(filtered);
  }

  budgetFilter.addEventListener('change', applyFilters);
  searchFilter.addEventListener('input', applyFilters);

  // Sort buttons
  document.querySelectorAll('.sort-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.sort-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');

      const sort = btn.dataset.sort;
      const sorted = [...allCities].sort((a, b) => {
        if (sort === 'roi') return b.roiMax - a.roiMax;
        if (sort === 'yield') return b.rentalYieldMax - a.rentalYieldMax;
        if (sort === 'price-asc') return a.priceRangeMin - b.priceRangeMin;
        if (sort === 'price-desc') return b.priceRangeMax - a.priceRangeMax;
        if (sort === 'demand') return b.demandScore - a.demandScore;
        return 0;
      });

      renderCities(sorted);
    });
  });
}

window.initDashboard = initDashboard;
