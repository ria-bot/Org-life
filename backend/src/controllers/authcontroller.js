const Budgeter = require('../models/Budgeter');
const jwt = require('jsonwebtoken');
require('dotenv').config();

// Generate JWT Token
const generateToken = (budgeterId) => {
    return jwt.sign(
        { id: budgeterId }, 
        process.env.JWT_SECRET, 
        { expiresIn: process.env.JWT_EXPIRE || '7d' }
    );
};

// Sign Up
exports.signUp = async (req, res) => {
    try {
        const { email, password, full_name, phone_number, currency } = req.body;

        // Validate required fields
        if (!email || !password || !full_name || !phone_number) {
            return res.status(400).json({ 
                error: 'All fields are required' 
            });
        }

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            return res.status(400).json({ 
                error: 'Please enter a valid email address' 
            });
        }

        // Validate phone number (Kenyan format)
        const phoneRegex = /^07\d{8}$|^01\d{8}$|^254\d{9}$/;
        if (!phoneRegex.test(phone_number)) {
            return res.status(400).json({ 
                error: 'Please enter a valid Kenyan phone number (e.g., 0712345678)' 
            });
        }

        // Validate password strength
        if (password.length < 6) {
            return res.status(400).json({ 
                error: 'Password must be at least 6 characters' 
            });
        }

        // Check if budgeter exists
        const existingBudgeter = await Budgeter.findByEmail(email);
        if (existingBudgeter) {
            return res.status(400).json({ 
                error: 'Budgeter with this email already exists' 
            });
        }

        // Create budgeter
        const budgeterId = await Budgeter.create({
            email,
            password,
            full_name,
            phone_number,
            currency
        });

        // Generate token
        const token = generateToken(budgeterId);
        const budgeter = await Budgeter.findById(budgeterId);

        res.status(201).json({
            message: 'Budgeter created successfully',
            token,
            budgeter
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Sign In
exports.signIn = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validate
        if (!email || !password) {
            return res.status(400).json({ 
                error: 'Email and password are required' 
            });
        }

        // Find budgeter
        const budgeter = await Budgeter.findByEmail(email);
        if (!budgeter) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // Check password
        const isValidPassword = await Budgeter.comparePassword(password, budgeter.password);
        if (!isValidPassword) {
            return res.status(401).json({ 
                error: 'Invalid credentials' 
            });
        }

        // Generate token
        const token = generateToken(budgeter.id);
        const budgeterData = await Budgeter.findById(budgeter.id);

        res.json({
            message: 'Login successful',
            token,
            budgeter: budgeterData
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Get Current Budgeter
exports.getCurrentBudgeter = async (req, res) => {
    try {
        const budgeter = await Budgeter.findById(req.user.id);
        if (!budgeter) {
            return res.status(404).json({ error: 'Budgeter not found' });
        }
        res.json(budgeter);
    } catch (error) {
        console.error('Get budgeter error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

// Logout
exports.logout = async (req, res) => {
    res.json({ message: 'Logout successful' });
};