# GitHub Copilot Instructions for JSON:API Validator

## Repository Overview

This repository contains a JSON:API v1.1 specification validator designed to ensure API endpoint compliance with the JSON:API standard (https://jsonapi.org/format/). The validator helps developers and organizations verify that their APIs correctly implement the JSON:API specification.

## Development Guidelines

### Project Purpose and Scope

- **Primary Goal**: Validate JSON:API v1.1 spec compliance for any given API endpoint
- **Target Audience**: API developers, QA engineers, and DevOps teams
- **Validation Scope**: Request and response validation, content-type checking, structure validation, relationship validation

### Code Style and Architecture

- Follow modern JavaScript/TypeScript best practices
- Use functional programming patterns where appropriate
- Implement comprehensive error handling and meaningful error messages
- Design with extensibility in mind for future JSON:API spec versions
- Prioritize performance for high-volume validation scenarios

### JSON:API Specification Focus Areas

When suggesting code for this validator, ensure coverage of these key JSON:API v1.1 specification areas:

1. **Document Structure**
   - Top-level members (data, errors, meta, links, included, jsonapi)
   - Resource objects structure
   - Relationship objects

2. **Content Type Validation**
   - `application/vnd.api+json` content type
   - Media type parameters handling

3. **Resource Object Validation**
   - Required `type` and `id` fields (except for new resources)
   - Attributes and relationships structure
   - Links object validation

4. **Error Object Validation**
   - Error object structure and required fields
   - HTTP status code alignment

5. **Query Parameters**
   - Sparse fieldsets (`fields[type]`)
   - Inclusion of related resources (`include`)
   - Sorting (`sort`)
   - Pagination
   - Filtering

6. **HTTP Method Compliance**
   - GET, POST, PATCH, DELETE method handling
   - Proper status code responses

### Testing Strategy

- Write comprehensive unit tests for each validation rule
- Include integration tests with real JSON:API examples
- Test both valid and invalid JSON:API documents
- Include edge cases and malformed data scenarios
- Performance tests for large document validation

### Error Handling and Reporting

- Provide detailed, actionable error messages
- Include JSON pointer references for precise error locations
- Support multiple error reporting (don't stop at first error)
- Include severity levels (error, warning, info)

### API Design Preferences

- Design for both programmatic usage and CLI usage
- Support streaming validation for large documents
- Allow custom validation rule configuration
- Provide clear validation result objects with structured feedback

### Documentation Standards

- Include JSDoc comments for all public APIs
- Provide usage examples in README
- Document all validation rules with spec references
- Include migration guides for different JSON:API versions

### Dependencies and Libraries

- Prefer lightweight, well-maintained dependencies
- Use JSON Schema where appropriate for validation
- Consider performance implications of dependency choices
- Keep dependencies up-to-date and secure

### File Organization

```
src/
├── validators/          # Core validation logic
├── rules/              # Individual validation rules
├── parsers/            # JSON:API document parsing
├── reporters/          # Error/result reporting
├── cli/                # Command-line interface
└── types/              # TypeScript type definitions

tests/
├── unit/               # Unit tests for individual components
├── integration/        # Integration tests with real data
└── fixtures/           # Test data and JSON:API examples
```

### Performance Considerations

- Optimize for O(n) validation complexity where possible
- Use lazy evaluation for expensive validations
- Support incremental validation for large documents
- Profile and benchmark validation performance regularly

### Compatibility and Standards

- Support JSON:API v1.1 specification fully
- Consider backward compatibility with v1.0 where feasible
- Follow semantic versioning for releases
- Maintain changelog with specification compliance updates

## Contribution Guidelines

- All code should include appropriate tests
- Follow existing code style and linting rules
- Update documentation when adding new features
- Include JSON:API spec references in validation rule comments
- Consider internationalization for error messages

## Security Considerations

- Validate input sizes to prevent DoS attacks
- Sanitize error messages to prevent information disclosure
- Handle malicious JSON structures safely
- Audit dependencies for security vulnerabilities regularly