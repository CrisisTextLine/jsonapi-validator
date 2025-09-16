const express = require('express');
const router = express.Router();
const { mockData, findById, addResource, updateResource, deleteResource, getRelatedResources } = require('../data/mockData');

// Helper function to build pagination links
function buildPaginationLinks(req, page, perPage, total) {
  const baseUrl = `${req.protocol}://${req.get('host')}${req.baseUrl}`;
  const totalPages = Math.ceil(total / perPage);
  
  const links = {
    self: `${baseUrl}?page[number]=${page}&page[size]=${perPage}`,
    first: `${baseUrl}?page[number]=1&page[size]=${perPage}`,
    last: `${baseUrl}?page[number]=${totalPages}&page[size]=${perPage}`
  };
  
  if (page > 1) {
    links.prev = `${baseUrl}?page[number]=${page - 1}&page[size]=${perPage}`;
  }
  
  if (page < totalPages) {
    links.next = `${baseUrl}?page[number]=${page + 1}&page[size]=${perPage}`;
  }
  
  return links;
}

// Helper function to apply sparse fieldsets
function applyFieldsets(resources, fields) {
  if (!fields || !Array.isArray(resources)) return resources;
  
  return resources.map(resource => {
    const filtered = {
      type: resource.type,
      id: resource.id,
      links: resource.links
    };
    
    if (fields.includes('attributes') && resource.attributes) {
      filtered.attributes = resource.attributes;
    }
    
    if (fields.includes('relationships') && resource.relationships) {
      filtered.relationships = resource.relationships;
    }
    
    return filtered;
  });
}

// Helper function to include related resources
function includeRelatedResources(resources, includeParam) {
  if (!includeParam) return [];
  
  const includes = includeParam.split(',').map(s => s.trim());
  const included = [];
  const addedIds = new Set();
  
  resources.forEach(resource => {
    includes.forEach(includePath => {
      if (includePath === 'author' && resource.relationships?.author?.data) {
        const authorData = resource.relationships.author.data;
        const author = findById('people', authorData.id);
        if (author && !addedIds.has(`${author.type}-${author.id}`)) {
          included.push(author);
          addedIds.add(`${author.type}-${author.id}`);
        }
      } else if (includePath === 'comments' && resource.relationships?.comments?.data) {
        resource.relationships.comments.data.forEach(commentRef => {
          const comment = findById('comments', commentRef.id);
          if (comment && !addedIds.has(`${comment.type}-${comment.id}`)) {
            included.push(comment);
            addedIds.add(`${comment.type}-${comment.id}`);
          }
        });
      }
    });
  });
  
  return included;
}

// Helper function to apply sorting
function applySorting(resources, sortParam) {
  if (!sortParam) return resources;
  
  const sortFields = sortParam.split(',').map(field => {
    const isDesc = field.startsWith('-');
    const fieldName = isDesc ? field.substring(1) : field;
    return { field: fieldName, desc: isDesc };
  });
  
  return [...resources].sort((a, b) => {
    for (const { field, desc } of sortFields) {
      let aVal, bVal;
      
      if (field === 'id') {
        aVal = parseInt(a.id);
        bVal = parseInt(b.id);
      } else if (a.attributes && a.attributes[field]) {
        aVal = a.attributes[field];
        bVal = b.attributes[field];
      } else {
        continue;
      }
      
      if (aVal < bVal) return desc ? 1 : -1;
      if (aVal > bVal) return desc ? -1 : 1;
    }
    return 0;
  });
}

// GET /articles - Collection of articles with pagination, sorting, filtering, and includes
router.get('/', (req, res) => {
  try {
    let articles = [...mockData.articles];
    
    // Apply sorting
    if (req.query.sort) {
      articles = applySorting(articles, req.query.sort);
    }
    
    // Pagination
    const page = parseInt(req.query['page[number]']) || 1;
    const perPage = parseInt(req.query['page[size]']) || 10;
    const offset = (page - 1) * perPage;
    const total = articles.length;
    
    const paginatedArticles = articles.slice(offset, offset + perPage);
    
    // Apply sparse fieldsets
    const fields = req.query['fields[articles]'] ? req.query['fields[articles]'].split(',') : null;
    const filteredArticles = fields ? applyFieldsets(paginatedArticles, fields) : paginatedArticles;
    
    // Include related resources
    const included = includeRelatedResources(paginatedArticles, req.query.include);
    
    const response = {
      data: filteredArticles,
      links: buildPaginationLinks(req, page, perPage, total),
      meta: {
        pagination: {
          page,
          'per-page': perPage,
          'page-count': Math.ceil(total / perPage),
          'total-count': total
        }
      }
    };
    
    if (included.length > 0) {
      response.included = included;
    }
    
    res.jsonapi(response);
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// Test endpoint with intentionally invalid response for negative testing
router.get('/invalid-response', (req, res) => {
  // This violates JSON:API spec by having both data and errors
  res.json({
    jsonapi: { version: '1.1' },
    data: [{ type: 'articles', id: '1' }],
    errors: [{ title: 'This should not coexist with data' }]
  });
});

// GET /articles/:id - Single article resource
router.get('/:id', (req, res) => {
  try {
    const article = findById('articles', req.params.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Article with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    // Apply sparse fieldsets
    const fields = req.query['fields[articles]'] ? req.query['fields[articles]'].split(',') : null;
    const filteredArticle = fields ? applyFieldsets([article], fields)[0] : article;
    
    // Include related resources
    const included = includeRelatedResources([article], req.query.include);
    
    const response = { data: filteredArticle };
    if (included.length > 0) {
      response.included = included;
    }
    
    res.jsonapi(response);
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// GET /articles/:id/author - Related author resource
router.get('/:id/author', (req, res) => {
  try {
    const article = findById('articles', req.params.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Article with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    const author = getRelatedResources('articles', req.params.id, 'author');
    
    if (!author) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: 'Author not found for this article',
        source: { pointer: '/data/relationships/author' }
      }, 404);
    }
    
    res.jsonapi({ data: author });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// GET /articles/:id/comments - Related comments collection
router.get('/:id/comments', (req, res) => {
  try {
    const article = findById('articles', req.params.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Article with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    const comments = getRelatedResources('articles', req.params.id, 'comments') || [];
    
    res.jsonapi({ data: comments });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// POST /articles - Create a new article
router.post('/', (req, res) => {
  try {
    const { data } = req.body;
    
    if (!data || data.type !== 'articles') {
      return res.jsonApiError({
        status: '400',
        title: 'Bad Request',
        detail: 'Invalid resource type. Expected "articles"',
        source: { pointer: '/data/type' }
      }, 400);
    }
    
    if (!data.attributes) {
      return res.jsonApiError({
        status: '400',
        title: 'Bad Request',
        detail: 'Missing required attributes',
        source: { pointer: '/data/attributes' }
      }, 400);
    }
    
    const newArticle = {
      type: 'articles',
      attributes: {
        ...data.attributes,
        created: new Date().toISOString(),
        updated: new Date().toISOString()
      },
      relationships: data.relationships || {},
      links: {}
    };
    
    const createdArticle = addResource('articles', newArticle);
    createdArticle.links.self = `/articles/${createdArticle.id}`;
    
    res.jsonapi({ data: createdArticle }, { status: 201 });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// PATCH /articles/:id - Update an article
router.patch('/:id', (req, res) => {
  try {
    const article = findById('articles', req.params.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Article with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    const { data } = req.body;
    
    if (!data || data.type !== 'articles' || data.id !== req.params.id) {
      return res.jsonApiError({
        status: '400',
        title: 'Bad Request',
        detail: 'Resource type and ID must match the URL',
        source: { pointer: '/data' }
      }, 400);
    }
    
    const updates = {};
    if (data.attributes) {
      updates.attributes = {
        ...data.attributes,
        updated: new Date().toISOString()
      };
    }
    if (data.relationships) {
      updates.relationships = data.relationships;
    }
    
    const updatedArticle = updateResource('articles', req.params.id, updates);
    
    res.jsonapi({ data: updatedArticle });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// DELETE /articles/:id - Delete an article
router.delete('/:id', (req, res) => {
  try {
    const article = findById('articles', req.params.id);
    
    if (!article) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Article with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    const deleted = deleteResource('articles', req.params.id);
    
    if (deleted) {
      res.status(204).end();
    } else {
      res.jsonApiError({
        status: '500',
        title: 'Internal Server Error',
        detail: 'Failed to delete article'
      }, 500);
    }
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

module.exports = router;