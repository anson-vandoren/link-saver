const jwt = require('jsonwebtoken');

function authenticate(req, res, next) {
  // Get the token from the 'Authorization' header
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  // If there's no token, send a 401 Unauthorized response
  if (!token) {
    return res.status(401).json({ error: { message: 'Authentication required' } });
  }

  // Verify the token
  jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
    // If the token is invalid or expired, send a 403 Forbidden response
    if (err) {
      return res.status(403).json({ error: { message: 'Invalid or expired token' } });
    }

    // If the token is valid, attach the user to the request and call the next middleware
    req.user = user;
    next();
  });
}

module.exports = authenticate;
