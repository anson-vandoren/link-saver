import { Sequelize } from 'sequelize';
import logger from './logger.js';

const DB_PATH = process.env.DB_PATH || './dev.sqlite3';
logger.info('Opening database at', { DB_PATH });

const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: DB_PATH,
  logging: (msg) => logger.silly(msg),
});

export default sequelize;
