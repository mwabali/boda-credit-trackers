const { Sequelize } = require('sequelize');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected (SQLite).');
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection };