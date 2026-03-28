// compare.js — City comparison tool

const CITY_SLUGS = [
  { slug: 'noida-sector-150', label: 'Noida Sector 150' },
  { slug: 'gurgaon-dwarka-expressway', label: 'Gurgaon Dwarka Expressway' },
  { slug: 'delhi-l-zone-dwarka', label: 'Delhi L-Zone / Dwarka' },
  { slug: 'mumbai-navi-mumbai-panvel', label: 'Navi Mumbai / Panvel' },
  { slug: 'bangalore-sarjapur-road', label: 'Bangalore Sarjapur Road' },
  { slug: 'pune-hinjewadi', label: 'Pune Hinjewadi' },
  { slug: 'hyderabad-hitech-city', label: 'Hyderabad HITECH City' },
  { slug: 'chennai-omr', label: 'Chennai OMR' },
];

function populateDropdowns() {
  ['compare-city-1', 'compare-city-2', 'compare-city-3'].forEach((id, i) => {
    const sel = document.getElementById(id);
    sel.innerHTML = `<option value="">-- ${i === 2 ? 'Optional' : 'Select city'} --</option>`;
    CITY_SLUGS.forEach(c => {
      const opt = document.createElement('option');
      opt.value = c.slug;
      opt.textContent = c.label;
      sel.appendChild(opt);
    });
  });

  // Pre-select defaults
  document.getElementById('compare-city-1').value = 'noida-sector-150';
  document.getElementById('compare-city-2').value = 'gurgaon-dwarka-expressway';
}

function getWinner(cities, key, higher = true) {
  let best = cities[0];
  cities.forEach(c => {
    if (higher ? c[key] > best[key] : c[key] < best[key]) best = c;
  });
  return best.slug;
}

function renderComparisonTable(cities) {
  const table = document.getElementById('comparison-table');

  const winnerROI = getWinner(cities, 'roiMax');
  const winnerYield = getWinner(cities, 'rentalYieldMax');
  const winnerPrice = getWinner(cities, 'priceRangeMin', false);
  const winnerDemand = getWinner(cities, 'demandScore');

  const rows = [
    {
      label: '💰 Price Range',
      values: cities.map(c => ({
        city: c,
        text: `₹${c.priceRangeMin}–${c.priceRangeMax} Cr`,
        winner: winnerPrice === c.slug,
        winnerLabel: 'Most Affordable'
      }))
    },
    {
      label: '📈 Expected ROI',
      values: cities.map(c => ({
        city: c,
        text: `${c.roiMin}–${c.roiMax}%`,
        winner: winnerROI === c.slug,
        winnerLabel: 'Highest ROI'
      }))
    },
    {
      label: '🏠 Rental Yield',
      values: cities.map(c => ({
        city: c,
        text: `${c.rentalYieldMin}–${c.rentalYieldMax}%`,
        winner: winnerYield === c.slug,
        winnerLabel: 'Best Yield'
      }))
    },
    {
      label: '⚡ Growth',
      values: cities.map(c => ({ city: c, text: c.growth, winner: false }))
    },
    {
      label: '🛡️ Risk Level',
      values: cities.map(c => ({ city: c, text: c.riskLevel, winner: false }))
    },
    {
      label: '📊 Demand Score',
      values: cities.map(c => ({
        city: c,
        text: `${c.demandScore}/100`,
        winner: winnerDemand === c.slug,
        winnerLabel: 'Highest Demand'
      }))
    },
    {
      label: '🏗️ Property Types',
      values: cities.map(c => ({ city: c, text: c.propertyTypes.join(', '), winner: false }))
    },
    {
      label: '🏆 Verdict',
      values: cities.map(c => ({ city: c, text: c.verdict, winner: false }))
    },
  ];

  table.innerHTML = `
    <div class="compare-header-row">
      <div class="compare-cell compare-label-cell">Criteria</div>
      ${cities.map(c => `
        <div class="compare-cell compare-city-header">
          <div class="compare-city-name">${c.name}</div>
          <div class="compare-city-state">${c.state}</div>
        </div>
      `).join('')}
    </div>

    ${rows.map(row => `
      <div class="compare-row">
        <div class="compare-cell compare-label-cell">${row.label}</div>
        ${row.values.map(v => `
          <div class="compare-cell ${v.winner ? 'winner-cell' : ''}">
            ${v.text}
            ${v.winner ? `<div class="winner-tag">${v.winnerLabel}</div>` : ''}
          </div>
        `).join('')}
      </div>
    `).join('')}
  `;

  // Infrastructure notes
  const infraSection = document.getElementById('infra-notes');
  infraSection.innerHTML = cities.map(c => `
    <div class="infra-card">
      <div class="infra-city">${c.name}</div>
      <div class="infra-text">${c.infrastructure}</div>
    </div>
  `).join('');

  document.getElementById('comparison-result').classList.remove('hidden');
  document.getElementById('comparison-result').scrollIntoView({ behavior: 'smooth', block: 'start' });
}

async function runComparison() {
  const slug1 = document.getElementById('compare-city-1').value;
  const slug2 = document.getElementById('compare-city-2').value;
  const slug3 = document.getElementById('compare-city-3').value;

  if (!slug1 || !slug2) {
    showToast('Please select at least 2 cities to compare.', 'error');
    return;
  }

  const slugs = [slug1, slug2, ...(slug3 ? [slug3] : [])];

  const btn = document.getElementById('compare-btn');
  btn.disabled = true;
  btn.textContent = 'Comparing...';

  try {
    const { comparison } = await api.compareCities(slugs);
    renderComparisonTable(comparison);
  } catch (err) {
    showToast('Failed to compare cities: ' + err.message, 'error');
  } finally {
    btn.disabled = false;
    btn.textContent = 'Compare Now';
  }
}

function initCompare() {
  populateDropdowns();
  document.getElementById('compare-btn').addEventListener('click', runComparison);

  // Auto-run default comparison
  runComparison();
}

window.initCompare = initCompare;
