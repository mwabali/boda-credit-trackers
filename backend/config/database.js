const { Sequelize } = require('sequelize');

const DEFAULT_SQLITE_STORAGE =
  process.env.SQLITE_STORAGE_PATH || './database.sqlite';

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DEFAULT_SQLITE_STORAGE,
  logging: false
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(`✅ Database connected (SQLite: ${DEFAULT_SQLITE_STORAGE}).`);
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };
