const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Rider = sequelize.define('Rider', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true,
      len: [2, 100]
    }
  },
  phone: {
    type: DataTypes.STRING(20),
    allowNull: false,
    unique: true,
    validate: {
      notEmpty: true
    }
  },
  licensePlate: {
    type: DataTypes.STRING(20),
    allowNull: false,
    field: 'license_plate',
    validate: {
      notEmpty: true
    }
  },
  nationalId: {
    type: DataTypes.STRING(50),
    allowNull: true,
    field: 'national_id'
  },
  creditLimit: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 100000.00,
    field: 'credit_limit'
  },
  currentBalance: {
    type: DataTypes.DECIMAL(12, 2),
    defaultValue: 0.00,
    field: 'current_balance'
  },
  status: {
    type: DataTypes.ENUM('active', 'suspended', 'inactive'),
    defaultValue: 'active'
  }
}, {
  tableName: 'riders',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Rider;