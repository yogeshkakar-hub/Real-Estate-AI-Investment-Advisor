const express = require('express');
const router = express.Router();
const recommendController = require('../controllers/recommend.controller');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/', auth, aiLimiter, recommendController.generate);
router.get('/history', auth, recommendController.getHistory);

module.exports = router;
