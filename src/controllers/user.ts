import { compare, hash } from 'bcrypt';
import { createJwtToken } from '../jwt';
import logger from '../logger';
import type { Token } from '../schemas/user';
import type { DbContext } from '../db';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET not found');

export async function registerUser(db: DbContext, username: string, password: string): Promise<Token> {
  if (db.User.hasRegisteredUsers()) {
    logger.warn('Registration is closed');
    throw new Error('Registration is closed');
  }

  // in case we allow multiple users later on...
  const existingUser = db.User.getByUsername(username);
  if (existingUser) {
    logger.warn('User already exists', { username });
    throw new Error('User already exists');
  }

  const hashedPassword = await hash(password, 10);
  const user = db.User.create(username, hashedPassword);

  const token = createJwtToken(user);

  return { token };
}

export async function loginUser(db: DbContext, username: string, password: string): Promise<Token> {
  const user = db.User.getByUsername(username);
  if (!user) {
    logger.warn('User does not exist', { username });
    throw new Error('Invalid username or password');
  }

  const passwordMatches = await compare(password, user.password);
  if (!passwordMatches) {
    logger.warn('Password does not match', { username });
    throw new Error('Invalid username or password');
  }

  const token = createJwtToken(user);

  return { token };
}

export async function changePassword(db: DbContext, username: string, password: string, newPassword: string): Promise<Token> {
  const user = db.User.getByUsername(username);
  if (!user) {
    logger.warn('User does not exist', { username });
    throw new Error('Invalid username or password');
  }

  const passwordMatches = await compare(password, user.password);
  if (!passwordMatches) {
    logger.warn('Password does not match', { username });
    throw new Error('Invalid username or password');
  }

  const hashedPassword = await hash(newPassword, 10);
  user.password = hashedPassword;

  db.User.update(user.id, user);

  const token = createJwtToken(user);

  return { token };
}
