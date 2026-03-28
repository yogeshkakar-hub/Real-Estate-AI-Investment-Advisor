require('dotenv').config();
const express = require('express');
const helmet = require('helmet');
const morgan = require('morgan');
const cors = require('cors');
const path = require('path');

const { generalLimiter } = require('./middleware/rateLimiter');

const { initDB } = require('./db');

const app = express();

// Security & logging
app.use(helmet({ contentSecurityPolicy: false })); // CSP disabled for CDN scripts in HTML
app.use(morgan('dev'));
app.use(cors());
app.use(express.json());

// General rate limit
app.use('/api', generalLimiter);

// Routes
app.use('/api/auth', require('./routes/auth.routes'));
app.use('/api/chat', require('./routes/chat.routes'));
app.use('/api/market', require('./routes/market.routes'));
app.use('/api/recommend', require('./routes/recommend.routes'));

// Serve frontend static files
app.use(express.static(path.join(__dirname, '..', 'public')));

// Catch-all: serve index.html for any unmatched route (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal server error.' });
});

const PORT = process.env.PORT || 3000;

(async () => {
  await initDB();
  app.listen(PORT, () => {
    console.log(`\n🚀 Real Estate AI Advisor running at http://localhost:${PORT}`);
    console.log(`   Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`   Gemini API: ${process.env.GEMINI_API_KEY ? '✅ Configured' : '❌ NOT SET (add to .env)'}`);
  });
})();

