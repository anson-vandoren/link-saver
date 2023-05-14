import { compare, hash } from 'bcrypt';
import { createJwtToken } from '../jwt';
import logger from '../logger';
import { createUser, getUserByUsername, hasRegisteredUsers, updateUser } from '../models/user';
import type { Token } from '../schemas/user';

const jwtSecret = process.env.JWT_SECRET;
if (!jwtSecret) throw new Error('JWT_SECRET not found');

export async function registerUser(username: string, password: string): Promise<Token> {
  if (hasRegisteredUsers()) {
    logger.warn('Registration is closed');
    throw new Error('Registration is closed');
  }

  // in case we allow multiple users later on...
  const existingUser = getUserByUsername(username);
  if (existingUser) {
    logger.warn('User already exists', { username });
    throw new Error('User already exists');
  }

  const hashedPassword = await hash(password, 10);
  const user = createUser(username, hashedPassword);

  const token = createJwtToken(user);

  return { token };
}

export async function loginUser(username: string, password: string): Promise<Token> {
  const user = getUserByUsername(username);
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

export async function changePassword(username: string, password: string, newPassword: string): Promise<Token> {
  const user = getUserByUsername(username);
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

  updateUser(user.id, user);

  const token = createJwtToken(user);

  return { token };
}
