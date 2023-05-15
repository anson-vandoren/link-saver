import db from '../db';
import { UserSchema } from '../schemas/user';
import type { CreateUserInput, User } from '../schemas/user';

export function createUser(username: string, hashedPassword: string): User {
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

export function getUserById(id: number): User | undefined {
  const row = db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
  return row ? UserSchema.parse(row) : undefined;
}

export function getUserByUsername(username: string): User | undefined {
  const row = db.prepare('SELECT * FROM Users WHERE username = ?').get(username);
  return row ? UserSchema.parse(row) : undefined;
}

export function hasRegisteredUsers(): boolean {
  const row = db.prepare('SELECT COUNT(*) AS count FROM Users').get() as { count: number };
  return row.count === 1;
}

export function updateUser(id: number, update: Partial<CreateUserInput>): User {
  const existingUser = getUserById(id);
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

function _deleteUser(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Users WHERE id = ?');
  const { changes } = deleteStmt.run(id);
  return changes > 0;
}
