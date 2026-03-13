const express = require('express');
const cors = require('cors');
require('dotenv').config(); 

const { sequelize, testConnection } = require('./config/database');
const { Rider, Station, Transaction } = require('./models');

const riderRoutes = require('./routes/riders');
const stationRoutes = require('./routes/stations');
const transactionRoutes = require('./routes/transactions');
const router = require('./routes/riders');

const app = express();
const PORT = process.env.PORT || 5050;

async function ensureStationCompanyColumn() {
  const queryInterface = sequelize.getQueryInterface();
  const stationTable = await queryInterface.describeTable('stations');

  if (!stationTable.company_name) {
    await queryInterface.addColumn('stations', 'company_name', {
      type: require('sequelize').DataTypes.STRING(100),
      allowNull: false,
      defaultValue: 'Total',
    });
  }
}

app.use(cors());
app.use(express.json());

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Boda Credit Tracker API', status: 'running' });
});

app.use('/riders', riderRoutes);
app.use('/stations', stationRoutes);
app.use('/transactions', transactionRoutes);

// Start
const start = async () => {
  await testConnection();
  
  // Sync models (create tables)
  await Rider.sync();
  await Station.sync();
  await Transaction.sync();
  await ensureStationCompanyColumn();
  console.log('✅ Tables ready');
  
  const server = app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
  });

  server.on('error', (error) => {
    if (error.code === 'EADDRINUSE') {
      console.error(
        `❌ Port ${PORT} is already in use. Update backend/.env or stop the other process using that port.`
      );
      process.exit(1);
    }

    throw error;
  });
};

start();
