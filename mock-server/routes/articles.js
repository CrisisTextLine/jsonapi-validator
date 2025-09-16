import express from 'express';
import { articles, people, comments, findById, getIncludedResources } from '../data/sampleData.js';

const router = express.Router();

// Helper function to apply sparse fieldsets
function applySparseFieldsets(resource, fields) {
  if (!fields || !fields[resource.type]) {
    return resource;
  }
  
  const allowedFields = fields[resource.type].split(',').map(f => f.trim());
  const result = {
    id: resource.id,
    type: resource.type
  };
  
  // Always include links
  if (resource.links) {
    result.links = resource.links;
  }
  
  // Filter attributes
  if (resource.attributes && allowedFields.some(field => Object.keys(resource.attributes).includes(field))) {
    result.attributes = {};
    allowedFields.forEach(field => {
      if (resource.attributes[field] !== undefined) {
        result.attributes[field] = resource.attributes[field];
      }
    });
  }
  
  // Always include relationships for now (could be filtered too)
  if (resource.relationships) {
    result.relationships = resource.relationships;
  }
  
  // Always include meta
  if (resource.meta) {
    result.meta = resource.meta;
  }
  
  return result;
}

// Helper function to sort resources
function sortResources(resources, sort) {
  if (!sort) return resources;
  
  const sortFields = sort.split(',').map(s => s.trim());
  
  return [...resources].sort((a, b) => {
    for (const field of sortFields) {
      const isDesc = field.startsWith('-');
      const fieldName = isDesc ? field.substring(1) : field;
      
      let aVal, bVal;
      
      if (a.attributes && a.attributes[fieldName] !== undefined) {
        aVal = a.attributes[fieldName];
        bVal = b.attributes[fieldName];
      } else {
        aVal = a[fieldName];
        bVal = b[fieldName];
      }
      
      if (aVal < bVal) return isDesc ? 1 : -1;
      if (aVal > bVal) return isDesc ? -1 : 1;
    }
    return 0;
  });
}

// Helper function to filter resources
function filterResources(resources, filter) {
  if (!filter) return resources;
  
  return resources.filter(resource => {
    return Object.entries(filter).every(([key, value]) => {
      if (key === 'tags' && resource.attributes.tags) {
        return resource.attributes.tags.includes(value);
      }
      if (resource.attributes[key] !== undefined) {
        return resource.attributes[key].toString().toLowerCase().includes(value.toLowerCase());
      }
      return false;
    });
  });
}

// GET /api/articles - List articles with full JSON:API features
router.get('/articles', (req, res) => {
  try {
    let result = [...articles];
    
    // Apply filtering
    const filter = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('filter[') && key.endsWith(']')) {
        const filterKey = key.slice(7, -1);
        filter[filterKey] = req.query[key];
      }
    });
    result = filterResources(result, filter);
    
    // Apply sorting
    if (req.query.sort) {
      result = sortResources(result, req.query.sort);
    }
    
    // Parse include parameter
    const include = req.query.include ? req.query.include.split(',').map(i => i.trim()) : [];
    
    // Parse fields parameter
    const fields = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('fields[') && key.endsWith(']')) {
        const type = key.slice(7, -1);
        fields[type] = req.query[key];
      }
    });
    
    // Apply pagination
    const pageSize = parseInt(req.query['page[size]']) || 10;
    const pageNumber = parseInt(req.query['page[number]']) || 1;
    const offset = (pageNumber - 1) * pageSize;
    const total = result.length;
    const paginatedResult = result.slice(offset, offset + pageSize);
    
    // Apply sparse fieldsets
    const processedData = paginatedResult.map(resource => applySparseFieldsets(resource, fields));
    
    // Generate pagination links
    const baseUrl = `${req.protocol}://${req.get('host')}/api/articles`;
    const queryParams = new URLSearchParams(req.query);
    
    const links = {
      self: `${baseUrl}?${queryParams.toString()}`,
      first: `${baseUrl}?${new URLSearchParams({...Object.fromEntries(queryParams), 'page[number]': '1'}).toString()}`,
      last: `${baseUrl}?${new URLSearchParams({...Object.fromEntries(queryParams), 'page[number]': Math.ceil(total / pageSize).toString()}).toString()}`
    };
    
    if (pageNumber > 1) {
      links.prev = `${baseUrl}?${new URLSearchParams({...Object.fromEntries(queryParams), 'page[number]': (pageNumber - 1).toString()}).toString()}`;
    }
    
    if (offset + pageSize < total) {
      links.next = `${baseUrl}?${new URLSearchParams({...Object.fromEntries(queryParams), 'page[number]': (pageNumber + 1).toString()}).toString()}`;
    }
    
    // Build response
    const response = {
      jsonapi: { version: '1.1' },
      data: processedData,
      links,
      meta: {
        totalResources: total,
        page: {
          number: pageNumber,
          size: pageSize,
          total: Math.ceil(total / pageSize)
        }
      }
    };
    
    // Add included resources if requested
    if (include.length > 0) {
      const included = getIncludedResources(paginatedResult, include);
      if (included.length > 0) {
        response.included = included.map(resource => applySparseFieldsets(resource, fields));
      }
    }
    
    res.json(response);
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

// GET /api/articles/:id - Get individual article
router.get('/articles/:id', (req, res) => {
  try {
    const article = findById(articles, req.params.id);
    
    if (!article) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Article with id '${req.params.id}' not found`
        }]
      });
    }
    
    // Parse include parameter
    const include = req.query.include ? req.query.include.split(',').map(i => i.trim()) : [];
    
    // Parse fields parameter
    const fields = {};
    Object.keys(req.query).forEach(key => {
      if (key.startsWith('fields[') && key.endsWith(']')) {
        const type = key.slice(7, -1);
        fields[type] = req.query[key];
      }
    });
    
    // Apply sparse fieldsets
    const processedArticle = applySparseFieldsets(article, fields);
    
    // Build response
    const response = {
      jsonapi: { version: '1.1' },
      data: processedArticle,
      links: {
        self: `/api/articles/${req.params.id}`
      }
    };
    
    // Add included resources if requested
    if (include.length > 0) {
      const included = getIncludedResources([article], include);
      if (included.length > 0) {
        response.included = included.map(resource => applySparseFieldsets(resource, fields));
      }
    }
    
    res.json(response);
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

// GET /api/articles/:id/author - Get related author
router.get('/articles/:id/author', (req, res) => {
  try {
    const article = findById(articles, req.params.id);
    
    if (!article) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Article with id '${req.params.id}' not found`
        }]
      });
    }
    
    const authorId = article.relationships.author.data.id;
    const author = findById(people, authorId);
    
    if (!author) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Related Resource Not Found',
          detail: `Author with id '${authorId}' not found`
        }]
      });
    }
    
    res.json({
      jsonapi: { version: '1.1' },
      data: author,
      links: {
        self: `/api/articles/${req.params.id}/author`
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

// GET /api/articles/:id/comments - Get related comments
router.get('/articles/:id/comments', (req, res) => {
  try {
    const article = findById(articles, req.params.id);
    
    if (!article) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Article with id '${req.params.id}' not found`
        }]
      });
    }
    
    const commentIds = article.relationships.comments.data.map(c => c.id);
    const articleComments = comments.filter(comment => commentIds.includes(comment.id));
    
    res.json({
      jsonapi: { version: '1.1' },
      data: articleComments,
      links: {
        self: `/api/articles/${req.params.id}/comments`
      },
      meta: {
        total: articleComments.length
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

// POST /api/articles - Create new article
router.post('/articles', (req, res) => {
  try {
    const { data } = req.body;
    
    // Validate request structure
    if (!data || data.type !== 'articles') {
      return res.status(422).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '422',
          title: 'Invalid Resource',
          detail: 'Request must contain data with type "articles"'
        }]
      });
    }
    
    // Validate required attributes
    if (!data.attributes || !data.attributes.title || !data.attributes.body) {
      return res.status(422).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '422',
          title: 'Validation Error',
          detail: 'Title and body are required attributes'
        }]
      });
    }
    
    // Generate new ID
    const newId = (Math.max(...articles.map(a => parseInt(a.id))) + 1).toString();
    
    // Create new article
    const newArticle = {
      id: newId,
      type: 'articles',
      attributes: {
        ...data.attributes,
        publishedAt: new Date().toISOString()
      },
      relationships: data.relationships || {
        author: {
          data: { type: 'people', id: '1' },
          links: {
            self: `/api/articles/${newId}/relationships/author`,
            related: `/api/articles/${newId}/author`
          }
        },
        comments: {
          data: [],
          links: {
            self: `/api/articles/${newId}/relationships/comments`,
            related: `/api/articles/${newId}/comments`
          }
        }
      },
      links: {
        self: `/api/articles/${newId}`
      }
    };
    
    // Add to articles array (in real app, this would persist to database)
    articles.push(newArticle);
    
    res.status(201).json({
      jsonapi: { version: '1.1' },
      data: newArticle,
      links: {
        self: `/api/articles/${newId}`
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

// PATCH /api/articles/:id - Update article
router.patch('/articles/:id', (req, res) => {
  try {
    const article = findById(articles, req.params.id);
    
    if (!article) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Article with id '${req.params.id}' not found`
        }]
      });
    }
    
    const { data } = req.body;
    
    // Validate request structure
    if (!data || data.type !== 'articles' || data.id !== req.params.id) {
      return res.status(422).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '422',
          title: 'Invalid Resource',
          detail: 'Request data type and id must match the target resource'
        }]
      });
    }
    
    // Update attributes
    if (data.attributes) {
      Object.assign(article.attributes, data.attributes);
    }
    
    // Update relationships if provided
    if (data.relationships) {
      Object.assign(article.relationships, data.relationships);
    }
    
    res.json({
      jsonapi: { version: '1.1' },
      data: article,
      links: {
        self: `/api/articles/${req.params.id}`
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

// DELETE /api/articles/:id - Delete article
router.delete('/articles/:id', (req, res) => {
  try {
    const articleIndex = articles.findIndex(a => a.id === req.params.id);
    
    if (articleIndex === -1) {
      return res.status(404).json({
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Resource Not Found',
          detail: `Article with id '${req.params.id}' not found`
        }]
      });
    }
    
    // Remove article from array (in real app, this would delete from database)
    articles.splice(articleIndex, 1);
    
    res.status(204).send();
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

export { router as articlesRouter };