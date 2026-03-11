const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/database');

const Transaction = sequelize.define('Transaction', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  riderId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'rider_id',
    references: {
      model: 'riders',
      key: 'id'
    }
  },
  stationId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    field: 'station_id',
    references: {
      model: 'stations',
      key: 'id'
    }
  },
  amount: {
    type: DataTypes.DECIMAL(10, 2),
    allowNull: false,
    validate: {
      min: 0.01
    }
  },
  fuelType: {
    type: DataTypes.STRING(20),
    defaultValue: 'petrol',
    field: 'fuel_type'
  },
  liters: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true
  },
  pricePerLiter: {
    type: DataTypes.DECIMAL(8, 2),
    allowNull: true,
    field: 'price_per_liter'
  },
  status: {
    type: DataTypes.ENUM('pending', 'approved', 'paid', 'cancelled'),
    defaultValue: 'pending'
  },
  paymentMethod: {
    type: DataTypes.ENUM('cash', 'mobile_money', 'bank_transfer', 'credit'),
    defaultValue: 'credit',
    field: 'payment_method'
  },
  paymentDate: {
    type: DataTypes.DATE,
    allowNull: true,
    field: 'payment_date'
  },
  receiptNumber: {
    type: DataTypes.STRING(50),
    allowNull: true,
    unique: true,
    field: 'receipt_number'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'transactions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at',
  hooks: {
    beforeCreate: (transaction) => {
      // Generate receipt number if not provided
      if (!transaction.receiptNumber) {
        const timestamp = Date.now();
        const random = Math.floor(Math.random() * 1000);
        transaction.receiptNumber = `BODA-${timestamp}-${random}`;
      }
    },
    beforeUpdate: (transaction) => {
      // Set payment date when status changes to paid
      if (transaction.changed('status') && transaction.status === 'paid') {
        transaction.paymentDate = new Date();
      }
    }
  }
});

module.exports = Transaction;