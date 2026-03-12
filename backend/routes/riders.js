const express = require('express');
const router = express.Router();
const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const { Rider, Transaction } = require('../models');

// GET /riders - List all (with optional search)
router.get('/', async (req, res) => {
  try {
    const { search, status } = req.query;
    const where = {};

    if (status) {
      where.status = status;
    }
    
    if (search) {
      where[Op.and] = [
        sequelizeWhere(fn('LOWER', col('name')), {
          [Op.like]: `%${search.toLowerCase()}%`,
        }),
      ];
    }
    
    const riders = await Rider.findAll({ 
      where,
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, count: riders.length, data: riders });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /riders/:id - Get single with transactions
router.get('/:id', async (req, res) => {
  try {
    const rider = await Rider.findByPk(req.params.id, {
      include: [{
        model: Transaction,
        as: 'transactions',
        limit: 10,
        order: [['created_at', 'DESC']]
      }]
    });
    
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }
    
    // Calculate stats
    const totalTransactions = rider.transactions.length;
    const totalSpent = rider.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    res.json({ 
      success: true, 
      data: {
        ...rider.toJSON(),
        stats: { totalTransactions, totalSpent }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /riders - Create with validation
router.post('/', async (req, res) => {
  try {
    const { name, phone, licensePlate } = req.body;
    
    // Validation
    if (!name || !phone || !licensePlate) {
      return res.status(400).json({ 
        success: false, 
        message: 'Name, phone, and licensePlate are required' 
      });
    }
    
    // Phone format validation (basic)
    if (!phone.match(/^\+?[0-9]{10,15}$/)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid phone format. Use: +256701234567'
      });
    }
    
    const rider = await Rider.create({ name, phone, licensePlate });
    
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
    res.status(500).json({ success: false, message: error.message });
  }
});

// PUT /riders/:id - Update rider
router.put('/:id', async (req, res) => {
  try {
    const { name, phone, licensePlate, status } = req.body;
    const rider = await Rider.findByPk(req.params.id);
    
    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }
    
    await rider.update({ name, phone, licensePlate, status });
    
    res.json({ 
      success: true, 
      message: 'Rider updated',
      data: rider 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
