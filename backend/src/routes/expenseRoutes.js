const express = require('express');
const router = express.Router();
const expenseController = require('../controllers/expenseController');
const authMiddleware = require('../middleware/auth');

// All expense routes require authentication
router.use(authMiddleware);

router.get('/summary', expenseController.getExpenseSummary);
router.post('/', expenseController.createExpense);
router.get('/', expenseController.getExpenses);
router.get('/:id', expenseController.getExpense);
router.put('/:id', expenseController.updateExpense);
router.delete('/:id', expenseController.deleteExpense);

module.exports = router;