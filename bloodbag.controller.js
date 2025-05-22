const { query } = require('../config/db');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Get all blood bags
exports.getAllBloodBags = async (req, res) => {
  try {
    const bloodBags = await query('SELECT * FROM Whole_bagblood');
    
    return res.status(200).json({
      success: true,
      count: bloodBags.length,
      data: bloodBags
    });
  } catch (error) {
    console.error('Error fetching blood bags:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching blood bags'
    });
  }
};

// Get blood bag by ID
exports.getBloodBagById = async (req, res) => {
  try {
    const { id } = req.params;
    const bloodBag = await query('SELECT * FROM Whole_bagblood WHERE bagblood_id = ?', [id]);
    
    if (bloodBag.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: bloodBag[0]
    });
  } catch (error) {
    console.error('Error fetching blood bag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching blood bag'
    });
  }
};

// Add new blood bag
exports.addBloodBag = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { 
      bagbloodNumber, 
      blood_group, 
      simdon, 
      bagtype, 
      weight, 
      collectionDate, 
      Ag_hbs, 
      HCV, 
      HIV, 
      TPHA, 
      Ac_htbc 
    } = req.body;

    // Calculate expire date (35 days from collection)
    const expireDate = moment(collectionDate).add(35, 'days').format('YYYY-MM-DD');
    
    // Get biologist ID from token
    const biologist_id = req.userId;

    // Insert new blood bag
    const result = await query(
      `INSERT INTO Whole_bagblood 
      (bagbloodNumber, blood_group, simdon, bagtype, weight, collectionDate, expireDate, 
       Ag_hbs, HCV, HIV, TPHA, Ac_htbc, isdistributed, biologist_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, false, ?)`,
      [
        bagbloodNumber, 
        blood_group, 
        simdon, 
        bagtype, 
        weight, 
        collectionDate, 
        expireDate, 
        Ag_hbs, 
        HCV, 
        HIV, 
        TPHA, 
        Ac_htbc, 
        biologist_id
      ]
    );

    return res.status(201).json({
      success: true,
      message: 'Blood bag added successfully',
      data: {
        bagblood_id: result.insertId,
        bagbloodNumber,
        expireDate
      }
    });
  } catch (error) {
    console.error('Error adding blood bag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding blood bag'
    });
  }
};

// Update blood bag
exports.updateBloodBag = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { id } = req.params;
    const { 
      bagbloodNumber, 
      blood_group, 
      simdon, 
      bagtype, 
      weight, 
      collectionDate, 
      Ag_hbs, 
      HCV, 
      HIV, 
      TPHA, 
      Ac_htbc,
      isdistributed
    } = req.body;

    // Check if blood bag exists
    const bloodBag = await query('SELECT * FROM Whole_bagblood WHERE bagblood_id = ?', [id]);
    
    if (bloodBag.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    // Calculate expire date if collection date is updated
    let expireDate = bloodBag[0].expireDate;
    if (collectionDate) {
      expireDate = moment(collectionDate).add(35, 'days').format('YYYY-MM-DD');
    }

    // Update blood bag
    await query(
      `UPDATE Whole_bagblood 
       SET bagbloodNumber = IFNULL(?, bagbloodNumber),
           blood_group = IFNULL(?, blood_group),
           simdon = IFNULL(?, simdon),
           bagtype = IFNULL(?, bagtype),
           weight = IFNULL(?, weight),
           collectionDate = IFNULL(?, collectionDate),
           expireDate = ?,
           Ag_hbs = IFNULL(?, Ag_hbs),
           HCV = IFNULL(?, HCV),
           HIV = IFNULL(?, HIV),
           TPHA = IFNULL(?, TPHA),
           Ac_htbc = IFNULL(?, Ac_htbc),
           isdistributed = IFNULL(?, isdistributed)
       WHERE bagblood_id = ?`,
      [
        bagbloodNumber, 
        blood_group, 
        simdon, 
        bagtype, 
        weight, 
        collectionDate, 
        expireDate, 
        Ag_hbs, 
        HCV, 
        HIV, 
        TPHA, 
        Ac_htbc,
        isdistributed,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Blood bag updated successfully'
    });
  } catch (error) {
    console.error('Error updating blood bag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating blood bag'
    });
  }
};

// Delete blood bag
exports.deleteBloodBag = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if blood bag exists
    const bloodBag = await query('SELECT * FROM Whole_bagblood WHERE bagblood_id = ?', [id]);
    
    if (bloodBag.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    // Check if there are any components related to this blood bag
    const components = await query('SELECT * FROM Component WHERE bagblood_id = ?', [id]);
    
    if (components.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete blood bag with existing components'
      });
    }

    // Check if there are any distributions related to this blood bag
    const distributions = await query('SELECT * FROM Distribution WHERE bagblood_id = ?', [id]);
    
    if (distributions.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete blood bag that has been distributed'
      });
    }

    // Delete blood bag
    await query('DELETE FROM Whole_bagblood WHERE bagblood_id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Blood bag deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting blood bag:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting blood bag'
    });
  }
};

// Get alerts for expiring blood bags
exports.getAlerts = async (req, res) => {
  try {
    // Get blood bags that expire within 5 days
    const today = moment().format('YYYY-MM-DD');
    const fiveDaysLater = moment().add(5, 'days').format('YYYY-MM-DD');
    
    const expiringBags = await query(
      `SELECT * FROM Whole_bagblood 
       WHERE expireDate BETWEEN ? AND ? 
       AND isdistributed = false`,
      [today, fiveDaysLater]
    );
    
    return res.status(200).json({
      success: true,
      count: expiringBags.length,
      data: expiringBags
    });
  } catch (error) {
    console.error('Error fetching alerts:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching alerts'
    });
  }
};