const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { Transaction, Rider, Station } = require('../models');

// GET /transactions
router.get('/', async (req, res) => {
  try {
    const { status, riderId, stationId, include } = req.query;
    const whereClause = {};
    
    if (status) whereClause.status = status;
    if (riderId) whereClause.rider_id = riderId;
    if (stationId) whereClause.station_id = stationId;
    
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
      where: whereClause,
      include: includeOptions,
      order: [['created_at', 'DESC']]
    });
    
    res.json({
      success: true,
      count: transactions.length,
      data: transactions
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions',
      error: error.message
    });
  }
});

// GET /transactions/:id
router.get('/:id', async (req, res) => {
  try {
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [
        { model: Rider, as: 'rider', attributes: ['id', 'name', 'phone'] },
        { model: Station, as: 'station', attributes: ['id', 'name', 'location'] }
      ]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    res.json({
      success: true,
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching transaction',
      error: error.message
    });
  }
});

// POST /transactions
router.post('/', async (req, res) => {
  try {
    const { riderId, stationId, amount, fuelType, liters, pricePerLiter, notes } = req.body;
    
    if (!riderId || !stationId || !amount) {
      return res.status(400).json({
        success: false,
        message: 'riderId, stationId, and amount are required'
      });
    }
    
    // Verify rider
    const rider = await Rider.findByPk(riderId);
    if (!rider || rider.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Active rider not found'
      });
    }
    
    // Verify station
    const station = await Station.findByPk(stationId);
    if (!station || station.status !== 'active') {
      return res.status(404).json({
        success: false,
        message: 'Active station not found'
      });
    }
    
    // Check credit limit
    const newBalance = parseFloat(rider.currentBalance) + parseFloat(amount);
    if (newBalance > parseFloat(rider.creditLimit)) {
      return res.status(400).json({
        success: false,
        message: 'Amount exceeds available credit',
        data: {
          creditLimit: rider.creditLimit,
          currentBalance: rider.currentBalance,
          requestedAmount: amount,
          availableCredit: parseFloat(rider.creditLimit) - parseFloat(rider.currentBalance)
        }
      });
    }
    
    // Create transaction
    const transaction = await Transaction.create({
      riderId,
      stationId,
      amount,
      fuelType,
      liters,
      pricePerLiter,
      notes
    });
    
    // Update rider balance
    await rider.update({ currentBalance: newBalance });
    
    res.status(201).json({
      success: true,
      message: 'Transaction created',
      data: {
        transaction,
        rider: {
          id: rider.id,
          name: rider.name,
          newBalance
        },
        station: {
          id: station.id,
          name: station.name
        }
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating transaction',
      error: error.message
    });
  }
});

// PATCH /transactions/:id
router.patch('/:id', async (req, res) => {
  try {
    const { status, notes } = req.body;
    const transaction = await Transaction.findByPk(req.params.id, {
      include: [{ model: Rider, as: 'rider' }]
    });
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }
    
    const validStatuses = ['pending', 'approved', 'paid', 'cancelled'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be: ${validStatuses.join(', ')}`
      });
    }
    
    const oldStatus = transaction.status;
    
    // Update fields
    if (status) transaction.status = status;
    if (notes !== undefined) transaction.notes = notes;
    
    await transaction.save();
    
    // Handle balance updates
    if (status === 'paid' && oldStatus !== 'paid') {
      const rider = transaction.rider;
      const newBalance = Math.max(0, parseFloat(rider.currentBalance) - parseFloat(transaction.amount));
      await rider.update({ currentBalance: newBalance });
    }
    
    if (status === 'cancelled' && oldStatus === 'pending') {
      const rider = transaction.rider;
      const newBalance = Math.max(0, parseFloat(rider.currentBalance) - parseFloat(transaction.amount));
      await rider.update({ currentBalance: newBalance });
    }
    
    res.json({
      success: true,
      message: 'Transaction updated',
      data: transaction
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating transaction',
      error: error.message
    });
  }
});

module.exports = router;