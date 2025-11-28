const express = require('express');
const { login, getMe, logout, refreshToken } = require('../controllers/authController');
const { authenticate } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimit');

const router = express.Router();

router.post('/login', authLimiter, login);
router.get('/me', authenticate, getMe);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);

module.exports = router;
