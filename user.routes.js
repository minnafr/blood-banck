const express = require('express');
const { check } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken, isChefService } = require('../middleware/auth.middleware');

const router = express.Router();

// Routes for biologists (accessible by chef service)
router.get('/biologists', [verifyToken, isChefService], userController.getAllBiologists);
router.get('/biologists/:id', [verifyToken, isChefService], userController.getBiologistById);
router.put('/biologists/:id', [
  verifyToken,
  isChefService,
  check('email', 'Please include a valid email').optional().isEmail(),
  check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 })
], userController.updateBiologist);
router.delete('/biologists/:id', [verifyToken, isChefService], userController.deleteBiologist);

// Routes for chef service profile (accessible by the chef service themselves)
router.get('/profile', verifyToken, userController.getChefServiceProfile);
router.put('/profile', [
  verifyToken,
  check('email', 'Please include a valid email').optional().isEmail(),
  check('password', 'Password must be at least 6 characters').optional().isLength({ min: 6 })
], userController.updateChefServiceProfile);

module.exports = router;