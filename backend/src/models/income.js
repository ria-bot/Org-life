const { pool } = require('../config/database');

class Income {
    static async create({ user_id, amount, source, description, income_date }) {
        // Set default date to today if not provided
        const date = income_date || new Date().toISOString().split('T')[0];
        
        const [result] = await pool.execute(
            `INSERT INTO income (user_id, amount, source, description, income_date) 
             VALUES (?, ?, ?, ?, ?)`,
            [user_id, amount, source, description, date]
        );
        return result.insertId;
    }

    static async findByUserId(userId, options = {}) {
        let query = 'SELECT * FROM income WHERE user_id = ?';
        const params = [userId];

        if (options.startDate) {
            query += ' AND income_date >= ?';
            params.push(options.startDate);
        }

        if (options.endDate) {
            query += ' AND income_date <= ?';
            params.push(options.endDate);
        }

        query += ' ORDER BY income_date DESC, created_at DESC';
        
        if (options.limit) {
            query += ' LIMIT ?';
            params.push(options.limit);
        }

        const [rows] = await pool.execute(query, params);
        return rows;
    }

    static async findById(id, userId) {
        const [rows] = await pool.execute(
            'SELECT * FROM income WHERE id = ? AND user_id = ?',
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
        if (data.source) {
            fields.push('source = ?');
            values.push(data.source);
        }
        if (data.description !== undefined) {
            fields.push('description = ?');
            values.push(data.description);
        }
        if (data.income_date) {
            fields.push('income_date = ?');
            values.push(data.income_date);
        }

        if (fields.length === 0) return null;

        values.push(id);
        values.push(userId);
        const [result] = await pool.execute(
            `UPDATE income SET ${fields.join(', ')} WHERE id = ? AND user_id = ?`,
            values
        );
        
        return result.affectedRows > 0;
    }

    static async delete(id, userId) {
        const [result] = await pool.execute(
            'DELETE FROM income WHERE id = ? AND user_id = ?',
            [id, userId]
        );
        return result.affectedRows > 0;
    }

    static async getSummary(userId, month) {
        const [rows] = await pool.execute(
            `SELECT 
                source,
                COUNT(*) as count,
                SUM(amount) as total_amount,
                AVG(amount) as avg_amount
             FROM income 
             WHERE user_id = ? AND DATE_FORMAT(income_date, '%Y-%m') = ?
             GROUP BY source
             ORDER BY total_amount DESC`,
            [userId, month]
        );
        return rows;
    }
}

module.exports = Income;