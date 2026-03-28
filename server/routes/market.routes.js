const express = require('express');
const router = express.Router();
const marketController = require('../controllers/market.controller');

router.get('/cities', marketController.getCities);
router.get('/compare', marketController.compareCities);
router.get('/cities/:slug', marketController.getCity);

module.exports = router;
