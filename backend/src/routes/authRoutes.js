// backend/src/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/admin'); // <-- ADD THIS LINE

// ============ PUBLIC ROUTES ============
router.post('/signup', authController.signUp);
router.post('/signin', authController.signIn);

// ============ VERIFICATION ROUTES ============
router.post('/verify', authController.verifyEmail);
router.post('/request-verification', authController.requestVerification);
router.get('/check-status', authController.checkUserStatus);

// ============ PASSWORD RESET ROUTES ============
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

// ============ PROTECTED ROUTES ============
router.get('/me', authMiddleware, authController.getCurrentBudgeter);
router.post('/logout', authMiddleware, authController.logout);

// ============ ADMIN ROUTES ============
router.put('/admin/verify-user/:id', authMiddleware, requireAdmin, authController.verifyUserById);

module.exports = router;