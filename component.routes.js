const express = require('express');
const { check } = require('express-validator');
const componentController = require('../controllers/component.controller');
const { verifyToken, isBiologist } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all components
router.get('/', verifyToken, componentController.getAllComponents);

// Get component by ID
router.get('/:id', verifyToken, componentController.getComponentById);

// Add new component
router.post('/', [
  verifyToken,
  isBiologist,
  check('type', 'Component type is required').isIn(['cps', 'pfc', 'cg']),
  check('weight', 'Weight is required').isNumeric(),
  check('bagblood_id', 'Blood bag ID is required').isNumeric()
], componentController.addComponent);

// Update component
router.put('/:id', [
  verifyToken,
  isBiologist
], componentController.updateComponent);

// Delete component
router.delete('/:id', [
  verifyToken,
  isBiologist
], componentController.deleteComponent);

// Get components by type
router.get('/type/:type', verifyToken, componentController.getComponentsByType);

module.exports = router;