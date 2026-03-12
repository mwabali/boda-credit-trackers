const express = require('express');
const router = express.Router();
const { Station } = require('../models');

// GET /stations
router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }

    const stations = await Station.findAll({
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      count: stations.length,
      data: stations
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching stations',
      error: error.message
    });
  }
});

// GET /stations/:id
router.get('/:id', async (req, res) => {
  try {
    const station = await Station.findByPk(req.params.id);
    
    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found'
      });
    }
    
    res.json({
      success: true,
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching station',
      error: error.message
    });
  }
});

// POST /stations
router.post('/', async (req, res) => {
  try {
    const { name, location, managerName, managerPhone } = req.body;
    
    if (!name || !location) {
      return res.status(400).json({
        success: false,
        message: 'Name and location are required'
      });
    }
    
    const station = await Station.create({
      name,
      location,
      managerName,
      managerPhone
    });
    
    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: station
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating station',
      error: error.message
    });
  }
});

module.exports = router;
