// JSON:API middleware for content-type validation and response formatting

function jsonApiMiddleware(req, res, next) {
  // Set JSON:API content type for responses
  res.setHeader('Content-Type', 'application/vnd.api+json');
  
  // Validate content-type for POST, PATCH, PUT requests
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    
    // JSON:API spec requires exact content-type match
    if (contentType && !contentType.includes('application/vnd.api+json')) {
      return res.status(415).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '415',
          title: 'Unsupported Media Type',
          detail: 'JSON:API requires the "application/vnd.api+json" media type for request bodies',
          source: {
            header: 'Content-Type'
          }
        }]
      });
    }
  }
  
  // Add helper methods to response object
  res.jsonapi = function(data, options = {}) {
    const response = {
      jsonapi: { version: '1.1' }
    };
    
    if (data.errors) {
      response.errors = data.errors;
    } else {
      response.data = data.data || data;
      
      if (data.included) {
        response.included = data.included;
      }
      
      if (data.links) {
        response.links = data.links;
      }
      
      if (data.meta) {
        response.meta = data.meta;
      }
    }
    
    // Add self link if not present and we have request info
    if (response.data && !response.links && req) {
      response.links = {
        self: `${req.protocol}://${req.get('host')}${req.originalUrl}`
      };
    }
    
    return this.status(options.status || 200).json(response);
  };
  
  // Helper for error responses
  res.jsonApiError = function(errors, status = 400) {
    if (!Array.isArray(errors)) {
      errors = [errors];
    }
    
    return this.status(status).json({
      jsonapi: { version: '1.1' },
      errors: errors.map(error => ({
        status: status.toString(),
        title: error.title || 'Error',
        detail: error.detail || error.message || 'An error occurred',
        ...error
      }))
    });
  };
  
  next();
}

module.exports = jsonApiMiddleware;