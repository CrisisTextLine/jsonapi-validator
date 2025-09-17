/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { runValidation } from '../ValidationService.js'
import * as ApiClient from '../ApiClient.js'

// Mock the ApiClient
vi.mock('../ApiClient.js', () => ({
  makeRequest: vi.fn()
}))

describe('ValidationService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('runValidation', () => {
    it('should successfully validate a valid JSON:API endpoint', async () => {
      // Mock a successful API response
      const mockResponse = {
        success: true,
        status: 200,
        headers: {
          'content-type': 'application/vnd.api+json'
        },
        data: {
          jsonapi: { version: '1.1' },
          data: [
            {
              id: '1',
              type: 'articles',
              attributes: {
                title: 'Test Article',
                body: 'Content here'
              }
            }
          ],
          meta: {
            totalResources: 1
          }
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.status).toBe('completed')
      expect(result.endpoint).toBe(config.apiUrl)
      expect(result.method).toBe(config.httpMethod)
      expect(result.summary).toBeDefined()
      expect(result.summary.total).toBeGreaterThan(0)
      expect(result.details).toBeInstanceOf(Array)
    })

    it('should handle network errors gracefully', async () => {
      // Mock a network error
      ApiClient.makeRequest.mockResolvedValue({
        success: false,
        error: 'Network connection failed'
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.status).toBe('error')
      expect(result.error).toContain('Network connection failed')
      expect(result.summary.failed).toBe(1)
    })

    it('should validate query parameters in URL', async () => {
      const mockResponse = {
        success: true,
        status: 200,
        headers: {
          'content-type': 'application/vnd.api+json'
        },
        data: {
          jsonapi: { version: '1.1' },
          data: {
            id: '1',
            type: 'articles',
            attributes: { title: 'Test' }
          }
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles?fields[articles]=title&sort=created',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.status).toBe('completed')
      // Should include query parameter validation results
      const queryTests = result.details.filter(detail => 
        detail.test && detail.test.toLowerCase().includes('query')
      )
      expect(queryTests.length).toBeGreaterThan(0)
    })

    it('should validate invalid JSON:API responses', async () => {
      // Mock an invalid JSON:API response
      const mockResponse = {
        success: true,
        status: 200,
        headers: {
          'content-type': 'application/json' // Wrong content-type
        },
        data: {
          // Missing jsonapi member
          data: [
            {
              id: '1',
              // Missing type member
              attributes: { title: 'Test' }
            }
          ]
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.status).toBe('completed')
      expect(result.summary.failed).toBeGreaterThan(0)
      
      // Should detect content-type issues
      const contentTypeErrors = result.details.filter(detail => 
        detail.status === 'failed' && 
        detail.message && 
        detail.message.toLowerCase().includes('content-type')
      )
      expect(contentTypeErrors.length).toBeGreaterThan(0)
    })

    it('should validate pagination when present', async () => {
      const mockResponse = {
        success: true,
        status: 200,
        headers: {
          'content-type': 'application/vnd.api+json'
        },
        data: {
          jsonapi: { version: '1.1' },
          data: [
            { id: '1', type: 'articles', attributes: { title: 'Article 1' } }
          ],
          links: {
            self: 'https://api.example.com/articles?page[number]=1',
            next: 'https://api.example.com/articles?page[number]=2',
            last: 'https://api.example.com/articles?page[number]=10'
          },
          meta: {
            page: {
              current: 1,
              total: 10
            }
          }
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles?page[number]=1',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.status).toBe('completed')
      
      // Should include pagination validation results
      const paginationTests = result.details.filter(detail => 
        detail.test && detail.test.toLowerCase().includes('pagination')
      )
      expect(paginationTests.length).toBeGreaterThan(0)
    })

    it('should handle different HTTP methods', async () => {
      const mockResponse = {
        success: true,
        status: 201, // Created
        headers: {
          'content-type': 'application/vnd.api+json'
        },
        data: {
          jsonapi: { version: '1.1' },
          data: {
            id: '123',
            type: 'articles',
            attributes: { title: 'New Article' }
          }
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'POST',
        authType: 'none',
        requestBody: JSON.stringify({
          data: {
            type: 'articles',
            attributes: { title: 'New Article' }
          }
        })
      }

      const result = await runValidation(config)

      expect(result.status).toBe('completed')
      expect(result.method).toBe('POST')
    })

    it('should handle malformed URLs gracefully', async () => {
      const config = {
        apiUrl: 'not-a-valid-url',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      // Should still attempt validation but may have URL structure errors
      expect(result.status).toBe('completed')
      expect(result.endpoint).toBe(config.apiUrl)
    })

    it('should include comprehensive summary statistics', async () => {
      const mockResponse = {
        success: true,
        status: 200,
        headers: {
          'content-type': 'application/vnd.api+json'
        },
        data: {
          jsonapi: { version: '1.1' },
          data: { id: '1', type: 'articles', attributes: { title: 'Test' } }
        }
      }

      ApiClient.makeRequest.mockResolvedValue(mockResponse)

      const config = {
        apiUrl: 'https://api.example.com/articles/1',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      expect(result.summary).toHaveProperty('total')
      expect(result.summary).toHaveProperty('passed')
      expect(result.summary).toHaveProperty('failed')
      expect(result.summary).toHaveProperty('warnings')
      expect(result.summary.total).toBe(
        result.summary.passed + result.summary.failed + result.summary.warnings
      )
    })
  })
})