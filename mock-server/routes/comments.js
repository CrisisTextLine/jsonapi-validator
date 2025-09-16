const express = require('express');
const router = express.Router();
const { findById, includeRelatedResources } = require('../data/mockData');

// Helper function to include related resources for comments
function includeCommentRelatedResources(comments, includeParam) {
  if (!includeParam) return [];
  
  const includes = includeParam.split(',').map(s => s.trim());
  const included = [];
  const addedIds = new Set();
  
  const commentsArray = Array.isArray(comments) ? comments : [comments];
  
  commentsArray.forEach(comment => {
    includes.forEach(includePath => {
      if (includePath === 'author' && comment.relationships?.author?.data) {
        const authorData = comment.relationships.author.data;
        const author = findById('people', authorData.id);
        if (author && !addedIds.has(`${author.type}-${author.id}`)) {
          included.push(author);
          addedIds.add(`${author.type}-${author.id}`);
        }
      } else if (includePath === 'article' && comment.relationships?.article?.data) {
        const articleData = comment.relationships.article.data;
        const article = findById('articles', articleData.id);
        if (article && !addedIds.has(`${article.type}-${article.id}`)) {
          included.push(article);
          addedIds.add(`${article.type}-${article.id}`);
        }
      }
    });
  });
  
  return included;
}

// GET /comments/:id - Single comment resource
router.get('/:id', (req, res) => {
  try {
    const comment = findById('comments', req.params.id);
    
    if (!comment) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Comment with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    // Apply sparse fieldsets
    const fields = req.query['fields[comments]'] ? req.query['fields[comments]'].split(',') : null;
    let filteredComment = comment;
    
    if (fields) {
      filteredComment = {
        type: comment.type,
        id: comment.id,
        links: comment.links
      };
      
      if (fields.includes('attributes') && comment.attributes) {
        filteredComment.attributes = comment.attributes;
      }
      
      if (fields.includes('relationships') && comment.relationships) {
        filteredComment.relationships = comment.relationships;
      }
    }
    
    // Include related resources
    const included = includeCommentRelatedResources(comment, req.query.include);
    
    const response = { data: filteredComment };
    if (included.length > 0) {
      response.included = included;
    }
    
    res.jsonapi(response);
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// GET /comments/:id/author - Related author resource
router.get('/:id/author', (req, res) => {
  try {
    const comment = findById('comments', req.params.id);
    
    if (!comment) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Comment with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    if (!comment.relationships?.author?.data) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: 'Author not found for this comment',
        source: { pointer: '/data/relationships/author' }
      }, 404);
    }
    
    const author = findById('people', comment.relationships.author.data.id);
    
    if (!author) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: 'Author resource not found',
        source: { pointer: '/data/relationships/author' }
      }, 404);
    }
    
    res.jsonapi({ data: author });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// GET /comments/:id/article - Related article resource
router.get('/:id/article', (req, res) => {
  try {
    const comment = findById('comments', req.params.id);
    
    if (!comment) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Comment with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    if (!comment.relationships?.article?.data) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: 'Article not found for this comment',
        source: { pointer: '/data/relationships/article' }
      }, 404);
    }
    
    const article = findById('articles', comment.relationships.article.data.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: 'Article resource not found',
        source: { pointer: '/data/relationships/article' }
      }, 404);
    }
    
    res.jsonapi({ data: article });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// Test endpoint with wrong content-type header for negative testing
router.get('/:id/invalid-content-type', (req, res) => {
  res.setHeader('Content-Type', 'application/json'); // Wrong content type
  res.json({
    jsonapi: { version: '1.1' },
    data: {
      type: 'comments',
      id: req.params.id,
      attributes: {
        body: 'This response has wrong content-type'
      }
    }
  });
});

module.exports = router;