const marketData = require('../data/marketData');

exports.getCities = (req, res) => {
  const { budget, city } = req.query;

  let results = marketData;

  // Filter by city name (partial match)
  if (city) {
    results = results.filter(c =>
      c.city.toLowerCase().includes(city.toLowerCase()) ||
      c.name.toLowerCase().includes(city.toLowerCase())
    );
  }

  // Filter by budget (in Cr)
  if (budget) {
    const b = parseFloat(budget);
    if (!isNaN(b)) {
      results = results.filter(c => c.priceRangeMin <= b);
    }
  }

  res.json({ cities: results });
};

exports.getCity = (req, res) => {
  const city = marketData.find(c => c.slug === req.params.slug);
  if (!city) return res.status(404).json({ error: 'City not found.' });
  res.json({ city });
};

exports.compareCities = (req, res) => {
  const { cities } = req.query;

  if (!cities) {
    return res.status(400).json({ error: 'Please provide city slugs as ?cities=slug1,slug2' });
  }

  const slugs = cities.split(',').map(s => s.trim()).slice(0, 3);
  const results = slugs.map(slug => {
    const city = marketData.find(c => c.slug === slug);
    return city || null;
  }).filter(Boolean);

  if (results.length < 2) {
    return res.status(400).json({ error: 'Please provide at least 2 valid city slugs for comparison.' });
  }

  res.json({ comparison: results });
};
