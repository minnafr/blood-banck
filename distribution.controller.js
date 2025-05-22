const { query } = require('../config/db');
const { validationResult } = require('express-validator');

// Get all distributions
exports.getAllDistributions = async (req, res) => {
  try {
    const distributions = await query(`
      SELECT d.*, w.blood_group, w.bagbloodNumber 
      FROM Distribution d
      JOIN Whole_bagblood w ON d.bagblood_id = w.bagblood_id
    `);
    
    return res.status(200).json({
      success: true,
      count: distributions.length,
      data: distributions
    });
  } catch (error) {
    console.error('Error fetching distributions:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching distributions'
    });
  }
};

// Get distribution by ID
exports.getDistributionById = async (req, res) => {
  try {
    const { id } = req.params;
    const distribution = await query(`
      SELECT d.*, w.blood_group, w.bagbloodNumber 
      FROM Distribution d
      JOIN Whole_bagblood w ON d.bagblood_id = w.bagblood_id
      WHERE d.distribution_id = ?
    `, [id]);
    
    if (distribution.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: distribution[0]
    });
  } catch (error) {
    console.error('Error fetching distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching distribution'
    });
  }
};

// Add new distribution
exports.addDistribution = async (req, res) => {
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
      numberOfDistribution,
      receiverFirstName,
      receiverLastName,
      age,
      sex,
      establishment,
      blood_group_rec,
      numberofbags,
      service,
      carrierFullname,
      doctorFullname,
      date,
      bagblood_id
    } = req.body;

    // Check if blood bag exists
    const bloodBag = await query('SELECT * FROM Whole_bagblood WHERE bagblood_id = ?', [bagblood_id]);
    
    if (bloodBag.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Blood bag not found'
      });
    }

    // Check if blood bag is already distributed
    if (bloodBag[0].isdistributed) {
      return res.status(400).json({
        success: false,
        message: 'Blood bag is already distributed'
      });
    }

    // Insert new distribution
    const result = await query(
      `INSERT INTO Distribution 
       (numberOfDistribution, receiverFirstName, receiverLastName, age, sex, establishment, 
        blood_group_rec, numberofbags, service, carrierFullname, doctorFullname, date, bagblood_id) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        numberOfDistribution,
        receiverFirstName,
        receiverLastName,
        age,
        sex,
        establishment,
        blood_group_rec,
        numberofbags,
        service,
        carrierFullname,
        doctorFullname,
        date,
        bagblood_id
      ]
    );

    // Update blood bag status to distributed
    await query(
      'UPDATE Whole_bagblood SET isdistributed = true WHERE bagblood_id = ?',
      [bagblood_id]
    );

    return res.status(201).json({
      success: true,
      message: 'Distribution added successfully',
      data: {
        distribution_id: result.insertId,
        numberOfDistribution
      }
    });
  } catch (error) {
    console.error('Error adding distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while adding distribution'
    });
  }
};

// Update distribution
exports.updateDistribution = async (req, res) => {
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
      numberOfDistribution,
      receiverFirstName,
      receiverLastName,
      age,
      sex,
      establishment,
      blood_group_rec,
      numberofbags,
      service,
      carrierFullname,
      doctorFullname,
      date
    } = req.body;

    // Check if distribution exists
    const distribution = await query('SELECT * FROM Distribution WHERE distribution_id = ?', [id]);
    
    if (distribution.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Update distribution
    await query(
      `UPDATE Distribution 
       SET numberOfDistribution = IFNULL(?, numberOfDistribution),
           receiverFirstName = IFNULL(?, receiverFirstName),
           receiverLastName = IFNULL(?, receiverLastName),
           age = IFNULL(?, age),
           sex = IFNULL(?, sex),
           establishment = IFNULL(?, establishment),
           blood_group_rec = IFNULL(?, blood_group_rec),
           numberofbags = IFNULL(?, numberofbags),
           service = IFNULL(?, service),
           carrierFullname = IFNULL(?, carrierFullname),
           doctorFullname = IFNULL(?, doctorFullname),
           date = IFNULL(?, date)
       WHERE distribution_id = ?`,
      [
        numberOfDistribution,
        receiverFirstName,
        receiverLastName,
        age,
        sex,
        establishment,
        blood_group_rec,
        numberofbags,
        service,
        carrierFullname,
        doctorFullname,
        date,
        id
      ]
    );

    return res.status(200).json({
      success: true,
      message: 'Distribution updated successfully'
    });
  } catch (error) {
    console.error('Error updating distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating distribution'
    });
  }
};

// Delete distribution
exports.deleteDistribution = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if distribution exists
    const distribution = await query('SELECT * FROM Distribution WHERE distribution_id = ?', [id]);
    
    if (distribution.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Distribution not found'
      });
    }

    // Get the blood bag ID from the distribution
    const bagblood_id = distribution[0].bagblood_id;

    // Delete distribution
    await query('DELETE FROM Distribution WHERE distribution_id = ?', [id]);

    // Update blood bag status to not distributed
    await query(
      'UPDATE Whole_bagblood SET isdistributed = false WHERE bagblood_id = ?',
      [bagblood_id]
    );

    return res.status(200).json({
      success: true,
      message: 'Distribution deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting distribution:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting distribution'
    });
  }
};

// Get total distributions count
exports.getTotalDistributions = async (req, res) => {
  try {
    const result = await query('SELECT COUNT(*) as total FROM Distribution');
    
    return res.status(200).json({
      success: true,
      total: result[0].total
    });
  } catch (error) {
    console.error('Error fetching distribution count:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching distribution count'
    });
  }
};