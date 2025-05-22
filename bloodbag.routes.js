const express = require('express');
const { check } = require('express-validator');
const bloodBagController = require('../controllers/bloodbag.controller');
const { verifyToken, isBiologist } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all blood bags
router.get('/', verifyToken, bloodBagController.getAllBloodBags);

// Get alerts for expiring blood bags
router.get('/alerts/expiring', verifyToken, bloodBagController.getAlerts);

// Get blood bag by ID
router.get('/:id', verifyToken, bloodBagController.getBloodBagById);

// Add new blood bag
router.post('/', [
  verifyToken,
  isBiologist,
  check('bagbloodNumber', 'Bag blood number is required').not().isEmpty(),
  check('blood_group', 'Blood group is required').not().isEmpty(),
  check('simdon', 'Simdon is required').not().isEmpty(),
  check('bagtype', 'Bag type is required').not().isEmpty(),
  check('weight', 'Weight is required').isNumeric(),
  check('collectionDate', 'Collection date is required').not().isEmpty()
], bloodBagController.addBloodBag);

// Update blood bag
router.put('/:id', [
  verifyToken,
  isBiologist
], bloodBagController.updateBloodBag);

// Delete blood bag
router.delete('/:id', [
  verifyToken,
  isBiologist
], bloodBagController.deleteBloodBag);

//

module.exports = router;