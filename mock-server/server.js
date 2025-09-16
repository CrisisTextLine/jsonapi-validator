import express from 'express';
import cors from 'cors';
import { articlesRouter } from './routes/articles.js';
import { peopleRouter } from './routes/people.js';
import { commentsRouter } from './routes/comments.js';
import { invalidRouter } from './routes/invalid.js';

const app = express();
const PORT = 3001;

// Middleware
app.use(cors());
app.use(express.json({ type: 'application/vnd.api+json' }));
app.use(express.json()); // Also accept regular JSON for testing

// Custom middleware to validate JSON:API content-type for write operations
app.use((req, res, next) => {
  if (['POST', 'PATCH', 'PUT'].includes(req.method)) {
    const contentType = req.get('Content-Type');
    if (contentType && !contentType.includes('application/vnd.api+json')) {
      return res.status(415).json({
        errors: [{
          status: '415',
          title: 'Unsupported Media Type',
          detail: 'Request must include Content-Type: application/vnd.api+json'
        }]
      });
    }
  }
  next();
});

// Set JSON:API content type for all responses
app.use((req, res, next) => {
  res.set('Content-Type', 'application/vnd.api+json');
  next();
});

// API Routes
app.use('/api', articlesRouter);
app.use('/api', peopleRouter);
app.use('/api', commentsRouter);
app.use('/api', invalidRouter);

// Root endpoint with JSON:API info
app.get('/api', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    meta: {
      description: 'Mock JSON:API server for testing validation',
      endpoints: [
        '/api/articles',
        '/api/articles/{id}', 
        '/api/articles/{id}/author',
        '/api/articles/{id}/comments',
        '/api/people/{id}',
        '/api/comments/{id}',
        '/api/invalid/* (for testing validation errors)'
      ]
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler with JSON:API format
app.use((req, res) => {
  res.status(404).json({
    jsonapi: { version: '1.1' },
    errors: [{
      status: '404',
      title: 'Not Found',
      detail: `The resource ${req.path} was not found on this server`
    }]
  });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    jsonapi: { version: '1.1' },
    errors: [{
      status: '500',
      title: 'Internal Server Error',
      detail: 'An unexpected error occurred'
    }]
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Mock JSON:API server running on http://localhost:${PORT}`);
  console.log(`📚 API root: http://localhost:${PORT}/api`);
  console.log(`💚 Health check: http://localhost:${PORT}/health`);
});