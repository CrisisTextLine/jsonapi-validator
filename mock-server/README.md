# JSON:API Mock Server

A comprehensive mock server providing JSON:API v1.1 compliant responses for testing the JSON:API validator. This server implements all major JSON:API features including relationships, compound documents, pagination, sparse fieldsets, sorting, and error handling.

## Features

- ✅ **JSON:API v1.1 Compliance**: Fully compliant responses with proper content-type headers
- ✅ **CRUD Operations**: Complete Create, Read, Update, Delete functionality
- ✅ **Relationships**: To-one and to-many relationships with proper linking
- ✅ **Compound Documents**: Included related resources via `include` parameter
- ✅ **Pagination**: Cursor and page-based pagination with proper links
- ✅ **Sparse Fieldsets**: Field selection via `fields` parameter
- ✅ **Sorting**: Multi-field sorting via `sort` parameter
- ✅ **Error Handling**: Proper JSON:API error responses
- ✅ **Content Negotiation**: Strict `application/vnd.api+json` validation
- ✅ **Negative Testing**: Intentionally invalid responses for validation testing

## Quick Start

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the mock server**:
   ```bash
   npm run start
   # or for development
   npm run dev
   ```

3. **Visit the API**:
   - Base URL: http://localhost:3000
   - API Info: http://localhost:3000/
   - Health Check: http://localhost:3000/health

## Available Endpoints

### Articles
- `GET /articles` - Collection of articles with pagination, sorting, filtering
- `GET /articles/{id}` - Single article resource
- `POST /articles` - Create new article
- `PATCH /articles/{id}` - Update existing article
- `DELETE /articles/{id}` - Delete article
- `GET /articles/{id}/author` - Get article's author
- `GET /articles/{id}/comments` - Get article's comments

### People
- `GET /people/{id}` - Single person resource
- `GET /people/{id}/articles` - Get person's articles

### Comments
- `GET /comments/{id}` - Single comment resource
- `GET /comments/{id}/author` - Get comment's author
- `GET /comments/{id}/article` - Get comment's article

### Testing Endpoints (Invalid Responses)
- `GET /articles/invalid-response` - Response with both data and errors (invalid)
- `GET /people/{id}/invalid` - Resource missing type and id (invalid)
- `GET /comments/{id}/invalid-content-type` - Wrong content-type header (invalid)

## Query Parameters

### Pagination
```http
GET /articles?page[number]=2&page[size]=5
```

Response includes pagination links:
```json
{
  "links": {
    "self": "/articles?page[number]=2&page[size]=5",
    "first": "/articles?page[number]=1&page[size]=5",
    "prev": "/articles?page[number]=1&page[size]=5",
    "next": "/articles?page[number]=3&page[size]=5",
    "last": "/articles?page[number]=4&page[size]=5"
  },
  "meta": {
    "pagination": {
      "page": 2,
      "per-page": 5,
      "page-count": 4,
      "total-count": 18
    }
  }
}
```

### Sparse Fieldsets
```http
GET /articles/1?fields[articles]=title,body
GET /articles/1?fields[articles]=attributes&fields[people]=first-name,last-name
```

### Including Related Resources
```http
GET /articles/1?include=author
GET /articles/1?include=author,comments
GET /articles?include=author,comments
```

### Sorting
```http
GET /articles?sort=title
GET /articles?sort=-created,title
GET /articles?sort=id,-updated
```

### Combined Query Parameters
```http
GET /articles?include=author,comments&fields[articles]=title,body&sort=-created&page[size]=10
```

## Example Responses

### Single Resource
```json
{
  "jsonapi": { "version": "1.1" },
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "JSON:API paints my world!",
      "body": "The shortest article. Ever.",
      "created": "2015-05-22T14:56:29.000Z",
      "updated": "2015-05-22T14:56:28.000Z"
    },
    "relationships": {
      "author": {
        "data": { "type": "people", "id": "1" },
        "links": {
          "self": "/articles/1/relationships/author",
          "related": "/articles/1/author"
        }
      },
      "comments": {
        "data": [
          { "type": "comments", "id": "1" },
          { "type": "comments", "id": "2" }
        ],
        "links": {
          "self": "/articles/1/relationships/comments",
          "related": "/articles/1/comments"
        }
      }
    },
    "links": {
      "self": "/articles/1"
    }
  }
}
```

### Collection with Compound Document
```json
{
  "jsonapi": { "version": "1.1" },
  "data": [
    {
      "type": "articles",
      "id": "1",
      "attributes": { "title": "JSON:API paints my world!" },
      "relationships": {
        "author": { "data": { "type": "people", "id": "1" } }
      }
    }
  ],
  "included": [
    {
      "type": "people",
      "id": "1",
      "attributes": {
        "first-name": "Dan",
        "last-name": "Gebhardt",
        "twitter": "dgeb"
      }
    }
  ]
}
```

### Error Response
```json
{
  "jsonapi": { "version": "1.1" },
  "errors": [
    {
      "status": "404",
      "title": "Not Found",
      "detail": "Article with id '999' not found",
      "source": { "parameter": "id" }
    }
  ]
}
```

## Creating Resources

### Create Article
```http
POST /articles
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "articles",
    "attributes": {
      "title": "New Article",
      "body": "Article content here"
    },
    "relationships": {
      "author": {
        "data": { "type": "people", "id": "1" }
      }
    }
  }
}
```

### Update Article
```http
PATCH /articles/1
Content-Type: application/vnd.api+json

{
  "data": {
    "type": "articles",
    "id": "1",
    "attributes": {
      "title": "Updated Title"
    }
  }
}
```

## Mock Data

The server comes with pre-loaded sample data:

- **3 Articles**: Sample blog posts with relationships
- **2 People**: Authors with profile information
- **3 Comments**: Comments linked to articles and authors

All resources include proper relationships and follow JSON:API naming conventions (kebab-case attributes, proper resource linking).

## Testing Features

### Positive Testing
All endpoints return valid JSON:API responses that can be used to test:
- Document structure validation
- Resource object validation
- Relationship validation
- Query parameter handling
- Content-type negotiation
- HTTP status codes

### Negative Testing
Special endpoints provide intentionally invalid responses:
- Resources with both `data` and `errors` (forbidden)
- Resources missing required `type` and `id`
- Wrong content-type headers
- Various malformed JSON:API structures

### Content-Type Validation
The server strictly enforces JSON:API content-type requirements:
- Requests with data must use `Content-Type: application/vnd.api+json`
- All responses use `Content-Type: application/vnd.api+json`
- Invalid content-types return `415 Unsupported Media Type`

## Configuration

Environment variables:
- `PORT`: Server port (default: 3000)

## Development

The mock server is built with:
- **Express.js**: Web framework
- **CORS**: Cross-origin support
- **Custom middleware**: JSON:API compliance and error handling

File structure:
```
mock-server/
├── server.js              # Main server file
├── data/
│   └── mockData.js         # Sample data and data manipulation
├── middleware/
│   ├── jsonapi.js          # JSON:API compliance middleware
│   └── errorHandler.js     # Error handling middleware
└── routes/
    ├── articles.js         # Articles endpoints
    ├── people.js           # People endpoints
    └── comments.js         # Comments endpoints
```

## Contributing

When adding new endpoints or features:
1. Follow JSON:API v1.1 specification
2. Add comprehensive error handling
3. Support standard query parameters where applicable
4. Include examples in this documentation
5. Test both positive and negative cases

## License

MIT License - see LICENSE file for details.