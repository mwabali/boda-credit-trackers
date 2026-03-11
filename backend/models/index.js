const Rider = require('./Rider');
const Station = require('./Station');
const Transaction = require('./Transaction');

// Define relationships
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

module.exports = {
  Rider,
  Station,
  Transaction
};