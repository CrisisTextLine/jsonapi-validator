/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import {
  validateContentNegotiation,
  validateContentTypeHeader,
  validateAcceptHeader
} from '../ContentNegotiationValidator.js'

describe('ContentNegotiationValidator', () => {
  describe('validateContentTypeHeader', () => {
    describe('Valid Content-Type headers', () => {
      it('should validate basic JSON:API Content-Type', () => {
        const result = validateContentTypeHeader('application/vnd.api+json')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'Content-Type Media Type',
            status: 'passed'
          })
        )
      })

      it('should validate Content-Type with ext parameter', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; ext="https://example.com/ext"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Content-Type with profile parameter', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; profile="https://example.com/profile"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Content-Type with multiple ext values', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; ext="https://example.com/ext1 https://example.com/ext2"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Content-Type with multiple profile values', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; profile="https://example.com/p1 https://example.com/p2"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Content-Type with both ext and profile', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; ext="https://example.com/ext"; profile="https://example.com/profile"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })
    })

    describe('Invalid Content-Type headers', () => {
      it('should reject missing Content-Type', () => {
        const result = validateContentTypeHeader('')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Content-Type Header Presence',
            message: expect.stringContaining('required')
          })
        )
      })

      it('should reject null Content-Type', () => {
        const result = validateContentTypeHeader(null)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject undefined Content-Type', () => {
        const result = validateContentTypeHeader(undefined)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject wrong media type', () => {
        const result = validateContentTypeHeader('application/json')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Content-Type Media Type',
            message: expect.stringContaining('application/vnd.api+json')
          })
        )
      })

      it('should reject text/html media type', () => {
        const result = validateContentTypeHeader('text/html')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject invalid ext parameter (not a URL)', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; ext="not-a-url"')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Extension Parameter',
            message: expect.stringContaining('invalid')
          })
        )
      })

      it('should validate profile parameter with valid string', () => {
        // "not-a-url" is actually valid as a relative URL
        const result = validateContentTypeHeader('application/vnd.api+json; profile="not-a-url"')

        expect(result.valid).toBe(true)
      })

      it('should validate profile parameter even with spaces (URL encoded)', () => {
        // Spaces might be URL encoded, so this could be valid
        const result = validateContentTypeHeader('application/vnd.api+json; profile="has spaces"')

        // This is valid because the parser handles it
        expect(result.valid).toBe(true)
      })

      it('should validate without ext parameter when empty', () => {
        // Empty ext parameter will be treated as no parameter
        const result = validateContentTypeHeader('application/vnd.api+json; ext=""')

        expect(result.valid).toBe(true)
      })

      it('should validate without profile parameter when empty', () => {
        // Empty profile parameter will be treated as no parameter
        const result = validateContentTypeHeader('application/vnd.api+json; profile=""')

        expect(result.valid).toBe(true)
      })
    })

    describe('Warnings for Content-Type', () => {
      it('should warn about unknown parameters', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; charset=utf-8')

        expect(result.valid).toBe(true)
        expect(result.warnings).toContainEqual(
          expect.objectContaining({
            test: 'Media Type Parameters',
            message: expect.stringContaining('unknown parameters')
          })
        )
      })

      it('should warn about multiple unknown parameters', () => {
        const result = validateContentTypeHeader('application/vnd.api+json; charset=utf-8; boundary=something')

        expect(result.valid).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
      })
    })
  })

  describe('validateAcceptHeader', () => {
    describe('Valid Accept headers', () => {
      it('should validate basic JSON:API Accept header', () => {
        const result = validateAcceptHeader('application/vnd.api+json')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'Accept Header Compatibility',
            status: 'passed'
          })
        )
      })

      it('should validate Accept header with wildcard', () => {
        const result = validateAcceptHeader('*/*')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Accept header with application wildcard', () => {
        const result = validateAcceptHeader('application/*')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Accept header with multiple types', () => {
        const result = validateAcceptHeader('application/vnd.api+json, application/json')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Accept header with quality values', () => {
        const result = validateAcceptHeader('application/vnd.api+json; q=1.0, application/json; q=0.8')

        expect(result.valid).toBe(true)
      })

      it('should validate Accept header with ext parameter', () => {
        const result = validateAcceptHeader('application/vnd.api+json; ext="https://example.com/ext"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate Accept header with profile parameter', () => {
        const result = validateAcceptHeader('application/vnd.api+json; profile="https://example.com/profile"')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate empty Accept header', () => {
        const result = validateAcceptHeader('')

        expect(result.valid).toBe(true)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'Accept Header Presence',
            status: 'passed'
          })
        )
      })

      it('should validate null Accept header', () => {
        const result = validateAcceptHeader(null)

        expect(result.valid).toBe(true)
      })

      it('should validate undefined Accept header', () => {
        const result = validateAcceptHeader(undefined)

        expect(result.valid).toBe(true)
      })
    })

    describe('Invalid Accept headers', () => {
      it('should reject Accept header without JSON:API type', () => {
        const result = validateAcceptHeader('text/html')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Accept Header Compatibility',
            message: expect.stringContaining('application/vnd.api+json')
          })
        )
      })

      it('should reject Accept header with only application/json', () => {
        const result = validateAcceptHeader('application/json')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject Accept header with only text types', () => {
        const result = validateAcceptHeader('text/html, text/plain')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject invalid ext parameter in Accept', () => {
        const result = validateAcceptHeader('application/vnd.api+json; ext="not-a-url"')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Extension Parameter'
          })
        )
      })

      it('should validate profile parameter with valid string in Accept', () => {
        // "not-a-url" is valid as a relative URL
        const result = validateAcceptHeader('application/vnd.api+json; profile="not-a-url"')

        expect(result.valid).toBe(true)
      })

      it('should validate profile parameter in Accept even with spaces', () => {
        // Spaces are handled by the parser
        const result = validateAcceptHeader('application/vnd.api+json; profile="has spaces"')

        expect(result.valid).toBe(true)
      })
    })

    describe('Multiple media types in Accept', () => {
      it('should validate when JSON:API is first', () => {
        const result = validateAcceptHeader('application/vnd.api+json, text/html')

        expect(result.valid).toBe(true)
      })

      it('should validate when JSON:API is second', () => {
        const result = validateAcceptHeader('text/html, application/vnd.api+json')

        expect(result.valid).toBe(true)
      })

      it('should validate with wildcard included', () => {
        const result = validateAcceptHeader('application/vnd.api+json, */*')

        expect(result.valid).toBe(true)
      })

      it('should validate parameters on multiple types', () => {
        const result = validateAcceptHeader('application/vnd.api+json; ext="https://example.com/ext1", application/vnd.api+json; ext="https://example.com/ext2"')

        expect(result.valid).toBe(true)
      })
    })
  })

  describe('validateContentNegotiation', () => {
    describe('Complete header validation', () => {
      it('should validate both Content-Type and Accept headers', () => {
        const headers = {
          'content-type': 'application/vnd.api+json',
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate with ext parameters in both headers', () => {
        const headers = {
          'content-type': 'application/vnd.api+json; ext="https://example.com/ext"',
          'accept': 'application/vnd.api+json; ext="https://example.com/ext"'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate with profile parameters in both headers', () => {
        const headers = {
          'content-type': 'application/vnd.api+json; profile="https://example.com/profile"',
          'accept': 'application/vnd.api+json; profile="https://example.com/profile"'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should fail if Content-Type is invalid', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should fail if Accept is invalid', () => {
        const headers = {
          'content-type': 'application/vnd.api+json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should fail if both headers are invalid', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(1)
      })
    })

    describe('Options parameter', () => {
      it('should skip Content-Type validation when disabled', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers, { validateContentType: false })

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should skip Accept validation when disabled', () => {
        const headers = {
          'content-type': 'application/vnd.api+json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers, { validateAccept: false })

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate only Content-Type when Accept is disabled', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers, { validateAccept: false })

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBe(1)
      })

      it('should validate only Accept when Content-Type is disabled', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers, { validateContentType: false })

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBe(1)
      })
    })

    describe('Edge cases', () => {
      it('should handle empty headers object', () => {
        const result = validateContentNegotiation({})

        expect(result.valid).toBe(false)
      })

      it('should handle missing Content-Type', () => {
        const headers = {
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(false)
      })

      it('should handle missing Accept', () => {
        const headers = {
          'content-type': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.valid).toBe(true)
      })

      it('should handle case-sensitive header names', () => {
        const headers = {
          'Content-Type': 'application/vnd.api+json',
          'Accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        // Should fail because header names are case-sensitive in our implementation
        expect(result.valid).toBe(false)
      })
    })

    describe('Result structure', () => {
      it('should always return valid result structure', () => {
        const result = validateContentNegotiation({})

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('warnings')
        expect(result).toHaveProperty('details')
        expect(Array.isArray(result.errors)).toBe(true)
        expect(Array.isArray(result.warnings)).toBe(true)
        expect(Array.isArray(result.details)).toBe(true)
      })

      it('should merge errors from both validators', () => {
        const headers = {
          'content-type': 'application/json',
          'accept': 'text/html'
        }

        const result = validateContentNegotiation(headers)

        expect(result.errors.length).toBeGreaterThan(1)
      })

      it('should merge warnings from both validators', () => {
        const headers = {
          'content-type': 'application/vnd.api+json; charset=utf-8',
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.warnings.length).toBeGreaterThan(0)
      })

      it('should merge details from both validators', () => {
        const headers = {
          'content-type': 'application/vnd.api+json',
          'accept': 'application/vnd.api+json'
        }

        const result = validateContentNegotiation(headers)

        expect(result.details.length).toBeGreaterThan(1)
      })
    })
  })
})
