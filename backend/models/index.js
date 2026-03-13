const Rider = require('./Rider');
const Station = require('./Station');
const Transaction = require('./Transaction');

// Define one-to-many relationships through the transaction ledger
Rider.hasMany(Transaction, { 
  foreignKey: 'rider_id', 
  as: 'transactions' 
});

Station.hasMany(Transaction, { 
  foreignKey: 'station_id', 
  as: 'transactions' 
});

Transaction.belongsTo(Rider, { 
  foreignKey: 'rider_id', 
  as: 'rider' 
});

Transaction.belongsTo(Station, { 
  foreignKey: 'station_id', 
  as: 'station' 
});

// Define the reciprocal many-to-many relationship explicitly.
// Transactions is the association table and stores user-submittable fields
// such as amount, liters, status, notes, and payment metadata.
Rider.belongsToMany(Station, {
  through: Transaction,
  foreignKey: 'rider_id',
  otherKey: 'station_id',
  as: 'stations',
});

Station.belongsToMany(Rider, {
  through: Transaction,
  foreignKey: 'station_id',
  otherKey: 'rider_id',
  as: 'riders',
});

module.exports = {
  Rider,
  Station,
  Transaction
};
