const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const requireAdmin = require('../middleware/admin');

router.use(authMiddleware, requireAdmin);

router.get('/ping', (req, res) => {
    res.json({ message: 'Admin route working', user: req.user });
});

module.exports = router;