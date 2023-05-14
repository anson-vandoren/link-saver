import Database from 'better-sqlite3';
import logger from '../logger';
import { createUsersTableSQL, createLinkTagsTableSQL, createLinksTableSQL, createTagsTableSQL } from './tables';

const DB_PATH = process.env.DB_PATH || './dev.sqlite3';
logger.info('Opening database at', { DB_PATH });
const db = new Database(DB_PATH, { verbose: logger.silly });
db.pragma('journal_mode = WAL');

export function createTables() {
  db.exec(createUsersTableSQL);
  db.exec(createLinksTableSQL);
  db.exec(createLinkTagsTableSQL);
  db.exec(createTagsTableSQL);
}

export default db;
