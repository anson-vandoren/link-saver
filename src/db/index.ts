import Database from 'better-sqlite3';
import type { Database as DbType } from 'better-sqlite3';
import logger from '../logger';
import { createUsersTableSQL, createLinkTagsTableSQL, createLinksTableSQL, createTagsTableSQL } from './tables';
import { LinkModel } from '../models/link';
import { LinkTagModel } from '../models/linkTag';
import { TagModel } from '../models/tag';
import { UserModel } from '../models/user';

function createTables(db: DbType) {
  db.exec(createUsersTableSQL);
  db.exec(createLinksTableSQL);
  db.exec(createLinkTagsTableSQL);
  db.exec(createTagsTableSQL);
}

function createDbConnection(path: string) {
  logger.info('Opening database at', { path });
  const db = new Database(path, { verbose: logger.silly });
  db.pragma('journal_mode = WAL');
  createTables(db);
  return db;
}

const DB_PATH = process.env.DB_PATH || './dev.sqlite3';
const db = createDbConnection(DB_PATH);

function getDbInstance(): DbType {
  if (process.env.NODE_ENV === 'test') {
    const testDb = createDbConnection(':memory:');
    return testDb;
  }
  if (process.env.NODE_ENV === 'development') {
    return db;
  }
  throw new Error('Need to implement production database context');
}

export class DbContext {
  public Link: LinkModel;
  public LinkTag: LinkTagModel;
  public Tag: TagModel;
  public User: UserModel;

  constructor(private _db: DbType) {
    this.Link = new LinkModel(this._db);
    this.LinkTag = new LinkTagModel(this._db);
    this.Tag = new TagModel(this._db);
    this.User = new UserModel(this._db);
  }

  public getDb() {
    if (process.env.NODE_ENV === 'test') {
      return this._db;
    }
    throw new Error('Should not get underlying DB outside of test environment');
  }

  static create() {
    return new DbContext(getDbInstance());
  }
}
