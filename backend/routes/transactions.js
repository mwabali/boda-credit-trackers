const express = require('express');
const router = express.Router();
const { Transaction, Rider, Station } = require('../models');

// GET /transactions/stats/dashboard - MUST BE FIRST
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const totalCount = await Transaction.count();
    const pendingCount = await Transaction.count({ where: { status: 'pending' } });
    const paidCount = await Transaction.count({ where: { status: 'paid' } });
    
    res.json({
      success: true,
      data: {
        total: totalCount,
        pending: pendingCount,
        paid: paidCount
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /transactions - List all
router.get('/', async (req, res) => {
  try {
    const { status, include } = req.query;
    const where = {};
    if (status) where.status = status;
    
    const includeOptions = [];
    if (include === 'all') {
      includeOptions.push(
        {
          model: Rider,
          as: 'rider',
          attributes: ['id', 'name', 'phone', 'licensePlate'],
        },
        {
          model: Station,
          as: 'station',
          attributes: ['id', 'name', 'location'],
        }
      );
    }
    
    const transactions = await Transaction.findAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });
    
    res.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /transactions - Create
router.post('/', async (req, res) => {
  try {
    const { riderId, stationId, amount, liters, notes } = req.body;
    
    if (!riderId || !stationId || !amount) {
      return res.status(400).json({ success: false, message: 'Missing required fields' });
    }
    
    const transaction = await Transaction.create({
      riderId,
      stationId,
      amount,
      liters,
      notes,
    });
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// PATCH /transactions/:id - Update status
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const transaction = await Transaction.findByPk(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Not found' });
    }
    
    transaction.status = status;
    await transaction.save();
    
    res.json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;
