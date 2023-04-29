import logger from '../logger.js';

function errorHandler(err, _req, res, _next) {
  logger.error('Error in request', { error: err.stack });

  // You can add more specific error handling based on the error type.
  // For example, you can handle ValidationError from a validation library differently.

  res.status(500).json({ error: { message: 'An internal server error occurred.' } });
}

export default errorHandler;
