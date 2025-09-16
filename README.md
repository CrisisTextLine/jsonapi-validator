# JSON:API Validator

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A comprehensive JSON:API v1.1 specification validator designed to ensure API endpoint compliance with the [JSON:API standard](https://jsonapi.org/format/). This tool helps developers and organizations verify that their APIs correctly implement the JSON:API specification.

## Overview

The JSON:API Validator provides robust validation capabilities for:

- **Request Validation**: Ensures incoming requests conform to JSON:API structure and rules
- **Response Validation**: Validates API responses against the JSON:API specification
- **Content-Type Checking**: Verifies proper `application/vnd.api+json` media type usage
- **Comprehensive Rule Coverage**: Validates all aspects of the JSON:API v1.1 specification

## Planned Features

### Core Validation Capabilities

- ✅ **Document Structure Validation**
  - Top-level document members (`data`, `errors`, `meta`, `links`, `included`, `jsonapi`)
  - Resource object validation with required `type` and `id` fields
  - Relationship object structure and links validation
  - Error object structure and HTTP status alignment

- ✅ **Content Type Compliance**
  - `application/vnd.api+json` content type validation
  - Media type parameters handling
  - HTTP method compliance (GET, POST, PATCH, DELETE)

- ✅ **Query Parameter Validation**
  - Sparse fieldsets (`fields[type]`) validation
  - Inclusion parameters (`include`) with relationship path validation
  - Sorting parameters (`sort`) with field validation
  - Pagination parameter validation
  - Custom filtering parameter support

- ✅ **Advanced Validation Features**
  - JSON Pointer-based error reporting for precise error locations
  - Multiple error reporting (doesn't stop at first error)
  - Severity levels (error, warning, info)
  - Performance-optimized validation for large documents

### Usage Interfaces

#### Programmatic API (Planned)

```javascript
import { validateJsonApi } from 'jsonapi-validator';

// Validate a JSON:API document
const result = await validateJsonApi(document, options);

if (result.isValid) {
  console.log('Document is valid JSON:API!');
} else {
  console.error('Validation errors:', result.errors);
}
```

#### Command Line Interface (Planned)

```bash
# Validate a JSON file
jsonapi-validate document.json

# Validate API endpoint
jsonapi-validate --url https://api.example.com/posts

# Output detailed report
jsonapi-validate document.json --format detailed --output report.json
```

#### HTTP Validation Middleware (Planned)

```javascript
import { jsonApiMiddleware } from 'jsonapi-validator/middleware';

// Express.js middleware
app.use('/api', jsonApiMiddleware({
  validateRequests: true,
  validateResponses: true,
  strictMode: false
}));
```

## Architecture Overview

### Core Components

```
src/
├── validators/          # Core validation engine
│   ├── DocumentValidator.js     # Main document structure validation
│   ├── ResourceValidator.js     # Resource object validation
│   ├── ErrorValidator.js        # Error object validation
│   └── QueryValidator.js        # Query parameter validation
├── rules/              # Individual validation rules
│   ├── ContentTypeRules.js      # Content-Type validation rules
│   ├── StructureRules.js        # Document structure rules
│   ├── RelationshipRules.js     # Relationship validation rules
│   └── FieldRules.js           # Field-specific validation rules
├── parsers/            # JSON:API document parsing
│   ├── DocumentParser.js        # Main document parser
│   └── QueryParser.js          # Query parameter parser
├── reporters/          # Error and result reporting
│   ├── ErrorReporter.js         # Structured error reporting
│   └── ResultFormatter.js       # Result output formatting
├── cli/                # Command-line interface
│   └── cli.js                  # CLI implementation
└── types/              # Type definitions
    └── jsonapi.d.ts            # JSON:API TypeScript types
```

### Validation Approach

1. **Document Parsing**: Parse and normalize the JSON:API document structure
2. **Rule Application**: Apply validation rules based on JSON:API v1.1 specification
3. **Error Aggregation**: Collect and categorize validation errors with precise locations
4. **Result Reporting**: Format results with actionable feedback and suggestions

### Performance Considerations

- **Streaming Validation**: Support for large document validation without loading entire document into memory
- **Lazy Evaluation**: Expensive validations only run when necessary
- **Caching**: Rule compilation and schema caching for repeated validations
- **Benchmarking**: Regular performance testing to ensure O(n) complexity where possible

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
