import { verify } from 'jsonwebtoken';
import User from './models/user';

export async function decodeAndVerifyJwtToken(token: string): Promise<User> {
  const { JWT_SECRET } = process.env;
  if (!JWT_SECRET) {
    throw new Error('Missing JWT_SECRET env var. Set it and restart the server');
  }

  // Verify the token, decode it and return the user
  // TODO: correctly type the JWT payload and look at security best practices here.
  const decodedPayload = verify(token, JWT_SECRET) as { id: number };
  const user = await User.findByPk(decodedPayload.id);

  if (!user) {
    throw new Error('User not found');
  }

  return user;
}
