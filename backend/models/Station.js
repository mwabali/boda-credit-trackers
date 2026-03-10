const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Station = sequelize.define('Station', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: false,
    validate: {
      notEmpty: true
    }
  },
  location: {
    type: DataTypes.STRING(200),
    allowNull: false
  },
  managerName: {
    type: DataTypes.STRING(100),
    allowNull: true,
    field: 'manager_name'
  },
  managerPhone: {
    type: DataTypes.STRING(20),
    allowNull: true,
    field: 'manager_phone'
  },
  status: {
    type: DataTypes.ENUM('active', 'closed', 'maintenance'),
    defaultValue: 'active'
  }
}, {
  tableName: 'stations',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

module.exports = Station;