const { Sequelize } = require('sequelize');

const DATABASE_URL = process.env.DATABASE_URL;
const DEFAULT_SQLITE_STORAGE =
  process.env.SQLITE_STORAGE_PATH || './database.sqlite';

const usingPostgres = Boolean(DATABASE_URL);

const sequelize = usingPostgres
  ? new Sequelize(DATABASE_URL, {
      dialect: 'postgres',
      protocol: 'postgres',
      logging: false,
      dialectOptions: {
        ssl: {
          require: true,
          rejectUnauthorized: false,
        },
      },
    })
  : new Sequelize({
      dialect: 'sqlite',
      storage: DEFAULT_SQLITE_STORAGE,
      logging: false,
    });

const testConnection = async () => {
  try {
    await sequelize.authenticate();
    console.log(
      usingPostgres
        ? '✅ Database connected (Postgres).'
        : `✅ Database connected (SQLite: ${DEFAULT_SQLITE_STORAGE}).`
    );
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
};

module.exports = { sequelize, testConnection, usingPostgres };
