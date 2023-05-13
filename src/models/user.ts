import { z } from 'zod';
import db from '../db';

export const UserSchema = z.object({
  id: z.number(),
  username: z.string(),
  password: z.string(),
  createdAt: z.instanceof(Date),
  updatedAt: z.instanceof(Date),
});

export const CreateUserInputSchema = UserSchema.omit(
  {
    id: true, createdAt: true, updatedAt: true,
  },
);

export type User = z.infer<typeof UserSchema>;
export type CreateUserInput = z.infer<typeof CreateUserInputSchema>;

export function createUser(input: CreateUserInput): User {
  const { username, password } = input;
  const createdAt = new Date();
  const updatedAt = createdAt;

  const insert = db.prepare(`
    INSERT INTO Users (username, password, createdAt, updatedAt)
    VALUES (@username, @password, @createdAt, @updatedAt)
  `);
  const id: number | bigint = insert.run(
    { username, password, createdAt, updatedAt },
  ).lastInsertRowid;

  if (typeof id === 'bigint') {
    throw new Error('Created enough users that next id is a bigint...');
  }

  return { id, username, password, createdAt, updatedAt };
}

export function getUserById(id: number): User | undefined {
  const row = db.prepare('SELECT * FROM Users WHERE id = ?').get(id);
  return row ? UserSchema.parse(row) : undefined;
}

export function updateUser(id: number, update: Partial<CreateUserInput>): User {
  const existingUser = getUserById(id);
  if (!existingUser) {
    throw new Error(`No user with id ${id}`);
  }

  const updatedUser: User = {
    ...existingUser,
    ...update,
    updatedAt: new Date(),
  };

  const updatedUserStmt = db.prepare(`
    UPDATE Users
    SET username = @username, password = @password, updatedAt = @updatedAt
    WHERE id = @id
  `);
  updatedUserStmt.run(updatedUser);

  return updatedUser;
}

export function deleteUser(id: number): boolean {
  const deleteStmt = db.prepare('DELETE FROM Users WHERE id = ?');
  const { changes } = deleteStmt.run(id);
  return changes > 0;
}
