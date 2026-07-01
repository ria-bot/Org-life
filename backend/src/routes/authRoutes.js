const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authMiddleware = require('../middleware/auth');

// Public routes
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

// Protected routes
router.get('/me', authMiddleware, authController.getCurrentBudgeter);
router.post('/logout', authMiddleware, authController.logout);

module.exports = router;