const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Transaction, Rider, Station } = require('../models');

// ============================================
// /stats/dashboard route
// ============================================
router.get('/stats/dashboard', async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [
      totalCount,
      pendingCount,
      paidCount,
      todayCount,
      totalRevenue,
      outstandingCredit
    ] = await Promise.all([
      Transaction.count(),
      Transaction.count({ where: { status: 'pending' } }),
      Transaction.count({ where: { status: 'paid' } }),
      Transaction.count({ where: { created_at: { [Op.gte]: today } } }),
      Transaction.sum('amount', { where: { status: 'paid' } }),
      Transaction.sum('amount', { where: { status: 'pending' } })
    ]);
    
    res.json({
      success: true,
      data: {
        counts: {
          total: totalCount,
          pending: pendingCount,
          paid: paidCount,
          today: todayCount
        },
        amounts: {
          totalRevenue: (totalRevenue || 0).toFixed(2),
          outstandingCredit: (outstandingCredit || 0).toFixed(2)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// SECOND: / route (list all with filters)
// ============================================
router.get('/', async (req, res) => {
  try {
    const { 
      status, 
      riderId, 
      stationId, 
      include,
      startDate,
      endDate,
      minAmount,
      maxAmount
    } = req.query;
    
    const where = {};
    
    // Filters
    if (status) where.status = status;
    if (riderId) where.rider_id = riderId;
    if (stationId) where.station_id = stationId;
    if (minAmount) where.amount = { [Op.gte]: minAmount };
    if (maxAmount) where.amount = { ...where.amount, [Op.lte]: maxAmount };
    
    // Date range
    if (startDate || endDate) {
      where.created_at = {};
      if (startDate) where.created_at[Op.gte] = new Date(startDate);
      if (endDate) where.created_at[Op.lte] = new Date(endDate);
    }
    
    // Include relations
    const includeOptions = [];
    if (include === 'all' || include === 'rider') {
      includeOptions.push({ 
        model: Rider, 
        as: 'rider', 
        attributes: ['id', 'name', 'phone', 'license_plate'] 
      });
    }
    if (include === 'all' || include === 'station') {
      includeOptions.push({ 
        model: Station, 
        as: 'station', 
        attributes: ['id', 'name', 'location'] 
      });
    }
    
    const transactions = await Transaction.findAll({
      where,
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });
    
    // Calculate totals
    const totalAmount = transactions.reduce((sum, t) => sum + parseFloat(t.amount), 0);
    const pendingAmount = transactions
      .filter(t => t.status === 'pending')
      .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
    res.json({ 
      success: true, 
      count: transactions.length,
      summary: {
        totalAmount: totalAmount.toFixed(2),
        pendingAmount: pendingAmount.toFixed(2)
      },
      data: transactions 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// THIRD: POST / (create)
// ============================================
router.post('/', async (req, res) => {
  try {
    const { riderId, stationId, amount, fuelType, liters, pricePerLiter, notes } = req.body;
    
    // Validation
    if (!riderId || !stationId || !amount) {
      return res.status(400).json({ 
        success: false, 
        message: 'riderId, stationId, and amount are required' 
      });
    }
    
    if (amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be greater than 0'
      });
    }
    
    // Verify rider exists and is active
    const rider = await Rider.findOne({ 
      where: { id: riderId, status: 'active' } 
    });
    if (!rider) {
      return res.status(404).json({ 
        success: false, 
        message: 'Active rider not found' 
      });
    }
    
    // Verify station exists and is active
    const station = await Station.findOne({ 
      where: { id: stationId, status: 'active' } 
    });
    if (!station) {
      return res.status(404).json({ 
        success: false, 
        message: 'Active station not found' 
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      riderId,
      stationId,
      amount,
      fuelType: fuelType || 'petrol',
      liters,
      pricePerLiter,
      notes
    });
    
    res.status(201).json({ 
      success: true, 
      message: 'Transaction created',
      data: {
        transaction,
        rider: { id: rider.id, name: rider.name, phone: rider.phone },
        station: { id: station.id, name: station.name }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// ============================================
// LAST: /:id routes (must be after specific routes!)
// ============================================
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Rider, as: 'rider' },
        { model: Station, as: 'station' }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // Valid status transitions
    const validStatuses = ['pending', 'approved', 'paid', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        message: `Status must be: ${validStatuses.join(', ')}` 
      });
    }
    
    const oldStatus = transaction.status;
    
    // Update
    transaction.status = status;
    if (notes) transaction.notes = notes;
    await transaction.save();
    
    // If marking as paid, update payment date
    if (status === 'paid' && oldStatus !== 'paid') {
      transaction.paymentDate = new Date();
      await transaction.save();
    }
    
    res.json({ 
      success: true, 
      message: `Transaction ${status}`,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;