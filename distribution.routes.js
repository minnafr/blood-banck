const express = require('express');
const { check } = require('express-validator');
const distributionController = require('../controllers/distribution.controller');
const { verifyToken, isBiologist } = require('../middleware/auth.middleware');

const router = express.Router();

// Get all distributions
router.get('/', verifyToken, distributionController.getAllDistributions);

// Get distribution by ID
router.get('/:id', verifyToken, distributionController.getDistributionById);

// Add new distribution
router.post('/', [
  verifyToken,
  isBiologist,
  check('numberOfDistribution', 'Distribution number is required').not().isEmpty(),
  check('receiverFirstName', 'Receiver first name is required').not().isEmpty(),
  check('receiverLastName', 'Receiver last name is required').not().isEmpty(),
  check('age', 'Age is required').isNumeric(),
  check('sex', 'Sex is required').not().isEmpty(),
  check('establishment', 'Establishment is required').not().isEmpty(),
  check('blood_group_rec', 'Blood group is required').not().isEmpty(),
  check('numberofbags', 'Number of bags is required').isNumeric(),
  check('service', 'Service is required').not().isEmpty(),
  check('carrierFullname', 'Carrier full name is required').not().isEmpty(),
  check('doctorFullname', 'Doctor full name is required').not().isEmpty(),
  check('date', 'Date is required').not().isEmpty(),
  check('bagblood_id', 'Blood bag ID is required').isNumeric()
], distributionController.addDistribution);

// Update distribution
router.put('/:id', [
  verifyToken,
  isBiologist
], distributionController.updateDistribution);

// Delete distribution
router.delete('/:id', [
  verifyToken,
  isBiologist
], distributionController.deleteDistribution);

// Get total distributions count
router.get('/stats/total', verifyToken, distributionController.getTotalDistributions);

module.exports = router;