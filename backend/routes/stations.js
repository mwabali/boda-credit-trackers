const express = require('express');
const router = express.Router();
const { Station } = require('../models');
const { hydrateStation, prepareStationPayload } = require('../utils/stationCompany');
const VALID_STATION_STATUSES = new Set(['active', 'closed', 'maintenance']);

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
      data: stations.map(hydrateStation)
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
      data: hydrateStation(station)
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
    
    const station = await Station.create(prepareStationPayload({
      name,
      location,
      managerName,
      managerPhone
    }));
    
    res.status(201).json({
      success: true,
      message: 'Station created successfully',
      data: hydrateStation(station)
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error creating station',
      error: error.message
    });
  }
});

// PATCH /stations/:id - Update station status only
router.patch('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const station = await Station.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    if (!status || !VALID_STATION_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station status',
      });
    }

    await station.update({ status });

    res.json({
      success: true,
      message: 'Station status updated successfully',
      data: hydrateStation(station),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating station status',
      error: error.message,
    });
  }
});

// PUT /stations/:id - Update station
router.put('/:id', async (req, res) => {
  try {
    const { name, location, managerName, managerPhone, status } = req.body;
    const station = await Station.findByPk(req.params.id);

    if (!station) {
      return res.status(404).json({
        success: false,
        message: 'Station not found',
      });
    }

    if (status && !VALID_STATION_STATUSES.has(status)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid station status',
      });
    }

    await station.update(prepareStationPayload({
      name,
      location,
      managerName,
      managerPhone,
      status,
    }));

    res.json({
      success: true,
      message: 'Station updated successfully',
      data: hydrateStation(station),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error updating station',
      error: error.message,
    });
  }
});

module.exports = router;
