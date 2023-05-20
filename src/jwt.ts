import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import type { User } from './schemas/user';
import logger from './logger';
import type { DbContext } from './db';

const JWT_SECRET = crypto.randomBytes(64).toString('hex');

export function decodeAndVerifyJwtToken(db: DbContext, token: string): User {
  // Verify the token, decode it and return the user
  // TODO: correctly type the JWT payload and look at security best practices here.
  const decodedPayload = jwt.verify(token, JWT_SECRET) as { id: number };
  const user = db.User.getById(decodedPayload.id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export function createJwtToken(db: DbContext, user: User): string {
  const lookupUser = db.User.getById(user.id);
  if (!lookupUser) {
    throw new Error('User not found');
  }
  if (lookupUser.username !== user.username) {
    throw new Error('Username does not match');
  }
  if (lookupUser.password !== user.password) {
    throw new Error('Password does not match');
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  logger.info('Created JWT token for user', { username: user.username, id: user.id });

  return token;
}
