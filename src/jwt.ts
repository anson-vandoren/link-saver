import { verify } from 'jsonwebtoken';
import { User, getUserById } from './models/user';

export function decodeAndVerifyJwtToken(token: string): User {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET env var. Set it and restart the server');
  }

  // Verify the token, decode it and return the user
  // TODO: correctly type the JWT payload and look at security best practices here.
  const decodedPayload = verify(token, JWT_SECRET) as { id: number };
  const user = getUserById(decodedPayload.id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
