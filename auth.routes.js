const express = require('express');
const { check } = require('express-validator');
const authController = require('../controllers/auth.controller');

const router = express.Router();

// Login route
router.post('/login', [
  check('username', 'Username is required').not().isEmpty(),
  check('password', 'Password is required').not().isEmpty()
], authController.login);

// Register biologist route
router.post('/register-biologist', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('phoneNumber', 'Phone number is required').not().isEmpty(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], authController.registerBiologist);

// Register chef service route
router.post('/register-chef-service', [
  check('firstName', 'First name is required').not().isEmpty(),
  check('lastName', 'Last name is required').not().isEmpty(),
  check('username', 'Username is required').not().isEmpty(),
  check('email', 'Please include a valid email').isEmail(),
  check('password', 'Password must be at least 6 characters').isLength({ min: 6 })
], authController.registerChefService);

module.exports = router;