import { verify } from 'jsonwebtoken';
import logger from '../logger.ts';

function authenticate(req, res, next) {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  // Verify the token
  verify(token, process.env.JWT_SECRET, (err, user) => {
    if (err) {
      logger.warn('Error verifying token', { token, error: err });
      res.status(403).json({ error: { message: 'Invalid or expired token' } });
      return;
    }

    // If the token is valid, attach the user to the request and call the next middleware
    req.user = user;
  });
  return next();
}

async function authenticateOptional(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = verify(token, process.env.JWT_SECRET);
    req.user = decoded;
  } catch (error) {
    logger.warn('Error verifying token. Setting user as null', { token, error });
    req.user = null;
  }
  return next();
}

export {
  authenticate,
  authenticateOptional,
};
