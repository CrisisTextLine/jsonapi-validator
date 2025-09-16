# JSON:API Validator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive JSON:API v1.1 specification validator implemented as a single-page application that acts as a client to test any JSON:API implementation. This tool helps developers and organizations verify that their APIs correctly implement the JSON:API specification by generating conformant requests and validating responses.

## Overview

The JSON:API Validator is designed as a standalone client application that can test any JSON:API implementation regardless of the backend technology (Go, Node.js, Python, etc.). The validator provides:

- **Client-Side Testing**: Acts as a JSON:API client that generates conformant requests
- **Response Validation**: Validates API responses against the JSON:API v1.1 specification  
- **Multi-Step Workflow Testing**: Performs comprehensive CRUD operations to validate complete JSON:API behavior
- **Cross-Platform Compatibility**: Works with any JSON:API implementation via HTTP requests

## Planned Features

### Client Application Capabilities

- ✅ **Single-Page Application Interface**
  - Web-based UI for configuring and running JSON:API tests
  - Real-time validation results with detailed error reporting
  - Support for multiple API endpoint configurations
  - Export/import test configurations and results

- ✅ **Multi-Step Workflow Testing**
  - **GET Collection**: Retrieve a list of resources and validate structure
  - **GET Individual**: Fetch individual resources from collection results
  - **POST Create**: Copy existing resource data to create new entries
  - **PATCH Update**: Modify created resources and validate update behavior
  - **DELETE**: Remove test resources and validate proper cleanup
  - **Relationship Testing**: Validate related resource inclusion and linking

- ✅ **Request Generation & Validation**
  - Generate JSON:API compliant requests for all HTTP methods
  - Validate request structure before sending to target API
  - Support for complex query parameters (include, fields, sort, pagination)
  - Custom header management and content-type validation

- ✅ **Response Analysis**
  - Comprehensive JSON:API v1.1 specification compliance checking
  - Document structure validation (data, errors, meta, links, included, jsonapi)
  - Resource object validation with type/id requirements
  - Error object structure and HTTP status alignment
  - Content-Type and media type parameter validation

### Usage Interface

#### Single-Page Application (Planned)

The validator will be implemented as a web-based single-page application:

```javascript
// Configuration for testing a JSON:API endpoint
const testConfig = {
  baseUrl: 'https://api.example.com',
  resourceType: 'posts',
  authHeaders: {
    'Authorization': 'Bearer your-token-here'
  },
  testScenarios: [
    'list-resources',
    'get-individual', 
    'create-resource',
    'update-resource',
    'delete-resource',
    'test-relationships'
  ]
};

// Run comprehensive JSON:API validation
const results = await runJsonApiTests(testConfig);
```

#### Test Workflow Example

1. **List Resources** (`GET /posts`)
   - Validate response structure and resource collection format
   - Extract sample resource for further testing

2. **Get Individual Resource** (`GET /posts/123`)
   - Validate individual resource object structure
   - Test sparse fieldsets and include parameters

3. **Create Resource** (`POST /posts`)
   - Copy existing resource data to create test payload
   - Validate creation response and resource ID assignment

4. **Update Resource** (`PATCH /posts/new-id`)
   - Modify created resource attributes
   - Validate update response and changed fields

5. **Delete Resource** (`DELETE /posts/new-id`)
   - Clean up test data
   - Validate proper deletion response

## Architecture Overview

### Single-Page Application Structure

```
src/
├── components/         # React/Vue components for the UI
│   ├── TestRunner.js          # Main test execution component
│   ├── ConfigForm.js          # API endpoint configuration
│   ├── ResultsPanel.js        # Validation results display
│   └── WorkflowSteps.js       # Multi-step test workflow UI
├── validators/         # Core JSON:API validation logic
│   ├── DocumentValidator.js   # Document structure validation
│   ├── ResourceValidator.js   # Resource object validation
│   ├── ErrorValidator.js      # Error response validation
│   └── QueryValidator.js      # Query parameter validation
├── client/            # HTTP client for API requests
│   ├── RequestGenerator.js    # Generate JSON:API compliant requests
│   ├── ResponseHandler.js     # Process and validate API responses
│   └── WorkflowEngine.js      # Multi-step test execution
├── utils/             # Shared utilities
│   ├── JsonApiHelper.js       # JSON:API structure helpers
│   └── ValidationReporter.js  # Format validation results
└── app.js             # Main application entry point
```

### Validation Workflow

1. **Configuration**: User specifies target JSON:API endpoint and authentication
2. **Request Generation**: Create spec-compliant requests for each test scenario
3. **API Communication**: Execute HTTP requests against target endpoint
4. **Response Validation**: Validate each response against JSON:API v1.1 spec
5. **Result Reporting**: Display detailed validation results with actionable feedback
6. **Multi-Step Testing**: Chain operations (list → get → create → update → delete) for comprehensive testing

## JSON:API v1.1 Compliance

This validator aims for complete compliance with the [JSON:API v1.1 specification](https://jsonapi.org/format/1.1/), including:

### Document Structure Requirements
- **MUST** contain at least one of: `data`, `errors`, or `meta`
- **MUST NOT** contain both `data` and `errors` at the top level
- **MAY** contain `links`, `included`, and `jsonapi` members

### Resource Objects
- **MUST** contain `type` and `id` members (except client-generated resources)
- **MAY** contain `attributes`, `relationships`, `links`, and `meta` members
- **MUST** validate relationship object structure

### Content Negotiation
- **MUST** use `application/vnd.api+json` content type
- **MUST** respond with `415 Unsupported Media Type` for incorrect content types
- **MUST** validate media type parameters

### Query Parameters
- **MUST** support standard query parameters (`include`, `fields`, `sort`, `page`)
- **MUST** validate sparse fieldset syntax
- **MUST** validate inclusion path syntax
- **SHOULD** provide meaningful errors for malformed parameters

## Development Status

🚧 **This project is in early development**

### Current Phase: Planning and Architecture Design

- [x] Repository setup and initial documentation
- [x] GitHub Copilot instructions configuration
- [x] Architecture planning and documentation
- [ ] Core validation engine implementation
- [ ] Individual validation rules implementation
- [ ] CLI interface development
- [ ] Programmatic API development
- [ ] Test suite implementation
- [ ] Documentation and examples
- [ ] Performance optimization
- [ ] Release preparation

## Contributing

We welcome contributions! This project is sponsored by [Crisis Text Line](https://www.crisistextline.org/) and follows our contribution guidelines.

### Getting Started

1. **Fork and Clone**: Fork this repository and clone your fork
2. **Install Dependencies**: `npm install` (when package.json is added)
3. **Run Tests**: `npm test` (when test suite is implemented)
4. **Follow Guidelines**: See `.github/copilot-instructions.md` for detailed development guidelines

### Development Workflow

- Follow JSON:API specification references in all validation code
- Include comprehensive tests for each validation rule
- Update documentation when adding features
- Ensure backward compatibility considerations

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Resources

- [JSON:API Specification v1.1](https://jsonapi.org/format/1.1/)
- [JSON:API Examples](https://jsonapi.org/examples/)
- [Crisis Text Line](https://www.crisistextline.org/) - Project Sponsor

---

**Note**: This project is under active development. The API and features described above represent the planned implementation and may change as development progresses.
