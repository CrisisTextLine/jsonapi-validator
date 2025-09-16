const express = require('express');
const router = express.Router();
const { mockData, findById } = require('../data/mockData');

// GET /people/:id - Single person resource
router.get('/:id', (req, res) => {
  try {
    const person = findById('people', req.params.id);
    
    if (!person) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Person with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    // Apply sparse fieldsets
    const fields = req.query['fields[people]'] ? req.query['fields[people]'].split(',') : null;
    let filteredPerson = person;
    
    if (fields) {
      filteredPerson = {
        type: person.type,
        id: person.id,
        links: person.links
      };
      
      if (fields.includes('attributes') && person.attributes) {
        filteredPerson.attributes = person.attributes;
      }
      
      if (fields.includes('relationships') && person.relationships) {
        filteredPerson.relationships = person.relationships;
      }
    }
    
    res.jsonapi({ data: filteredPerson });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// GET /people/:id/articles - Related articles collection
router.get('/:id/articles', (req, res) => {
  try {
    const person = findById('people', req.params.id);
    
    if (!person) {
      return res.jsonApiError({
        status: '404',
        title: 'Not Found',
        detail: `Person with id '${req.params.id}' not found`,
        source: { parameter: 'id' }
      }, 404);
    }
    
    // Find articles authored by this person
    const articles = mockData.articles.filter(article => 
      article.relationships?.author?.data?.id === req.params.id
    );
    
    res.jsonapi({ 
      data: articles,
      meta: {
        count: articles.length
      }
    });
  } catch (error) {
    res.jsonApiError({ detail: error.message }, 500);
  }
});

// Test endpoint with missing required attributes for negative testing
router.get('/:id/invalid', (req, res) => {
  // This violates JSON:API spec by missing required type and id
  res.json({
    jsonapi: { version: '1.1' },
    data: {
      attributes: {
        name: 'Invalid Resource'
      }
    }
  });
});

module.exports = router;