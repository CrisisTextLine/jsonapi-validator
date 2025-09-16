import express from 'express';
import { people, findById } from '../data/sampleData.js';

const router = express.Router();

// GET /api/people/:id - Get individual person
router.get('/people/:id', (req, res) => {
  try {
    const person = findById(people, req.params.id);
    
    if (!person) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Person with id '${req.params.id}' not found`
        }]
      });
    }
    
    res.json({
      jsonapi: { version: '1.1' },
      data: person,
      links: {
        self: `/api/people/${req.params.id}`
      }
    });
  } catch (error) {
    res.status(500).json({
      jsonapi: { version: '1.1' },
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: error.message
      }]
    });
  }
});

// GET /api/people - List people (optional endpoint)
router.get('/people', (req, res) => {
  try {
    res.json({
      jsonapi: { version: '1.1' },
      data: people,
      links: {
        self: '/api/people'
      },
      meta: {
        total: people.length
      }
    });
  } catch (error) {
    res.status(500).json({
      jsonapi: { version: '1.1' },
      errors: [{
        status: '500',
        title: 'Internal Server Error',
        detail: error.message
      }]
    });
  }
});

export { router as peopleRouter };