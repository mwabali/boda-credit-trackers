const express = require('express');
const router = express.Router();
const { Rider, Transaction } = require('../models');

// GET /riders
router.get('/', async (req, res) => {
  try {
    const riders = await Rider.findAll({
      where: { status: 'active' },
      order: [['created_at', 'DESC']],
      attributes: { exclude: ['nationalId'] } // Hide sensitive data
    });
    
    res.json({
      success: true,
      count: riders.length,
      data: riders
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching riders',
      error: error.message
    });
  }
});

// GET /riders/:id
router.get('/:id', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        limit: 5,
        order: [['created_at', 'DESC']]
      }]
    });
    
    if (!rider) {
      return res.status(404).json({
        success: false,
        message: 'Rider not found'
      });
    }
    
    res.json({
      success: true,
      data: rider
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching rider',
      error: error.message
    });
  }
});

// POST /riders
router.post('/', async (req, res) => {
  try {
    const { name, phone, licensePlate, nationalId } = req.body;
    
    if (!name || !phone || !licensePlate) {
      return res.status(400).json({
        success: false,
        message: 'Name, phone, and licensePlate are required'
      });
    }
    
    const rider = await Rider.create({
      name,
      phone,
      licensePlate,
      nationalId
    });
    
    res.status(201).json({
      success: true,
      message: 'Rider created successfully',
      data: rider
    });
  } catch (error) {
    if (error.name === 'SequelizeUniqueConstraintError') {
      return res.status(400).json({
        success: false,
        message: 'Phone number already registered'
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error creating rider',
      error: error.message
    });
  }
});

module.exports = router;