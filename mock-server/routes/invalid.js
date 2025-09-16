import express from 'express';

const router = express.Router();

// Intentionally invalid endpoints for testing validator's error detection

// Invalid endpoint: Missing required jsonapi member
router.get('/invalid/no-jsonapi', (req, res) => {
  res.json({
    data: [{
      id: '1',
      type: 'articles',
      attributes: { title: 'Test Article' }
    }]
  });
});

// Invalid endpoint: Wrong content-type
router.get('/invalid/wrong-content-type', (req, res) => {
  res.set('Content-Type', 'application/json');
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      type: 'articles',
      attributes: { title: 'Test Article' }
    }]
  });
});

// Invalid endpoint: Missing required id field
router.get('/invalid/missing-id', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      type: 'articles',
      attributes: { title: 'Test Article' }
    }]
  });
});

// Invalid endpoint: Missing required type field
router.get('/invalid/missing-type', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      attributes: { title: 'Test Article' }
    }]
  });
});

// Invalid endpoint: Both data and errors at top level
router.get('/invalid/data-and-errors', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      type: 'articles',
      attributes: { title: 'Test Article' }
    }],
    errors: [{
      status: '400',
      title: 'This should not be here with data'
    }]
  });
});

// Invalid endpoint: Malformed relationship
router.get('/invalid/malformed-relationship', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      type: 'articles',
      attributes: { title: 'Test Article' },
      relationships: {
        author: {
          // Missing 'data' or 'links' - invalid relationship
          invalid: 'this is wrong'
        }
      }
    }]
  });
});

// Invalid endpoint: Invalid error object structure
router.get('/invalid/malformed-errors', (req, res) => {
  res.status(422).json({
    jsonapi: { version: '1.1' },
    errors: [
      'This should be an object, not a string'
    ]
  });
});

// Invalid endpoint: Empty document (no data, errors, or meta)
router.get('/invalid/empty-document', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' }
  });
});

// Invalid endpoint: Invalid member names (containing reserved characters)
router.get('/invalid/reserved-chars', (req, res) => {
  res.json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      type: 'articles',
      attributes: {
        'invalid-underscore_': 'Should not have trailing underscore',
        'invalid-hyphen-': 'Should not have trailing hyphen'
      }
    }]
  });
});

// Endpoint that simulates server timeout/slow response
router.get('/invalid/timeout', (req, res) => {
  // Don't respond for 30 seconds to test timeout handling
  setTimeout(() => {
    res.json({
      jsonapi: { version: '1.1' },
      data: [{
        id: '1',
        type: 'articles',
        attributes: { title: 'Finally responded' }
      }]
    });
  }, 30000);
});

// Invalid endpoint: Status code mismatch
router.get('/invalid/status-mismatch', (req, res) => {
  // Return 500 status but with success data
  res.status(500).json({
    jsonapi: { version: '1.1' },
    data: [{
      id: '1',
      type: 'articles',
      attributes: { title: 'This should be an error response' }
    }]
  });
});

export { router as invalidRouter };