/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { validateHttpStatus } from '../HttpStatusValidator.js'

describe('HttpStatusValidator', () => {
  describe('validateHttpStatus', () => {
    describe('2xx Success Status Codes', () => {
      it('should validate 200 OK status', () => {
        const result = validateHttpStatus(200, 'GET')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'HTTP Status Code Appropriateness',
            status: 'passed',
            message: expect.stringContaining('200')
          })
        )
      })

      it('should validate 201 Created status', () => {
        const result = validateHttpStatus(201, 'POST')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate 202 Accepted status', () => {
        const result = validateHttpStatus(202, 'POST')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate 204 No Content status', () => {
        const result = validateHttpStatus(204, 'DELETE')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate other 2xx status codes', () => {
        const validCodes = [200, 201, 202, 203, 204, 205, 206]

        validCodes.forEach(code => {
          const result = validateHttpStatus(code, 'GET')
          expect(result.valid).toBe(true)
        })
      })
    })

    describe('4xx Client Error Status Codes', () => {
      it('should validate 400 Bad Request with error document', () => {
        const errorDocument = {
          errors: [{
            status: '400',
            title: 'Bad Request',
            detail: 'Invalid request format'
          }]
        }

        const result = validateHttpStatus(400, 'POST', errorDocument)

        expect(result.valid).toBe(true)
        expect(result.warnings).toHaveLength(0)
      })

      it('should validate 400 without error document', () => {
        const result = validateHttpStatus(400, 'POST', null)

        expect(result.valid).toBe(true)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'HTTP Status Code Appropriateness',
            status: 'passed'
          })
        )
      })

      it('should validate 401 Unauthorized', () => {
        const errorDocument = {
          errors: [{
            status: '401',
            title: 'Unauthorized'
          }]
        }

        const result = validateHttpStatus(401, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 403 Forbidden', () => {
        const errorDocument = {
          errors: [{
            status: '403',
            title: 'Forbidden'
          }]
        }

        const result = validateHttpStatus(403, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 404 Not Found', () => {
        const errorDocument = {
          errors: [{
            status: '404',
            title: 'Not Found'
          }]
        }

        const result = validateHttpStatus(404, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 405 Method Not Allowed', () => {
        const errorDocument = {
          errors: [{
            status: '405',
            title: 'Method Not Allowed'
          }]
        }

        const result = validateHttpStatus(405, 'PUT', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 406 Not Acceptable', () => {
        const errorDocument = {
          errors: [{
            status: '406',
            title: 'Not Acceptable'
          }]
        }

        const result = validateHttpStatus(406, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 409 Conflict', () => {
        const errorDocument = {
          errors: [{
            status: '409',
            title: 'Conflict'
          }]
        }

        const result = validateHttpStatus(409, 'POST', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 415 Unsupported Media Type', () => {
        const errorDocument = {
          errors: [{
            status: '415',
            title: 'Unsupported Media Type'
          }]
        }

        const result = validateHttpStatus(415, 'POST', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 422 Unprocessable Entity', () => {
        const errorDocument = {
          errors: [{
            status: '422',
            title: 'Unprocessable Entity',
            source: { pointer: '/data/attributes/email' }
          }]
        }

        const result = validateHttpStatus(422, 'POST', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 429 Too Many Requests', () => {
        const errorDocument = {
          errors: [{
            status: '429',
            title: 'Too Many Requests'
          }]
        }

        const result = validateHttpStatus(429, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should handle other 4xx codes', () => {
        const clientErrorCodes = [400, 401, 403, 404, 405, 406, 408, 409, 410, 415, 422, 429]

        clientErrorCodes.forEach(code => {
          const result = validateHttpStatus(code, 'GET', null)
          expect(result.valid).toBe(true)
        })
      })
    })

    describe('5xx Server Error Status Codes', () => {
      it('should validate 500 Internal Server Error', () => {
        const errorDocument = {
          errors: [{
            status: '500',
            title: 'Internal Server Error'
          }]
        }

        const result = validateHttpStatus(500, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should not warn on 500 with null response', () => {
        const result = validateHttpStatus(500, 'GET', null)

        expect(result.valid).toBe(true)
        expect(result.details).toContainEqual(
          expect.objectContaining({
            test: 'HTTP Status Code Appropriateness',
            status: 'passed'
          })
        )
      })

      it('should warn on 500 with non-error response document', () => {
        const result = validateHttpStatus(500, 'GET', { meta: {} })

        expect(result.valid).toBe(true)
        expect(result.warnings.length).toBeGreaterThan(0)
        expect(result.warnings.some(w =>
          w.message && w.message.toLowerCase().includes('error')
        )).toBe(true)
      })

      it('should validate 501 Not Implemented', () => {
        const errorDocument = {
          errors: [{
            status: '501',
            title: 'Not Implemented'
          }]
        }

        const result = validateHttpStatus(501, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 502 Bad Gateway', () => {
        const errorDocument = {
          errors: [{
            status: '502',
            title: 'Bad Gateway'
          }]
        }

        const result = validateHttpStatus(502, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 503 Service Unavailable', () => {
        const errorDocument = {
          errors: [{
            status: '503',
            title: 'Service Unavailable'
          }]
        }

        const result = validateHttpStatus(503, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate 504 Gateway Timeout', () => {
        const errorDocument = {
          errors: [{
            status: '504',
            title: 'Gateway Timeout'
          }]
        }

        const result = validateHttpStatus(504, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should handle other 5xx codes', () => {
        const serverErrorCodes = [500, 501, 502, 503, 504]

        serverErrorCodes.forEach(code => {
          const result = validateHttpStatus(code, 'GET', null)
          expect(result.valid).toBe(true)
        })
      })
    })

    describe('3xx Redirection Status Codes', () => {
      it('should validate 301 Moved Permanently', () => {
        const result = validateHttpStatus(301, 'GET')

        expect(result.valid).toBe(true)
      })

      it('should validate 302 Found', () => {
        const result = validateHttpStatus(302, 'GET')

        expect(result.valid).toBe(true)
      })

      it('should validate 303 See Other', () => {
        const result = validateHttpStatus(303, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate 304 Not Modified', () => {
        const result = validateHttpStatus(304, 'GET')

        expect(result.valid).toBe(true)
      })

      it('should validate 307 Temporary Redirect', () => {
        const result = validateHttpStatus(307, 'GET')

        expect(result.valid).toBe(true)
      })

      it('should validate 308 Permanent Redirect', () => {
        const result = validateHttpStatus(308, 'GET')

        expect(result.valid).toBe(true)
      })
    })

    describe('Invalid Status Codes', () => {
      it('should handle invalid status codes', () => {
        const invalidCodes = [99, 600, 999, 1000]

        invalidCodes.forEach(code => {
          const result = validateHttpStatus(code, 'GET')
          // Should still return a result structure
          expect(result).toHaveProperty('valid')
          expect(result).toHaveProperty('errors')
          expect(result).toHaveProperty('warnings')
          expect(result).toHaveProperty('details')
        })
      })

      it('should handle non-numeric status codes', () => {
        const result = validateHttpStatus(NaN, 'GET')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
      })
    })

    describe('HTTP Methods', () => {
      it('should accept GET method', () => {
        const result = validateHttpStatus(200, 'GET')

        expect(result.valid).toBe(true)
      })

      it('should accept POST method', () => {
        const result = validateHttpStatus(201, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should accept PUT method', () => {
        const result = validateHttpStatus(200, 'PUT')

        expect(result.valid).toBe(true)
      })

      it('should accept PATCH method', () => {
        const result = validateHttpStatus(200, 'PATCH')

        expect(result.valid).toBe(true)
      })

      it('should accept DELETE method', () => {
        const result = validateHttpStatus(204, 'DELETE')

        expect(result.valid).toBe(true)
      })

      it('should accept HEAD method', () => {
        const result = validateHttpStatus(200, 'HEAD')

        expect(result.valid).toBe(true)
      })

      it('should accept OPTIONS method', () => {
        const result = validateHttpStatus(200, 'OPTIONS')

        expect(result.valid).toBe(true)
      })
    })

    describe('Response Document Validation', () => {
      it('should validate with success document', () => {
        const successDocument = {
          data: {
            id: '1',
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateHttpStatus(200, 'GET', successDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate with error document', () => {
        const errorDocument = {
          errors: [{
            status: '404',
            title: 'Not Found',
            detail: 'Resource not found'
          }]
        }

        const result = validateHttpStatus(404, 'GET', errorDocument)

        expect(result.valid).toBe(true)
      })

      it('should validate with meta-only document', () => {
        const metaDocument = {
          meta: { total: 100 }
        }

        const result = validateHttpStatus(200, 'GET', metaDocument)

        expect(result.valid).toBe(true)
      })

      it('should handle null response document', () => {
        const result = validateHttpStatus(204, 'DELETE', null)

        expect(result.valid).toBe(true)
      })

      it('should handle undefined response document', () => {
        const result = validateHttpStatus(200, 'GET')

        expect(result.valid).toBe(true)
      })
    })

    describe('Edge Cases', () => {
      it('should validate 0 status code', () => {
        const result = validateHttpStatus(0, 'GET')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
      })

      it('should validate negative status code', () => {
        const result = validateHttpStatus(-1, 'GET')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
      })

      it('should validate very large status code', () => {
        const result = validateHttpStatus(99999, 'GET')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
      })

      it('should handle empty method string', () => {
        const result = validateHttpStatus(200, '')

        expect(result.valid).toBe(true)
      })

      it('should handle lowercase method', () => {
        const result = validateHttpStatus(200, 'get')

        expect(result.valid).toBe(true)
      })

      it('should handle mixed case method', () => {
        const result = validateHttpStatus(200, 'GeT')

        expect(result.valid).toBe(true)
      })
    })

    describe('Result Structure', () => {
      it('should always return valid result structure', () => {
        const result = validateHttpStatus(200, 'GET')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('warnings')
        expect(result).toHaveProperty('details')
        expect(Array.isArray(result.errors)).toBe(true)
        expect(Array.isArray(result.warnings)).toBe(true)
        expect(Array.isArray(result.details)).toBe(true)
      })

      it('should include test name in errors', () => {
        const result = validateHttpStatus(400, 'POST', null)

        if (result.warnings.length > 0) {
          expect(result.warnings[0]).toHaveProperty('test')
          expect(result.warnings[0]).toHaveProperty('message')
        }
      })

      it('should include test name in details', () => {
        const result = validateHttpStatus(200, 'GET')

        expect(result.details.length).toBeGreaterThan(0)
        expect(result.details[0]).toHaveProperty('test')
        expect(result.details[0]).toHaveProperty('status')
        expect(result.details[0]).toHaveProperty('message')
      })

      it('should have passed status for success codes', () => {
        const result = validateHttpStatus(200, 'GET')

        const statusTest = result.details.find(d => d.test === 'HTTP Status Code Appropriateness')
        expect(statusTest).toBeDefined()
        expect(statusTest?.status).toBe('passed')
      })
    })
  })
})
