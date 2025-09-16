const express = require('express');
const cors = require('cors');
const path = require('path');

// Import route modules
const articlesRoutes = require('./routes/articles');
const peopleRoutes = require('./routes/people');
const commentsRoutes = require('./routes/comments');

// Import middleware
const jsonApiMiddleware = require('./middleware/jsonapi');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ type: 'application/vnd.api+json' }));
app.use(express.json()); // Also accept regular JSON for testing
app.use(jsonApiMiddleware);

// Routes
app.use('/articles', articlesRoutes);
app.use('/people', peopleRoutes);
app.use('/comments', commentsRoutes);

// Root endpoint with JSON:API information
app.get('/', (req, res) => {
  res.json({
    jsonapi: {
      version: '1.1'
    },
    data: {
      type: 'api-info',
      id: '1',
      attributes: {
        name: 'JSON:API Mock Server',
        description: 'A mock server providing JSON:API compliant responses for testing',
        version: '1.0.0'
      },
      links: {
        self: `${req.protocol}://${req.get('host')}${req.originalUrl}`,
        documentation: 'https://github.com/CrisisTextLine/jsonapi-validator/blob/main/mock-server/README.md'
      }
    },
    links: {
      articles: `${req.protocol}://${req.get('host')}/articles`,
      people: `${req.protocol}://${req.get('host')}/people`,
      comments: `${req.protocol}://${req.get('host')}/comments`
    },
    meta: {
      copyright: '2025 Crisis Text Line',
      license: 'MIT',
      endpoints: [
        'GET /articles',
        'GET /articles/{id}',
        'POST /articles',
        'PATCH /articles/{id}',
        'DELETE /articles/{id}',
        'GET /articles/{id}/author',
        'GET /articles/{id}/comments',
        'GET /people/{id}',
        'GET /comments/{id}'
      ]
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling
app.use(errorHandler);

// 404 handler - must be last
app.use((req, res) => {
  res.status(404).json({
    jsonapi: { version: '1.1' },
    errors: [{
      status: '404',
      title: 'Not Found',
      detail: `The requested resource '${req.originalUrl}' was not found on this server.`,
      source: {
        pointer: req.originalUrl
      }
    }]
  });
});

app.listen(PORT, () => {
  console.log(`JSON:API Mock Server running on port ${PORT}`);
  console.log(`Visit http://localhost:${PORT} for API information`);
  console.log(`Available endpoints:`);
  console.log(`  GET /articles - Collection of articles`);
  console.log(`  GET /articles/{id} - Single article`);
  console.log(`  GET /articles/{id}/author - Article's author`);
  console.log(`  GET /articles/{id}/comments - Article's comments`);
  console.log(`  GET /people/{id} - Person resource`);
  console.log(`  GET /comments/{id} - Comment resource`);
  console.log(`  POST /articles - Create article`);
  console.log(`  PATCH /articles/{id} - Update article`);
  console.log(`  DELETE /articles/{id} - Delete article`);
});

module.exports = app;