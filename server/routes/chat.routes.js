const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chat.controller');
const auth = require('../middleware/auth');
const { aiLimiter } = require('../middleware/rateLimiter');

router.post('/message', auth, aiLimiter, chatController.sendMessage);
router.get('/sessions', auth, chatController.getSessions);
router.get('/sessions/:id', auth, chatController.getSession);
router.delete('/sessions/:id', auth, chatController.deleteSession);

module.exports = router;
