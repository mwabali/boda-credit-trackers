const express = require('express');
const router = express.Router();
const { Op, fn, col, where: sequelizeWhere } = require('sequelize');
const { Rider, Transaction } = require('../models');
const { getOutstandingBalanceMap } = require('../utils/riderBalances');
const VALID_RIDER_STATUSES = new Set(['active', 'suspended', 'inactive']);

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

    const balanceMap = await getOutstandingBalanceMap(riders.map((rider) => rider.id));
    const ridersWithBalances = riders.map((rider) => ({
      ...rider.toJSON(),
      currentBalance: balanceMap.get(Number(rider.id)) || 0,
    }));
    
    res.json({ success: true, count: riders.length, data: ridersWithBalances });
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
    
    const outstandingBalance = rider.transactions.reduce((sum, transaction) => {
      if (transaction.status === 'paid' || transaction.status === 'cancelled') {
        return sum;
      }

      return sum + parseFloat(transaction.amount || 0);
    }, 0);

    // Calculate stats
    const totalTransactions = rider.transactions.length;
    const totalSpent = rider.transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    res.json({ 
      success: true, 
      data: {
        ...rider.toJSON(),
        currentBalance: outstandingBalance,
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

// PATCH /riders/:id - Update rider status only
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const rider = await Rider.findByPk(req.params.id);

    if (!rider) {
      return res.status(404).json({ success: false, message: 'Rider not found' });
    }

    if (!status || !VALID_RIDER_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rider status',
      });
    }

    await rider.update({ status });

    res.json({
      success: true,
      message: 'Rider status updated',
      data: rider,
    });
  } catch (error) {
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

    if (status && !VALID_RIDER_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid rider status',
      });
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
