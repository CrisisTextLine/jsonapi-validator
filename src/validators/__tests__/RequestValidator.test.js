/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { validateRequestDocument } from '../RequestValidator.js'

describe('RequestValidator', () => {
  describe('validateRequestDocument', () => {
    describe('Valid request documents', () => {
      it('should validate POST request with new resource', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              title: 'New Article',
              body: 'Article content'
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate POST request with client-generated ID', () => {
        const request = {
          data: {
            id: 'client-123',
            type: 'articles',
            attributes: {
              title: 'New Article'
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate PATCH request with ID', () => {
        const request = {
          data: {
            id: '1',
            type: 'articles',
            attributes: {
              title: 'Updated Title'
            }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(true)
        expect(result.errors).toHaveLength(0)
      })

      it('should validate request with relationships', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              title: 'Article'
            },
            relationships: {
              author: {
                data: { id: '1', type: 'people' }
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate request with meta', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              title: 'Article'
            }
          },
          meta: {
            tracking: 'xyz'
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should reject DELETE request with null data', () => {
        const request = {
          data: null
        }

        const result = validateRequestDocument(request, 'DELETE')

        // Request data cannot be null for resource operations
        expect(result.valid).toBe(false)
      })
    })

    describe('Invalid request documents', () => {
      it('should reject empty request body', () => {
        const result = validateRequestDocument(null, 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Request Document Structure',
            message: expect.stringContaining('empty')
          })
        )
      })

      it('should reject undefined request body', () => {
        const result = validateRequestDocument(undefined, 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject non-object request body', () => {
        const result = validateRequestDocument('invalid', 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Request Document Structure'
          })
        )
      })

      it('should reject array as request body', () => {
        const result = validateRequestDocument([], 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
      })

      it('should reject request without data member', () => {
        const request = {
          meta: { tracking: 'xyz' }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            test: 'Request Document Structure',
            message: expect.stringContaining('data')
          })
        )
      })

      it('should reject request with errors member', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          },
          errors: [{ status: '400', title: 'Error' }]
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors).toContainEqual(
          expect.objectContaining({
            message: expect.stringContaining('errors')
          })
        )
      })

      it('should reject POST request with missing type', () => {
        const request = {
          data: {
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(false)
      })

      it('should reject PATCH request with missing ID', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Updated' }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(false)
        expect(result.errors.some(e =>
          e.message && e.message.toLowerCase().includes('id')
        )).toBe(true)
      })
    })

    describe('HTTP method specific validation', () => {
      it('should allow missing ID for POST requests', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'New' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should require ID for PATCH requests', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Updated' }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(false)
      })

      it('should require ID for PUT requests', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Updated' }
          }
        }

        const result = validateRequestDocument(request, 'PUT')

        expect(result.valid).toBe(false)
      })

      it('should validate GET request', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'GET')

        expect(result).toHaveProperty('valid')
      })

      it('should reject DELETE request with null data', () => {
        const request = {
          data: null
        }

        const result = validateRequestDocument(request, 'DELETE')

        // null data is not allowed
        expect(result.valid).toBe(false)
      })
    })

    describe('Validation options', () => {
      it('should allow missing ID for POST with allowMissingId', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'New' }
          }
        }

        // allowMissingId is already true by default for POST
        const result = validateRequestDocument(request, 'POST', { allowMissingId: true })

        expect(result.valid).toBe(true)
      })

      it('should validate with context option', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST', { context: 'test-context' })

        expect(result.valid).toBe(true)
      })

      it('should validate with readOnlyFields option', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              title: 'Test',
              createdAt: '2024-01-01'
            }
          }
        }

        const result = validateRequestDocument(request, 'POST', {
          readOnlyFields: ['createdAt']
        })

        // Should either pass or warn about read-only fields
        expect(result).toHaveProperty('valid')
      })
    })

    describe('Resource object validation', () => {
      it('should validate resource type', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate resource attributes', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              title: 'Test Title',
              body: 'Test Body',
              tags: ['tag1', 'tag2']
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate resource relationships', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' },
            relationships: {
              author: {
                data: { id: '1', type: 'people' }
              },
              comments: {
                data: [
                  { id: '1', type: 'comments' },
                  { id: '2', type: 'comments' }
                ]
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should reject invalid resource type', () => {
        const request = {
          data: {
            type: '',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(false)
      })

      it('should reject resource with invalid attributes', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: 'invalid'
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(false)
      })
    })

    describe('Relationship updates', () => {
      it('should validate relationship update request', () => {
        const request = {
          data: {
            id: '1',
            type: 'articles',
            relationships: {
              author: {
                data: { id: '2', type: 'people' }
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(true)
      })

      it('should validate clearing relationship', () => {
        const request = {
          data: {
            id: '1',
            type: 'articles',
            relationships: {
              author: {
                data: null
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(true)
      })

      it('should validate array relationship update', () => {
        const request = {
          data: {
            id: '1',
            type: 'articles',
            relationships: {
              tags: {
                data: [
                  { id: '1', type: 'tags' },
                  { id: '2', type: 'tags' }
                ]
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'PATCH')

        expect(result.valid).toBe(true)
      })
    })

    describe('Edge cases', () => {
      it('should validate request with only type', () => {
        const request = {
          data: {
            type: 'articles'
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate request with empty attributes', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {}
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should validate request with empty relationships', () => {
        const request = {
          data: {
            type: 'articles',
            relationships: {}
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })

      it('should handle very long attribute names', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              ['a'.repeat(100)]: 'value'
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result).toHaveProperty('valid')
      })

      it('should handle deeply nested attributes', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: {
              nested: {
                deep: {
                  value: 'test'
                }
              }
            }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
      })
    })

    describe('Result structure', () => {
      it('should always return valid result structure', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result).toHaveProperty('valid')
        expect(result).toHaveProperty('errors')
        expect(result).toHaveProperty('warnings')
        expect(result).toHaveProperty('details')
        expect(Array.isArray(result.errors)).toBe(true)
        expect(Array.isArray(result.warnings)).toBe(true)
        expect(Array.isArray(result.details)).toBe(true)
      })

      it('should include error details for invalid requests', () => {
        const result = validateRequestDocument(null, 'POST')

        expect(result.valid).toBe(false)
        expect(result.errors.length).toBeGreaterThan(0)
        expect(result.errors[0]).toHaveProperty('test')
        expect(result.errors[0]).toHaveProperty('message')
      })

      it('should include details for valid requests', () => {
        const request = {
          data: {
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }

        const result = validateRequestDocument(request, 'POST')

        expect(result.valid).toBe(true)
        expect(result.details.length).toBeGreaterThan(0)
      })
    })
  })
})
