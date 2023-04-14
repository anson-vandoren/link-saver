function errorHandler(err, req, res, next) {
  console.error(err.stack);

  // You can add more specific error handling based on the error type.
  // For example, you can handle ValidationError from a validation library differently.

  res.status(500).json({
    error: {
      message: 'An internal server error occurred.',
    },
  });
}

module.exports = errorHandler;
