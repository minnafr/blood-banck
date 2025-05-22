const { query } = require('../config/db');
const moment = require('moment');

// Get dashboard statistics
exports.getDashboardStats = async (req, res) => {
  try {
    // Current date
    const currentDate = moment().format('YYYY-MM-DD');

    // Get total blood bags in stock (not distributed)
    const stockResult = await query(
      'SELECT COUNT(*) as total FROM Whole_bagblood WHERE isdistributed = false AND expireDate >= ?',
      [currentDate]
    );
    
    // Get total distributed blood bags
    const distributionResult = await query(
      'SELECT COUNT(*) as total FROM Whole_bagblood WHERE isdistributed = true'
    );

    return res.status(200).json({
      success: true,
      data: {
        totalStock: stockResult[0].total,
        totalDistribution: distributionResult[0].total
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching dashboard statistics'
    });
  }
};

// Get detailed statistics
exports.getDetailedStats = async (req, res) => {
  try {
    // Current date
    const currentDate = moment().format('YYYY-MM-DD');

    // Get total blood bags
    const totalBloodBagsResult = await query('SELECT COUNT(*) as total FROM Whole_bagblood');

    // Get total distributed blood bags
    const totalDistributionResult = await query(
      'SELECT COUNT(*) as total FROM Whole_bagblood WHERE isdistributed = true'
    );

    // Get total expired blood bags
    const totalExpiredResult = await query(
      'SELECT COUNT(*) as total FROM Whole_bagblood WHERE expireDate < ? AND isdistributed = false',
      [currentDate]
    );

    // Get total CPS components
    const totalCpsResult = await query(
      'SELECT COUNT(*) as total FROM Component WHERE type = "cps"'
    );

    // Get total CG components
    const totalCgResult = await query(
      'SELECT COUNT(*) as total FROM Component WHERE type = "cg"'
    );

    // Get total PFC components
    const totalPfcResult = await query(
      'SELECT COUNT(*) as total FROM Component WHERE type = "pfc"'
    );

    return res.status(200).json({
      success: true,
      data: {
        totalPoCheSang: totalBloodBagsResult[0].total,
        totalDistribution: totalDistributionResult[0].total,
        totalExpire: totalExpiredResult[0].total,
        totalCps: totalCpsResult[0].total,
        totalCg: totalCgResult[0].total,
        totalPfc: totalPfcResult[0].total
      }
    });
  } catch (error) {
    console.error('Error fetching detailed statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching detailed statistics'
    });
  }
};

// Get yearly statistics 
exports.getYearlyStats = async (req, res) => {
  try {
    const { year } = req.params;
    
    // Check if year is valid
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    // Get statistics for the specified year
    const stats = await query('SELECT * FROM Statistics WHERE year = ?', [year]);
    
    if (stats.length === 0) {
      // Calculate statistics for the year if not already in the database
      const startDate = `${year}-01-01`;
      const endDate = `${year}-12-31`;
      
      // Total blood bags for the year
      const totalBagsResult = await query(
        'SELECT COUNT(*) as total FROM Whole_bagblood WHERE YEAR(collectionDate) = ?',
        [year]
      );

      // Total CPS bags for the year
      const totalCpsResult = await query(
        'SELECT COUNT(*) as total FROM Component WHERE type = "cps" AND YEAR(expireDate) = ?',
        [year]
      );

      // Total PFC bags for the year
      const totalPfcResult = await query(
        'SELECT COUNT(*) as total FROM Component WHERE type = "pfc" AND YEAR(expireDate) = ?',
        [year]
      );

      // Total CG bags for the year
      const totalCgResult = await query(
        'SELECT COUNT(*) as total FROM Component WHERE type = "cg" AND YEAR(expireDate) = ?',
        [year]
      );

      // Total expired bags for the year
      const totalExpiredResult = await query(
        'SELECT COUNT(*) as total FROM Whole_bagblood WHERE expireDate BETWEEN ? AND ? AND isdistributed = false',
        [startDate, endDate]
      );

      return res.status(200).json({
        success: true,
        data: {
          year: parseInt(year),
          total_bagblood: totalBagsResult[0].total,
          total_cps_bags: totalCpsResult[0].total,
          total_pfc_bags: totalPfcResult[0].total,
          total_cg_bags: totalCgResult[0].total,
          total_expire_bagblood: totalExpiredResult[0].total
        }
      });
    }
    
    return res.status(200).json({
      success: true,
      data: stats[0]
    });
  } catch (error) {
    console.error('Error fetching yearly statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while fetching yearly statistics'
    });
  }
};

// Save yearly statistics
exports.saveYearlyStats = async (req, res) => {
  try {
    // Save the yearly statistics to the database
    const { 
      year,
      total_bagblood,
      total_cps_bags,
      total_pfc_bags,
      total_cg_bags,
      total_expire_bagblood
    } = req.body;

    // Check if year is valid
    if (!year || isNaN(year) || year < 2000 || year > 2100) {
      return res.status(400).json({
        success: false,
        message: 'Invalid year'
      });
    }

    // Check if statistics already exist for this year
    const existingStats = await query('SELECT * FROM Statistics WHERE year = ?', [year]);
    
    if (existingStats.length > 0) {
      // Update existing statistics
      await query(
        `UPDATE Statistics 
         SET total_bagblood = ?,
             total_cps_bags = ?,
             total_pfc_bags = ?,
             total_cg_bags = ?,
             total_expire_bagblood = ?
         WHERE year = ?`,
        [
          total_bagblood,
          total_cps_bags,
          total_pfc_bags,
          total_cg_bags,
          total_expire_bagblood,
          year
        ]
      );
    } else {
      // Insert new statistics
      await query(
        `INSERT INTO Statistics 
         (year, total_bagblood, total_cps_bags, total_pfc_bags, total_cg_bags, total_expire_bagblood, biologist_id) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          year,
          total_bagblood,
          total_cps_bags,
          total_pfc_bags,
          total_cg_bags,
          total_expire_bagblood,
          req.userId
        ]
      );
    }

    return res.status(200).json({
      success: true,
      message: 'Statistics saved successfully'
    });
  } catch (error) {
    console.error('Error saving statistics:', error);
    return res.status(500).json({
      success: false,
      message: 'Server error while saving statistics'
    });
  }
};