import express from 'express';
import { comments, findById } from '../data/sampleData.js';

const router = express.Router();

// GET /api/comments/:id - Get individual comment
router.get('/comments/:id', (req, res) => {
  try {
    const comment = findById(comments, req.params.id);
    
    if (!comment) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Comment with id '${req.params.id}' not found`
        }]
      });
    }
    
    res.json({
      jsonapi: { version: '1.1' },
      data: comment,
      links: {
        self: `/api/comments/${req.params.id}`
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

// GET /api/comments - List comments (optional endpoint)
router.get('/comments', (req, res) => {
  try {
    res.json({
      jsonapi: { version: '1.1' },
      data: comments,
      links: {
        self: '/api/comments'
      },
      meta: {
        total: comments.length
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

export { router as commentsRouter };