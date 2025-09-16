// Sample data for the mock JSON:API server

export const articles = [
  {
    id: '1',
    type: 'articles',
    attributes: {
      title: 'Getting Started with JSON:API',
      body: 'JSON:API is a specification for how a client should request and modify resources, and how a server should respond to those requests.',
      publishedAt: '2023-01-15T10:30:00Z',
      tags: ['jsonapi', 'tutorial', 'api']
    },
    relationships: {
      author: {
        data: { type: 'people', id: '1' },
        links: {
          self: '/api/articles/1/relationships/author',
          related: '/api/articles/1/author'
        }
      },
      comments: {
        data: [
          { type: 'comments', id: '1' },
          { type: 'comments', id: '2' }
        ],
        links: {
          self: '/api/articles/1/relationships/comments',
          related: '/api/articles/1/comments'
        }
      }
    },
    links: {
      self: '/api/articles/1'
    },
    meta: {
      readTime: '5 minutes'
    }
  },
  {
    id: '2',
    type: 'articles',
    attributes: {
      title: 'Advanced JSON:API Features',
      body: 'Explore compound documents, sparse fieldsets, sorting, and pagination in JSON:API.',
      publishedAt: '2023-02-20T14:15:00Z',
      tags: ['jsonapi', 'advanced', 'features']
    },
    relationships: {
      author: {
        data: { type: 'people', id: '2' },
        links: {
          self: '/api/articles/2/relationships/author',
          related: '/api/articles/2/author'
        }
      },
      comments: {
        data: [
          { type: 'comments', id: '3' }
        ],
        links: {
          self: '/api/articles/2/relationships/comments',
          related: '/api/articles/2/comments'
        }
      }
    },
    links: {
      self: '/api/articles/2'
    },
    meta: {
      readTime: '8 minutes'
    }
  },
  {
    id: '3',
    type: 'articles',
    attributes: {
      title: 'JSON:API Error Handling',
      body: 'Learn how to properly handle and format errors in JSON:API responses.',
      publishedAt: '2023-03-10T09:45:00Z',
      tags: ['jsonapi', 'errors', 'best-practices']
    },
    relationships: {
      author: {
        data: { type: 'people', id: '1' },
        links: {
          self: '/api/articles/3/relationships/author',
          related: '/api/articles/3/author'
        }
      },
      comments: {
        data: [],
        links: {
          self: '/api/articles/3/relationships/comments',
          related: '/api/articles/3/comments'
        }
      }
    },
    links: {
      self: '/api/articles/3'
    },
    meta: {
      readTime: '6 minutes'
    }
  }
];

export const people = [
  {
    id: '1',
    type: 'people',
    attributes: {
      firstName: 'Jane',
      lastName: 'Doe',
      email: 'jane.doe@example.com',
      bio: 'Senior API developer with expertise in REST and JSON:API specifications.'
    },
    relationships: {
      articles: {
        data: [
          { type: 'articles', id: '1' },
          { type: 'articles', id: '3' }
        ],
        links: {
          self: '/api/people/1/relationships/articles',
          related: '/api/people/1/articles'
        }
      }
    },
    links: {
      self: '/api/people/1'
    }
  },
  {
    id: '2',
    type: 'people',
    attributes: {
      firstName: 'John',
      lastName: 'Smith',
      email: 'john.smith@example.com',
      bio: 'Full-stack developer passionate about API design and documentation.'
    },
    relationships: {
      articles: {
        data: [
          { type: 'articles', id: '2' }
        ],
        links: {
          self: '/api/people/2/relationships/articles',
          related: '/api/people/2/articles'
        }
      }
    },
    links: {
      self: '/api/people/2'
    }
  }
];

export const comments = [
  {
    id: '1',
    type: 'comments',
    attributes: {
      body: 'Great introduction to JSON:API! Very helpful for beginners.',
      createdAt: '2023-01-16T08:20:00Z'
    },
    relationships: {
      article: {
        data: { type: 'articles', id: '1' },
        links: {
          self: '/api/comments/1/relationships/article',
          related: '/api/comments/1/article'
        }
      },
      author: {
        data: { type: 'people', id: '2' },
        links: {
          self: '/api/comments/1/relationships/author',
          related: '/api/comments/1/author'
        }
      }
    },
    links: {
      self: '/api/comments/1'
    }
  },
  {
    id: '2',
    type: 'comments',
    attributes: {
      body: 'Could you add more examples of compound documents?',
      createdAt: '2023-01-17T12:30:00Z'
    },
    relationships: {
      article: {
        data: { type: 'articles', id: '1' },
        links: {
          self: '/api/comments/2/relationships/article',
          related: '/api/comments/2/article'
        }
      },
      author: {
        data: { type: 'people', id: '1' },
        links: {
          self: '/api/comments/2/relationships/author',
          related: '/api/comments/2/author'
        }
      }
    },
    links: {
      self: '/api/comments/2'
    }
  },
  {
    id: '3',
    type: 'comments',
    attributes: {
      body: 'Excellent coverage of advanced features! The pagination examples were particularly useful.',
      createdAt: '2023-02-21T16:45:00Z'
    },
    relationships: {
      article: {
        data: { type: 'articles', id: '2' },
        links: {
          self: '/api/comments/3/relationships/article',
          related: '/api/comments/3/article'
        }
      },
      author: {
        data: { type: 'people', id: '1' },
        links: {
          self: '/api/comments/3/relationships/author',
          related: '/api/comments/3/author'
        }
      }
    },
    links: {
      self: '/api/comments/3'
    }
  }
];

// Helper function to find resource by ID
export function findById(collection, id) {
  return collection.find(item => item.id === id);
}

// Helper function to get included resources
export function getIncludedResources(mainResources, include = []) {
  const included = [];
  const processedIds = new Set();

  mainResources.forEach(resource => {
    if (resource.relationships) {
      Object.keys(resource.relationships).forEach(relName => {
        if (include.includes(relName)) {
          const relData = resource.relationships[relName].data;
          const relArray = Array.isArray(relData) ? relData : [relData];
          
          relArray.forEach(rel => {
            if (rel && !processedIds.has(`${rel.type}:${rel.id}`)) {
              let relResource = null;
              
              switch (rel.type) {
                case 'people':
                  relResource = findById(people, rel.id);
                  break;
                case 'articles':
                  relResource = findById(articles, rel.id);
                  break;
                case 'comments':
                  relResource = findById(comments, rel.id);
                  break;
              }
              
              if (relResource) {
                included.push(relResource);
                processedIds.add(`${rel.type}:${rel.id}`);
              }
            }
          });
        }
      });
    }
  });

  return included;
}