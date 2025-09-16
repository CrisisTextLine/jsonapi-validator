// Mock data for JSON:API testing
// This data follows JSON:API v1.1 specification patterns

const mockData = {
  articles: [
    {
      type: 'articles',
      id: '1',
      attributes: {
        title: 'JSON:API paints my world!',
        body: 'The shortest article. Ever.',
        created: '2015-05-22T14:56:29.000Z',
        updated: '2015-05-22T14:56:28.000Z'
      },
      relationships: {
        author: {
          data: { type: 'people', id: '1' },
          links: {
            self: '/articles/1/relationships/author',
            related: '/articles/1/author'
          }
        },
        comments: {
          data: [
            { type: 'comments', id: '1' },
            { type: 'comments', id: '2' }
          ],
          links: {
            self: '/articles/1/relationships/comments',
            related: '/articles/1/comments'
          }
        }
      },
      links: {
        self: '/articles/1'
      }
    },
    {
      type: 'articles',
      id: '2',
      attributes: {
        title: 'The Future of JSON:API',
        body: 'JSON:API continues to evolve with new features and improvements.',
        created: '2024-01-15T10:30:00.000Z',
        updated: '2024-01-16T12:45:00.000Z'
      },
      relationships: {
        author: {
          data: { type: 'people', id: '2' },
          links: {
            self: '/articles/2/relationships/author',
            related: '/articles/2/author'
          }
        },
        comments: {
          data: [
            { type: 'comments', id: '3' }
          ],
          links: {
            self: '/articles/2/relationships/comments',
            related: '/articles/2/comments'
          }
        }
      },
      links: {
        self: '/articles/2'
      }
    },
    {
      type: 'articles',
      id: '3',
      attributes: {
        title: 'Understanding Relationships',
        body: 'A comprehensive guide to JSON:API relationships and compound documents.',
        created: '2024-02-01T09:00:00.000Z',
        updated: '2024-02-01T09:00:00.000Z'
      },
      relationships: {
        author: {
          data: { type: 'people', id: '1' },
          links: {
            self: '/articles/3/relationships/author',
            related: '/articles/3/author'
          }
        },
        comments: {
          data: [],
          links: {
            self: '/articles/3/relationships/comments',
            related: '/articles/3/comments'
          }
        }
      },
      links: {
        self: '/articles/3'
      }
    }
  ],

  people: [
    {
      type: 'people',
      id: '1',
      attributes: {
        'first-name': 'Dan',
        'last-name': 'Gebhardt',
        twitter: 'dgeb',
        bio: 'Co-creator of JSON:API specification',
        'avatar-url': 'https://avatars.githubusercontent.com/u/1234567'
      },
      relationships: {
        articles: {
          links: {
            self: '/people/1/relationships/articles',
            related: '/people/1/articles'
          }
        }
      },
      links: {
        self: '/people/1'
      }
    },
    {
      type: 'people',
      id: '2',
      attributes: {
        'first-name': 'Steve',
        'last-name': 'Klabnik',
        twitter: 'steveklabnik',
        bio: 'JSON:API specification contributor',
        'avatar-url': 'https://avatars.githubusercontent.com/u/2345678'
      },
      relationships: {
        articles: {
          links: {
            self: '/people/2/relationships/articles',
            related: '/people/2/articles'
          }
        }
      },
      links: {
        self: '/people/2'
      }
    }
  ],

  comments: [
    {
      type: 'comments',
      id: '1',
      attributes: {
        body: 'First!',
        created: '2015-05-22T14:56:29.000Z',
        'is-approved': true
      },
      relationships: {
        author: {
          data: { type: 'people', id: '2' },
          links: {
            self: '/comments/1/relationships/author',
            related: '/comments/1/author'
          }
        },
        article: {
          data: { type: 'articles', id: '1' },
          links: {
            self: '/comments/1/relationships/article',
            related: '/comments/1/article'
          }
        }
      },
      links: {
        self: '/comments/1'
      }
    },
    {
      type: 'comments',
      id: '2',
      attributes: {
        body: 'Great article! JSON:API really does paint the world in a new light.',
        created: '2015-05-22T16:30:15.000Z',
        'is-approved': true
      },
      relationships: {
        author: {
          data: { type: 'people', id: '1' },
          links: {
            self: '/comments/2/relationships/author',
            related: '/comments/2/author'
          }
        },
        article: {
          data: { type: 'articles', id: '1' },
          links: {
            self: '/comments/2/relationships/article',
            related: '/comments/2/article'
          }
        }
      },
      links: {
        self: '/comments/2'
      }
    },
    {
      type: 'comments',
      id: '3',
      attributes: {
        body: 'Looking forward to what comes next!',
        created: '2024-01-16T14:20:00.000Z',
        'is-approved': false
      },
      relationships: {
        author: {
          data: { type: 'people', id: '2' },
          links: {
            self: '/comments/3/relationships/author',
            related: '/comments/3/author'
          }
        },
        article: {
          data: { type: 'articles', id: '2' },
          links: {
            self: '/comments/3/relationships/article',
            related: '/comments/3/article'
          }
        }
      },
      links: {
        self: '/comments/3'
      }
    }
  ]
};

// Counter for generating new IDs
let idCounter = {
  articles: 4,
  people: 3,
  comments: 4
};

// Helper functions
function findById(type, id) {
  return mockData[type].find(item => item.id === id);
}

function findByIds(type, ids) {
  return mockData[type].filter(item => ids.includes(item.id));
}

function addResource(type, resource) {
  const newId = idCounter[type].toString();
  idCounter[type]++;
  
  const newResource = {
    ...resource,
    id: newId,
    type: type.slice(0, -1) // Remove 's' from plural
  };
  
  mockData[type].push(newResource);
  return newResource;
}

function updateResource(type, id, updates) {
  const index = mockData[type].findIndex(item => item.id === id);
  if (index === -1) return null;
  
  // Merge updates into existing resource
  if (updates.attributes) {
    mockData[type][index].attributes = {
      ...mockData[type][index].attributes,
      ...updates.attributes
    };
  }
  
  if (updates.relationships) {
    mockData[type][index].relationships = {
      ...mockData[type][index].relationships,
      ...updates.relationships
    };
  }
  
  return mockData[type][index];
}

function deleteResource(type, id) {
  const index = mockData[type].findIndex(item => item.id === id);
  if (index === -1) return false;
  
  mockData[type].splice(index, 1);
  return true;
}

function getRelatedResources(type, id, relationshipName) {
  const resource = findById(type, id);
  if (!resource || !resource.relationships || !resource.relationships[relationshipName]) {
    return null;
  }
  
  const relationshipData = resource.relationships[relationshipName].data;
  
  if (Array.isArray(relationshipData)) {
    // To-many relationship
    return relationshipData.map(ref => findById(ref.type + 's', ref.id)).filter(Boolean);
  } else if (relationshipData) {
    // To-one relationship
    return findById(relationshipData.type + 's', relationshipData.id);
  }
  
  return null;
}

module.exports = {
  mockData,
  findById,
  findByIds,
  addResource,
  updateResource,
  deleteResource,
  getRelatedResources
};