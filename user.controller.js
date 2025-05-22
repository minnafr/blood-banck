const { query } = require('../config/db');
const bcrypt = require('bcrypt');
const { validationResult } = require('express-validator');

// Get all biologists
exports.getAllBiologists = async (req, res) => {
  try {
    const biologists = await query('SELECT biologist_id, first_name, last_name, username, email, phonenumber FROM Biologist');
    
    return res.status(200).json({
      success: true,
      count: biologists.length,
      data: biologists
    });
  } catch (error) {
    console.error('Error fetching biologists:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching biologists'
    });
  }
};

// Get biologist by ID
exports.getBiologistById = async (req, res) => {
  try {
    const { id } = req.params;
    const biologist = await query(
      'SELECT biologist_id, first_name, last_name, username, email, phonenumber FROM Biologist WHERE biologist_id = ?', 
      [id]
    );
    
    if (biologist.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Biologist not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: biologist[0]
    });
  } catch (error) {
    console.error('Error fetching biologist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching biologist'
    });
  }
};

// Update biologist
exports.updateBiologist = async (req, res) => {
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
    const { firstName, lastName, username, email, phoneNumber, password } = req.body;

    // Check if biologist exists
    const biologist = await query('SELECT * FROM Biologist WHERE biologist_id = ?', [id]);
    
    if (biologist.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Biologist not found'
      });
    }

    // Check if changing username or email, ensure they're unique
    if (username && username !== biologist[0].username) {
      const existingUsername = await query('SELECT * FROM Biologist WHERE username = ? AND biologist_id != ?', [username, id]);
      if (existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    if (email && email !== biologist[0].email) {
      const existingEmail = await query('SELECT * FROM Biologist WHERE email = ? AND biologist_id != ?', [email, id]);
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Initialize update query and parameters
    let updateQuery = `
      UPDATE Biologist 
      SET first_name = IFNULL(?, first_name),
          last_name = IFNULL(?, last_name),
          username = IFNULL(?, username),
          email = IFNULL(?, email),
          phonenumber = IFNULL(?, phonenumber)
    `;
    
    let params = [firstName, lastName, username, email, phoneNumber];

    // If password is provided, hash it and add to update query
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += `, password = ?`;
      params.push(hashedPassword);
    }

    // Add WHERE clause
    updateQuery += ` WHERE biologist_id = ?`;
    params.push(id);

    // Execute update query
    await query(updateQuery, params);

    return res.status(200).json({
      success: true,
      message: 'Biologist updated successfully'
    });
  } catch (error) {
    console.error('Error updating biologist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating biologist'
    });
  }
};

// Delete biologist
exports.deleteBiologist = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if biologist exists
    const biologist = await query('SELECT * FROM Biologist WHERE biologist_id = ?', [id]);
    
    if (biologist.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Biologist not found'
      });
    }

    // Check if there are blood bags registered by this biologist
    const bloodBags = await query('SELECT * FROM Whole_bagblood WHERE biologist_id = ?', [id]);
    
    if (bloodBags.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete biologist with registered blood bags'
      });
    }

    // Delete biologist
    await query('DELETE FROM Biologist WHERE biologist_id = ?', [id]);

    return res.status(200).json({
      success: true,
      message: 'Biologist deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting biologist:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while deleting biologist'
    });
  }
};

// Get chef service profile
exports.getChefServiceProfile = async (req, res) => {
  try {
    const chefId = req.userId;
    const chef = await query(
      'SELECT chef_id, first_name, last_name, username, email FROM Chef_service WHERE chef_id = ?', 
      [chefId]
    );
    
    if (chef.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chef service not found'
      });
    }
    
    return res.status(200).json({
      success: true,
      data: chef[0]
    });
  } catch (error) {
    console.error('Error fetching chef profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching chef profile'
    });
  }
};

// Update chef service profile
exports.updateChefServiceProfile = async (req, res) => {
  try {
    // Check validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        success: false, 
        errors: errors.array() 
      });
    }

    const chefId = req.userId;
    const { firstName, lastName, username, email, password } = req.body;

    // Check if chef service exists
    const chef = await query('SELECT * FROM Chef_service WHERE chef_id = ?', [chefId]);
    
    if (chef.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Chef service not found'
      });
    }

    // Check if changing username or email, ensure they're unique
    if (username && username !== chef[0].username) {
      const existingUsername = await query('SELECT * FROM Chef_service WHERE username = ? AND chef_id != ?', [username, chefId]);
      if (existingUsername.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Username already exists'
        });
      }
    }

    if (email && email !== chef[0].email) {
      const existingEmail = await query('SELECT * FROM Chef_service WHERE email = ? AND chef_id != ?', [email, chefId]);
      if (existingEmail.length > 0) {
        return res.status(409).json({
          success: false,
          message: 'Email already exists'
        });
      }
    }

    // Initialize update query and parameters
    let updateQuery = `
      UPDATE Chef_service 
      SET first_name = IFNULL(?, first_name),
          last_name = IFNULL(?, last_name),
          username = IFNULL(?, username),
          email = IFNULL(?, email)
    `;
    
    let params = [firstName, lastName, username, email];

    // If password is provided, hash it and add to update query
    if (password) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      updateQuery += `, password = ?`;
      params.push(hashedPassword);
    }

    // Add WHERE clause
    updateQuery += ` WHERE chef_id = ?`;
    params.push(chefId);

    // Execute update query
    await query(updateQuery, params);

    return res.status(200).json({
      success: true,
      message: 'Chef service profile updated successfully'
    });
  } catch (error) {
    console.error('Error updating chef profile:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating chef profile'
    });
  }
};