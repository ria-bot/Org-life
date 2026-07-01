const express = require('express');
const router = express.Router();
const incomeController = require('../controllers/incomeController');
const authMiddleware = require('../middleware/auth');

// All income routes require authentication
router.use(authMiddleware);

router.get('/summary', incomeController.getIncomeSummary);
router.post('/', incomeController.createIncome);
router.get('/', incomeController.getIncomes);
router.get('/:id', incomeController.getIncome);
router.put('/:id', incomeController.updateIncome);
router.delete('/:id', incomeController.deleteIncome);

module.exports = router;