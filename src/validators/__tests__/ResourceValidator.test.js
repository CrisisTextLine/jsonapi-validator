/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { validateResourceObject, validateResourceCollection, validateMemberName } from '../ResourceValidator.js'

describe('ResourceValidator', () => {
  describe('validateResourceObject', () => {
    it('should validate a basic valid resource object', () => {
      const validResource = {
        id: '1',
        type: 'articles',
        attributes: { title: 'Test Article' }
      }

      const result = validateResourceObject(validResource)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('should reject null or undefined resources', () => {
      const nullResult = validateResourceObject(null)
      const undefinedResult = validateResourceObject(undefined)
      
      expect(nullResult.valid).toBe(false)
      expect(nullResult.errors[0].message).toContain('null or undefined')
      
      expect(undefinedResult.valid).toBe(false)
    })

    it('should reject non-object resources', () => {
      const stringResult = validateResourceObject('invalid')
      const numberResult = validateResourceObject(123)
      const arrayResult = validateResourceObject([])
      
      expect(stringResult.valid).toBe(false)
      expect(stringResult.errors[0].message).toContain('must be an object')
      
      expect(numberResult.valid).toBe(false)
      expect(arrayResult.valid).toBe(false)
    })

    it('should require type member', () => {
      const resourceWithoutType = {
        id: '1',
        attributes: { title: 'Test' }
      }

      const result = validateResourceObject(resourceWithoutType)
      expect(result.valid).toBe(false)
      expect(result.errors.some(error => 
        error.message && error.message.includes('type')
      )).toBe(true)
    })

    it('should validate type member format', () => {
      const validTypeResource = {
        id: '1',
        type: 'articles',
        attributes: { title: 'Test' }
      }

      const invalidTypeResource = {
        id: '1',
        type: '',
        attributes: { title: 'Test' }
      }

      const validResult = validateResourceObject(validTypeResource)
      const invalidResult = validateResourceObject(invalidTypeResource)
      
      expect(validResult.valid).toBe(true)
      expect(invalidResult.valid).toBe(false)
    })

    it('should allow missing id when specified', () => {
      const resourceWithoutId = {
        type: 'articles',
        attributes: { title: 'New Article' }
      }

      const result = validateResourceObject(resourceWithoutId, { allowMissingId: true })
      expect(result.valid).toBe(true)
    })

    it('should reject missing id by default', () => {
      const resourceWithoutId = {
        type: 'articles',
        attributes: { title: 'Article' }
      }

      const result = validateResourceObject(resourceWithoutId)
      expect(result.valid).toBe(false)
      expect(result.errors.some(error => 
        error.message && error.message.includes('id')
      )).toBe(true)
    })

    it('should validate attributes member', () => {
      const validAttributes = {
        id: '1',
        type: 'articles',
        attributes: {
          title: 'Test Article',
          body: 'Article content',
          publishedAt: '2023-01-01T00:00:00Z'
        }
      }

      const result = validateResourceObject(validAttributes)
      expect(result.valid).toBe(true)
    })

    it('should reject attributes with reserved names', () => {
      const invalidAttributes = {
        id: '1',
        type: 'articles',
        attributes: {
          id: 'duplicate-id', // Reserved name
          type: 'duplicate-type', // Reserved name
          title: 'Test'
        }
      }

      const result = validateResourceObject(invalidAttributes)
      expect(result.valid).toBe(false)
    })

    it('should validate relationships structure', () => {
      const validRelationships = {
        id: '1',
        type: 'articles',
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

      const result = validateResourceObject(validRelationships)
      expect(result.valid).toBe(true)
    })

    it('should validate links structure', () => {
      const validLinks = {
        id: '1',
        type: 'articles',
        links: {
          self: 'https://example.com/articles/1',
          related: {
            href: 'https://example.com/articles/1/comments',
            meta: { count: 10 }
          }
        }
      }

      const result = validateResourceObject(validLinks)
      expect(result.valid).toBe(true)
    })

    it('should validate meta member', () => {
      const validMeta = {
        id: '1',
        type: 'articles',
        meta: {
          created: '2023-01-01',
          version: 1
        }
      }

      const result = validateResourceObject(validMeta)
      expect(result.valid).toBe(true)
    })
  })

  describe('validateResourceCollection', () => {
    it('should validate an empty array', () => {
      const result = validateResourceCollection([])
      expect(result.valid).toBe(true)
    })

    it('should validate array of valid resources', () => {
      const validCollection = [
        { id: '1', type: 'articles', attributes: { title: 'Article 1' } },
        { id: '2', type: 'articles', attributes: { title: 'Article 2' } }
      ]

      const result = validateResourceCollection(validCollection)
      expect(result.valid).toBe(true)
    })

    it('should reject non-array input', () => {
      const result = validateResourceCollection({ id: '1', type: 'articles' })
      expect(result.valid).toBe(false)
    })

    it('should detect invalid resources in collection', () => {
      const invalidCollection = [
        { id: '1', type: 'articles', attributes: { title: 'Valid' } },
        { id: '2' } // Missing type
      ]

      const result = validateResourceCollection(invalidCollection)
      expect(result.valid).toBe(false)
    })
  })

  describe('validateMemberName', () => {
    it('should validate valid member names', () => {
      expect(validateMemberName('valid-name').valid).toBe(true)
      expect(validateMemberName('validname').valid).toBe(true)
      expect(validateMemberName('valid_name').valid).toBe(true)
      expect(validateMemberName('valid123').valid).toBe(true)
    })

    it('should reject invalid member names', () => {
      expect(validateMemberName('invalid name').valid).toBe(false) // Space
      expect(validateMemberName('invalid--name').valid).toBe(false) // Double hyphen
      expect(validateMemberName('invalid__name').valid).toBe(false) // Double underscore
      expect(validateMemberName('').valid).toBe(false) // Empty string
      expect(validateMemberName(null).valid).toBe(false) // Null
    })

    it('should reject reserved member names', () => {
      expect(validateMemberName('id').valid).toBe(false)
      expect(validateMemberName('type').valid).toBe(false)
      expect(validateMemberName('links').valid).toBe(false)
      expect(validateMemberName('relationships').valid).toBe(false)
    })
  })
})