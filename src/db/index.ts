import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
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

function createDbConnection(dbLoc: string) {
  logger.info('Opening database at', { path: dbLoc });
  const db = new Database(dbLoc, { verbose: logger.silly });
  db.pragma('journal_mode = WAL');
  createTables(db);
  return db;
}

let dirname;
if (typeof import.meta.url !== 'undefined') {
  console.log(import.meta);
  dirname = path.dirname(new URL(import.meta.url).pathname);
} else {
  dirname = __dirname;
}
const dbName = 'pagepouch.sqlite3';
const dbPath = path.join(dirname, '..', '..', 'data', dbName);
const dbDir = path.dirname(path.resolve(dbPath));
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

function getDbInstance(): DbType {
  if (process.env.NODE_ENV === 'test') {
    const testDb = createDbConnection(':memory:');
    return testDb;
  }
  if (process.env.NODE_ENV === 'dev') {
    return createDbConnection('dev.sqlite3');
  }
  return createDbConnection(dbPath);
}

export class DbContext {
  public Link: LinkModel;
  public LinkTag: LinkTagModel;
  public Tag: TagModel;
  public User: UserModel;
  // eslint-disable-next-line no-use-before-define
  private static _instance: DbContext | undefined;

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

  static create(): DbContext {
    if (!DbContext._instance) {
      DbContext._instance = new DbContext(getDbInstance());
    }
    return DbContext._instance;
  }
}
