import jwt from 'jsonwebtoken';
import type { User } from './schemas/user';
import logger from './logger';
import type { DbContext } from './db';

export function decodeAndVerifyJwtToken(db: DbContext, token: string): User {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET env var. Set it and restart the server');
  }

  // Verify the token, decode it and return the user
  // TODO: correctly type the JWT payload and look at security best practices here.
  const decodedPayload = jwt.verify(token, JWT_SECRET) as { id: number };
  const user = db.User.getById(decodedPayload.id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}

export function createJwtToken(user: User): string {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET env var. Set it and restart the server');
  }

  const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '1d' });
  logger.info('Created JWT token for user', { username: user.username, id: user.id });

  return token;
}
