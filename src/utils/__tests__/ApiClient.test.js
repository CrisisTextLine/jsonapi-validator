/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { makeRequest } from '../ApiClient.js'

// Mock fetch globally
global.fetch = vi.fn()

describe('ApiClient', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('makeRequest', () => {
    it('should make a basic GET request', async () => {
      const mockResponseData = {
        jsonapi: { version: '1.1' },
        data: { id: '1', type: 'articles', attributes: { title: 'Test' } }
      }

      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue(mockResponseData)
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await makeRequest(config)

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/articles',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            'Content-Type': 'application/vnd.api+json',
            'Accept': 'application/vnd.api+json'
          }),
          mode: 'cors'
        })
      )

      expect(result.success).toBe(true)
      expect(result.status).toBe(200)
      expect(result.data).toEqual(mockResponseData)
    })

    it('should handle POST requests with body', async () => {
      const mockResponseData = {
        jsonapi: { version: '1.1' },
        data: { id: '2', type: 'articles', attributes: { title: 'Created Article' } }
      }

      fetch.mockResolvedValue({
        ok: true,
        status: 201,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue(mockResponseData)
      })

      const requestBody = JSON.stringify({
        data: {
          type: 'articles',
          attributes: { title: 'New Article' }
        }
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'POST',
        authType: 'none',
        requestBody
      }

      const result = await makeRequest(config)

      expect(fetch).toHaveBeenCalledWith(
        'https://api.example.com/articles',
        expect.objectContaining({
          method: 'POST',
          body: requestBody
        })
      )

      expect(result.success).toBe(true)
      expect(result.status).toBe(201)
    })

    it('should handle Bearer token authentication', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue({})
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'bearer',
        authCredentials: { token: 'test-token' }
      }

      await makeRequest(config)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-token'
          })
        })
      )
    })

    it('should handle API key authentication', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue({})
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'apiKey',
        authCredentials: { 
          key: 'test-api-key',
          headerName: 'X-Custom-API-Key'
        }
      }

      await makeRequest(config)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-API-Key': 'test-api-key'
          })
        })
      )
    })

    it('should handle Basic authentication', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue({})
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'basic',
        authCredentials: { 
          username: 'testuser',
          password: 'testpass'
        }
      }

      await makeRequest(config)

      const expectedAuth = btoa('testuser:testpass')
      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Authorization': `Basic ${expectedAuth}`
          })
        })
      )
    })

    it('should handle custom headers', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue({})
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none',
        customHeaders: [
          { key: 'X-Custom-Header', value: 'custom-value' },
          { key: 'X-Another-Header', value: 'another-value' }
        ]
      }

      await makeRequest(config)

      expect(fetch).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          headers: expect.objectContaining({
            'X-Custom-Header': 'custom-value',
            'X-Another-Header': 'another-value'
          })
        })
      )
    })

    it('should handle HTTP errors gracefully', async () => {
      const errorResponseData = {
        errors: [{
          status: '404',
          title: 'Not Found',
          detail: 'Article not found'
        }]
      }

      fetch.mockResolvedValue({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockResolvedValue(errorResponseData)
      })

      const config = {
        apiUrl: 'https://api.example.com/articles/999',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await makeRequest(config)

      expect(result.success).toBe(true) // Still successful from request perspective
      expect(result.status).toBe(404)
      expect(result.data).toEqual(errorResponseData)
    })

    it('should handle network errors', async () => {
      fetch.mockRejectedValue(new Error('Network error'))

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await makeRequest(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Network error')
    })

    it('should handle JSON parsing errors', async () => {
      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn(() => 'application/vnd.api+json')
        },
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON'))
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await makeRequest(config)

      expect(result.success).toBe(false)
      expect(result.error).toContain('parsing JSON')
    })

    it('should capture response headers', async () => {
      const mockHeaders = new Map([
        ['content-type', 'application/vnd.api+json'],
        ['x-ratelimit-limit', '1000'],
        ['x-ratelimit-remaining', '999']
      ])

      fetch.mockResolvedValue({
        ok: true,
        status: 200,
        headers: {
          get: vi.fn((key) => mockHeaders.get(key.toLowerCase())),
          entries: vi.fn(() => mockHeaders.entries())
        },
        json: vi.fn().mockResolvedValue({})
      })

      const config = {
        apiUrl: 'https://api.example.com/articles',
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await makeRequest(config)

      expect(result.success).toBe(true)
      expect(result.headers).toBeDefined()
      expect(result.headers['content-type']).toBe('application/vnd.api+json')
    })
  })
})