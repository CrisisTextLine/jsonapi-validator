/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest'
import { validateDocument } from '../DocumentValidator.js'

describe('DocumentValidator', () => {
  describe('validateDocument', () => {
    it('should validate a basic valid JSON:API document', () => {
      const validDocument = {
        jsonapi: { version: '1.1' },
        data: {
          id: '1',
          type: 'articles',
          attributes: { title: 'Test Article' }
        }
      }

      const result = validateDocument(validDocument)
      
      expect(result.valid).toBe(true)
      expect(result.errors).toHaveLength(0)
      expect(result.details).toContainEqual(
        expect.objectContaining({
          test: 'JSON Parsing',
          status: 'passed'
        })
      )
    })

    it('should reject null or undefined documents', () => {
      const nullResult = validateDocument(null)
      const undefinedResult = validateDocument(undefined)
      
      expect(nullResult.valid).toBe(false)
      expect(nullResult.errors[0].message).toContain('null or undefined')
      
      expect(undefinedResult.valid).toBe(false)
      expect(undefinedResult.errors[0].message).toContain('null or undefined')
    })

    it('should reject non-object documents', () => {
      const stringResult = validateDocument('invalid')
      const numberResult = validateDocument(123)
      const arrayResult = validateDocument([])
      
      expect(stringResult.valid).toBe(false)
      expect(stringResult.errors[0].message).toContain('must be a JSON object')
      
      expect(numberResult.valid).toBe(false)
      expect(arrayResult.valid).toBe(false)
    })

    it('should validate documents with data member', () => {
      const documentWithData = {
        jsonapi: { version: '1.1' },
        data: {
          id: '1',
          type: 'articles',
          attributes: { title: 'Test' }
        }
      }

      const result = validateDocument(documentWithData)
      expect(result.valid).toBe(true)
    })

    it('should validate documents with errors member', () => {
      const documentWithErrors = {
        jsonapi: { version: '1.1' },
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Resource not found'
        }]
      }

      const result = validateDocument(documentWithErrors)
      expect(result.valid).toBe(true)
    })

    it('should validate documents with meta member only', () => {
      const documentWithMeta = {
        jsonapi: { version: '1.1' },
        meta: {
          totalPages: 10,
          currentPage: 1
        }
      }

      const result = validateDocument(documentWithMeta)
      expect(result.valid).toBe(true)
    })

    it('should reject documents with both data and errors', () => {
      const invalidDocument = {
        jsonapi: { version: '1.1' },
        data: { id: '1', type: 'articles' },
        errors: [{ status: '404', title: 'Not Found' }]
      }

      const result = validateDocument(invalidDocument)
      expect(result.valid).toBe(false)
      expect(result.errors.some(error => 
        error.message && error.message.includes('data and errors')
      )).toBe(true)
    })

    it('should reject empty documents', () => {
      const emptyDocument = {}

      const result = validateDocument(emptyDocument)
      expect(result.valid).toBe(false)
    })

    it('should validate array data', () => {
      const documentWithArray = {
        jsonapi: { version: '1.1' },
        data: [
          { id: '1', type: 'articles', attributes: { title: 'Article 1' } },
          { id: '2', type: 'articles', attributes: { title: 'Article 2' } }
        ]
      }

      const result = validateDocument(documentWithArray)
      expect(result.valid).toBe(true)
    })

    it('should validate null data', () => {
      const documentWithNullData = {
        jsonapi: { version: '1.1' },
        data: null
      }

      const result = validateDocument(documentWithNullData)
      expect(result.valid).toBe(true)
    })

    it('should validate included member when data is present', () => {
      const documentWithIncluded = {
        jsonapi: { version: '1.1' },
        data: { id: '1', type: 'articles', attributes: { title: 'Test' } },
        included: [
          { id: '1', type: 'people', attributes: { name: 'John' } }
        ]
      }

      const result = validateDocument(documentWithIncluded)
      expect(result.valid).toBe(true)
    })

    it('should reject included member without data', () => {
      const documentWithIncludedNoData = {
        jsonapi: { version: '1.1' },
        meta: { total: 0 },
        included: [
          { id: '1', type: 'people', attributes: { name: 'John' } }
        ]
      }

      const result = validateDocument(documentWithIncludedNoData)
      expect(result.valid).toBe(false)
      expect(result.errors.some(error => 
        error.message && error.message.includes('included')
      )).toBe(true)
    })
  })
})