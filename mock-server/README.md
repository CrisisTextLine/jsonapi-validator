# Mock JSON:API Server Documentation

## Overview

This mock server provides JSON:API v1.1 compliant endpoints for testing the validator application. It includes both valid endpoints and intentionally invalid ones for comprehensive testing.

## Running the Mock Server

```bash
# Run mock server only
npm run mock-server

# Run both validator app and mock server concurrently
npm start
# or
npm run dev:full
```

The mock server runs on `http://localhost:3001` by default.

## Available Endpoints

### Root API Endpoint

- **GET** `/api` - API information and endpoint list

### Articles Resource

- **GET** `/api/articles` - List all articles with pagination, filtering, sorting, and compound documents
- **GET** `/api/articles/:id` - Get individual article
- **POST** `/api/articles` - Create new article
- **PATCH** `/api/articles/:id` - Update article
- **DELETE** `/api/articles/:id` - Delete article

#### Relationship Endpoints
- **GET** `/api/articles/:id/author` - Get related author
- **GET** `/api/articles/:id/comments` - Get related comments

### People Resource

- **GET** `/api/people` - List all people
- **GET** `/api/people/:id` - Get individual person

### Comments Resource

- **GET** `/api/comments` - List all comments
- **GET** `/api/comments/:id` - Get individual comment

### Health Check

- **GET** `/health` - Server health check (returns `application/json`)

## Supported JSON:API Features

### Query Parameters

#### Pagination
```
GET /api/articles?page[size]=5&page[number]=2
```

#### Sorting
```
GET /api/articles?sort=title                    # Ascending
GET /api/articles?sort=-publishedAt            # Descending
GET /api/articles?sort=title,-publishedAt      # Multiple fields
```

#### Filtering
```
GET /api/articles?filter[title]=JSON:API       # Filter by title
GET /api/articles?filter[tags]=tutorial        # Filter by tags
```

#### Sparse Fieldsets
```
GET /api/articles?fields[articles]=title,body
GET /api/articles?fields[people]=firstName,lastName
```

#### Including Related Resources
```
GET /api/articles?include=author               # Include author
GET /api/articles?include=author,comments      # Include multiple
GET /api/articles/1?include=author             # Include on single resource
```

### Request/Response Examples

#### GET Collection with Features
```bash
curl -H "Accept: application/vnd.api+json" \
  "http://localhost:3001/api/articles?include=author&sort=title&page[size]=2&fields[articles]=title"
```

#### POST Create Resource
```bash
curl -X POST \
  -H "Content-Type: application/vnd.api+json" \
  -H "Accept: application/vnd.api+json" \
  -d '{
    "data": {
      "type": "articles",
      "attributes": {
        "title": "New Article",
        "body": "This is a new article for testing."
      }
    }
  }' \
  http://localhost:3001/api/articles
```

#### PATCH Update Resource
```bash
curl -X PATCH \
  -H "Content-Type: application/vnd.api+json" \
  -H "Accept: application/vnd.api+json" \
  -d '{
    "data": {
      "id": "1",
      "type": "articles",
      "attributes": {
        "title": "Updated Title"
      }
    }
  }' \
  http://localhost:3001/api/articles/1
```

## Sample Data Structure

The server includes sample data for:

### Articles
- 3 sample articles with relationships to authors and comments
- Each article has `title`, `body`, `publishedAt`, and `tags` attributes
- Articles have relationships to `author` (people) and `comments`

### People
- 2 sample people/authors
- Each person has `firstName`, `lastName`, `email`, and `bio` attributes
- People have relationships to their `articles`

### Comments
- 3 sample comments on various articles
- Each comment has `body` and `createdAt` attributes
- Comments have relationships to their `article` and `author`

## Invalid Endpoints for Testing

These endpoints return intentionally invalid JSON:API responses to test validator error detection:

### Structure Violations
- `GET /api/invalid/no-jsonapi` - Missing required `jsonapi` member
- `GET /api/invalid/missing-id` - Resources missing required `id` field
- `GET /api/invalid/missing-type` - Resources missing required `type` field
- `GET /api/invalid/empty-document` - Document with no `data`, `errors`, or `meta`
- `GET /api/invalid/data-and-errors` - Document with both `data` and `errors` (forbidden)

### Content-Type Issues
- `GET /api/invalid/wrong-content-type` - Returns `application/json` instead of `application/vnd.api+json`

### Relationship Issues
- `GET /api/invalid/malformed-relationship` - Invalid relationship structure

### Error Format Issues
- `GET /api/invalid/malformed-errors` - Errors array contains non-objects
- `GET /api/invalid/status-mismatch` - HTTP status doesn't match response content

### Performance Testing
- `GET /api/invalid/timeout` - Simulates slow/timeout response (30 second delay)

### Member Name Issues
- `GET /api/invalid/reserved-chars` - Uses invalid member names with reserved characters

## Content Negotiation

The server properly handles JSON:API content negotiation:

- All responses (except `/health`) use `Content-Type: application/vnd.api+json`
- POST/PATCH requests must include `Content-Type: application/vnd.api+json`
- Returns `415 Unsupported Media Type` for incorrect content types on write operations

## Error Handling

The server returns proper JSON:API error responses:

- `404 Not Found` for missing resources
- `415 Unsupported Media Type` for incorrect content types
- `422 Unprocessable Entity` for validation errors
- `500 Internal Server Error` for server errors

All error responses follow JSON:API error object format with `status`, `title`, and `detail` fields.

## CORS Support

The server includes CORS middleware to allow cross-origin requests from the validator frontend running on a different port.

## Testing the Validator

To test the JSON:API validator against this mock server:

1. Start both servers: `npm start`
2. Open the validator at `http://localhost:3000`
3. Configure endpoints using `http://localhost:3001/api/*`
4. Test both valid endpoints (should pass) and invalid endpoints (should fail validation)

### Example Test Cases

| Endpoint | Expected Validator Result |
|----------|---------------------------|
| `http://localhost:3001/api/articles` | ✅ All validations pass |
| `http://localhost:3001/api/articles?include=author` | ✅ Compound document valid |
| `http://localhost:3001/api/invalid/no-jsonapi` | ❌ Missing jsonapi member |
| `http://localhost:3001/api/invalid/wrong-content-type` | ❌ Wrong content type |
| `http://localhost:3001/api/articles/999` | ✅ Proper 404 error format |