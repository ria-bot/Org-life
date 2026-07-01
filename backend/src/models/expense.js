const { pool } = require('../config/database');

class Expense {
    static async create({ user_id, amount, category, description, expense_date }) {
        // Set default date to today if not provided
        const date = expense_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO expenses (user_id, amount, category, description, expense_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, amount, category, description, date]
        );
        return result.insertId;
    }

    static async findByUserId(userId, options = {}) {
        let query = 'SELECT * FROM expenses WHERE user_id = ?';
        const params = [userId];

        if (options.category) {
            query += ' AND category = ?';
            params.push(options.category);
        }

        if (options.startDate) {
            query += ' AND expense_date >= ?';
            params.push(options.startDate);
        }

        if (options.endDate) {
            query += ' AND expense_date <= ?';
            params.push(options.endDate);
        }

        query += ' ORDER BY expense_date DESC, created_at DESC';
        
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM expenses WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return rows[0];
    }

    static async update(id, userId, data) {
        const fields = [];
        const values = [];

        if (data.amount !== undefined) {
            fields.push('amount = ?');
            values.push(data.amount);
        }
        if (data.category) {
            fields.push('category = ?');
            values.push(data.category);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.expense_date) {
            fields.push('expense_date = ?');
            values.push(data.expense_date);
        }

        if (fields.length === 0) return null;

        values.push(id);
        values.push(userId);
        const [result] = await pool.execute(
            `UPDATE expenses SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await pool.execute(
            'DELETE FROM expenses WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getSummary(userId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                category,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
             FROM expenses 
             WHERE user_id = ? AND DATE_FORMAT(expense_date, '%Y-%m') = ?
             GROUP BY category
             ORDER BY total_amount DESC`,
            [userId, month]
        );
        return rows;
    }
}

module.exports = Expense;