const { query } = require('../config/db');
const { validationResult } = require('express-validator');
const moment = require('moment');

// Get all components
exports.getAllComponents = async (req, res) => {
  try {
    const components = await query(`
      SELECT c.*, w.blood_group, w.bagbloodNumber 
      FROM Component c
      JOIN Whole_bagblood w ON c.bagblood_id = w.bagblood_id
    `);
    
    return res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Error fetching components:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching components'
    });
  }
};

// Get component by ID
exports.getComponentById = async (req, res) => {
  try {
    const { id } = req.params;
    const component = await query(`
      SELECT c.*, w.blood_group, w.bagbloodNumber 
      FROM Component c
      JOIN Whole_bagblood w ON c.bagblood_id = w.bagblood_id
      WHERE c.component_id = ?
    `, [id]);
    
    if (component.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: component[0]
    });
  } catch (error) {
    console.error('Error fetching component:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching component'
    });
  }
};

// Add new component
exports.addComponent = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const { type, weight, bagblood_id } = req.body;

    // Check if blood bag exists
    const bloodBag = await query('SELECT * FROM Whole_bagblood WHERE bagblood_id = ?', [bagblood_id]);
    
    if (bloodBag.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    // Calculate expire date based on component type
    let expireDays;
    switch (type) {
      case 'cps':
        expireDays = 5; // 5 days for platelet concentrate
        break;
      case 'pfc':
        expireDays = 365; // 1 year for fresh frozen plasma
        break;
      case 'cg':
        expireDays = 42; // 42 days for red blood cells
        break;
      default:
        expireDays = 35; // Default value
    }

    const expireDate = moment(bloodBag[0].collectionDate).add(expireDays, 'days').format('YYYY-MM-DD');

    // Insert new component
    const result = await query(
      `INSERT INTO Component (type, weight, expireDate, isdistributed, bagblood_id) 
       VALUES (?, ?, ?, false, ?)`,
      [type, weight, expireDate, bagblood_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Component added successfully',
      data: {
        component_id: result.insertId,
        type,
        expireDate
      }
    });
  } catch (error) {
    console.error('Error adding component:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding component'
    });
  }
};

// Update component
exports.updateComponent = async (req, res) => {
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
    const { weight, isdistributed } = req.body;

    // Check if component exists
    const component = await query('SELECT * FROM Component WHERE component_id = ?', [id]);
    
    if (component.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Update component
    await query(
      `UPDATE Component 
       SET weight = IFNULL(?, weight),
           isdistributed = IFNULL(?, isdistributed)
       WHERE component_id = ?`,
      [weight, isdistributed, id]
    );

    return res.status(200).json({
      success: true,
      message: 'Component updated successfully'
    });
  } catch (error) {
    console.error('Error updating component:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating component'
    });
  }
};

// Delete component
exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if component exists
    const component = await query('SELECT * FROM Component WHERE component_id = ?', [id]);
    
    if (component.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Component not found'
      });
    }

    // Check if component is distributed
    if (component[0].isdistributed) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete a distributed component'
      });
    }

    // Delete component
    await query('DELETE FROM Component WHERE component_id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting component:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting component'
    });
  }
};

// Get components by type
exports.getComponentsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    // Validate component type
    if (!['cps', 'pfc', 'cg'].includes(type)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid component type'
      });
    }
    
    const components = await query(`
      SELECT c.*, w.blood_group, w.bagbloodNumber 
      FROM Component c
      JOIN Whole_bagblood w ON c.bagblood_id = w.bagblood_id
      WHERE c.type = ?
    `, [type]);
    
    return res.status(200).json({
      success: true,
      count: components.length,
      data: components
    });
  } catch (error) {
    console.error('Error fetching components by type:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching components'
    });
  }
};