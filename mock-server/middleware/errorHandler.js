// Error handling middleware for JSON:API responses

function errorHandler(err, req, res, next) {
  console.error('Error:', err);
  
  // Default error response
  const errorResponse = {
    jsonapi: { version: '1.1' },
    errors: [{
      status: '500',
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred',
      meta: {
        timestamp: new Date().toISOString()
      }
    }]
  };
  
  // Handle specific error types
  if (err.name === 'ValidationError') {
    errorResponse.errors[0].status = '400';
    errorResponse.errors[0].title = 'Validation Error';
    errorResponse.errors[0].detail = err.message;
  } else if (err.name === 'SyntaxError' && err.type === 'entity.parse.failed') {
    errorResponse.errors[0].status = '400';
    errorResponse.errors[0].title = 'Invalid JSON';
    errorResponse.errors[0].detail = 'Request body contains invalid JSON';
  } else if (err.status) {
    errorResponse.errors[0].status = err.status.toString();
    errorResponse.errors[0].title = err.title || 'Error';
    errorResponse.errors[0].detail = err.message || err.detail;
  }
  
  // Send error response
  const status = parseInt(errorResponse.errors[0].status) || 500;
  res.status(status).json(errorResponse);
}

module.exports = errorHandler;