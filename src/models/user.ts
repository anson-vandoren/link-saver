import type { Database } from 'better-sqlite3';
import { UserSchema } from '../schemas/user';
import type { CreateUserInput, User } from '../schemas/user';

function createUser(db: Database, username: string, hashedPassword: string): User {
  const createdAt = Date.now();
  const updatedAt = createdAt;

  const insert = db.prepare(`
    INSERT INTO Users (username, password, createdAt, updatedAt)
    VALUES (@username, @password, @createdAt, @updatedAt)
  `);
  const id: number | bigint = insert.run(
    { username, password: hashedPassword, createdAt, updatedAt },
  ).lastInsertRowid;

  if (typeof id === 'bigint') {
    throw new Error('Created enough users that next id is a bigint...');
  }

  return { id, username, password: hashedPassword, createdAt, updatedAt };
}

function getUserById(db: Database, id: number): User | undefined {
  const row = db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
  return row ? UserSchema.parse(row) : undefined;
}

function getUserByUsername(db: Database, username: string): User | undefined {
  const row = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
  return row ? UserSchema.parse(row) : undefined;
}

function hasRegisteredUsers(db: Database): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM Users').get() as { count: number };
  return row.count === 1;
}

function updateUser(db: Database, id: number, update: Partial<CreateUserInput>): User {
  const existingUser = getUserById(db, id);
  if (!existingUser) {
    throw new Error(`No user with id ${id}`);
  }

  const updatedUser: User = {
    ...existingUser,
    ...update,
    updatedAt: Date.now(),
  };

  const updatedUserStmt = db.prepare(`
    UPDATE Users
    SET username = @username, password = @password, updatedAt = @updatedAt
    WHERE id = @id
  `);
  updatedUserStmt.run(updatedUser);

  return updatedUser;
}

function deleteUser(db: Database, id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Users WHERE id = ?');
  const { changes } = deleteStmt.run(id);
  return changes > 0;
}

export class UserModel {
  constructor(private db: Database) { }

  create(username: string, hashedPassword: string): User {
    return createUser(this.db, username, hashedPassword);
  }

  getById(id: number): User | undefined {
    return getUserById(this.db, id);
  }

  getByUsername(username: string): User | undefined {
    return getUserByUsername(this.db, username);
  }

  hasRegisteredUsers(): boolean {
    return hasRegisteredUsers(this.db);
  }

  update(id: number, update: Partial<CreateUserInput>): User {
    return updateUser(this.db, id, update);
  }

  delete(id: number): boolean {
    return deleteUser(this.db, id);
  }
}
