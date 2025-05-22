const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { query } = require('../config/db');
const { validationResult } = require('express-validator');

// Login controller
exports.login = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { username, password } = req.body;

    // Check if user exists as biologist
    let user = await query('SELECT * FROM Biologist WHERE username = ?', [username]);
    let role = 'biologist';

    // If not found as biologist, check chef_service
    if (user.length === 0) {
      user = await query('SELECT * FROM Chef_service WHERE username = ?', [username]);
      role = 'chef';
    }

    // If user not found in either table
    if (user.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Compare password
    const validPassword = await bcrypt.compare(password, user[0].password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid password'
      });
    }

    // Create JWT token
    const token = jwt.sign(
      { 
        id: role === 'biologist' ? user[0].biologist_id : user[0].chef_id, 
        role 
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );

    // Return user info and token
    return res.status(200).json({
      success: true,
      user: {
        id: role === 'biologist' ? user[0].biologist_id : user[0].chef_id,
        username: user[0].username,
        email: user[0].email,
        firstName: user[0].first_name,
        lastName: user[0].last_name,
        role
      },
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during login'
    });
  }
};

// Register controller for biologist
exports.registerBiologist = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, username, email, phoneNumber, password } = req.body;

    // Check if username already exists
    const existingUser = await query(
      'SELECT * FROM Biologist WHERE username = ? OR email = ?', 
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new biologist
    await query(
      'INSERT INTO Biologist (first_name, last_name, username, email, phonenumber, password) VALUES (?, ?, ?, ?, ?, ?)',
      [firstName, lastName, username, email, phoneNumber, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: 'Biologist registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};

// Register controller for chef service
exports.registerChefService = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { firstName, lastName, username, email, password } = req.body;

    // Check if username already exists
    const existingUser = await query(
      'SELECT * FROM Chef_service WHERE username = ? OR email = ?', 
      [username, email]
    );

    if (existingUser.length > 0) {
      return res.status(409).json({
        success: false,
        message: 'Username or email already exists'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new chef service
    await query(
      'INSERT INTO Chef_service (first_name, last_name, username, email, password) VALUES (?, ?, ?, ?, ?)',
      [firstName, lastName, username, email, hashedPassword]
    );

    return res.status(201).json({
      success: true,
      message: 'Chef service registered successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error during registration'
    });
  }
};