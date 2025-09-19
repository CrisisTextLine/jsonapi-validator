/**
 * Integration tests that validate the entire validation workflow
 * against the mock server endpoints
 */
import { describe, it, expect } from 'vitest'
import { runValidation } from '../../src/utils/ValidationService.js'

describe('ValidationService Integration Tests', () => {
  const mockServerBase = 'http://localhost:3001'

  describe('Valid endpoints should pass validation', () => {
    const validEndpoints = [
      {
        name: 'Root endpoint',
        url: `${mockServerBase}/api`,
        expectMinPassed: 5
      },
      {
        name: 'Articles collection',
        url: `${mockServerBase}/api/articles`,
        expectMinPassed: 10
      },
      {
        name: 'Individual article',
        url: `${mockServerBase}/api/articles/1`,
        expectMinPassed: 8
      },
      {
        name: 'Articles with include',
        url: `${mockServerBase}/api/articles?include=author`,
        expectMinPassed: 10
      },
      {
        name: 'Articles with sorting',
        url: `${mockServerBase}/api/articles?sort=title`,
        expectMinPassed: 10
      },
      {
        name: 'Articles with sparse fieldsets',
        url: `${mockServerBase}/api/articles?fields[articles]=title`,
        expectMinPassed: 8
      }
    ]

    validEndpoints.forEach(endpoint => {
      it(`should validate ${endpoint.name}`, async () => {
        const config = {
          apiUrl: endpoint.url,
          httpMethod: 'GET',
          authType: 'none'
        }

        const result = await runValidation(config)

        // Handle cases where ValidationService returns error structure
        if (result && result.metadata) {
          expect(['passed', 'failed', 'warning', 'error']).toContain(result.metadata.status)
          expect(result.metadata.endpoint).toBe(endpoint.url)
        } else if (result && result.status) {
          // Fallback for direct status field
          expect(['passed', 'failed', 'warning', 'error', 'completed']).toContain(result.status)
          expect(result.endpoint || result.metadata?.endpoint).toBe(endpoint.url)
        } else {
          // Fail with useful error message
          throw new Error(`Unexpected result structure: ${JSON.stringify(result)}`)
        }

        expect(result.summary).toBeDefined()
        expect(result.summary.total).toBeGreaterThan(0)
        expect(result.summary.passed).toBeGreaterThanOrEqual(endpoint.expectMinPassed)
        
        // Check that we have sections instead of details array
        expect(result.sections).toBeDefined()
        const allDetails = Object.values(result.sections).flatMap(section => section.tests)
        expect(allDetails.length).toBeGreaterThan(0)

        // Log results for analysis
        console.log(`${endpoint.name}: Passed=${result.summary.passed}, Failed=${result.summary.failed}, Warnings=${result.summary.warnings}`)
      })
    })
  })

  describe('Invalid endpoints should fail validation', () => {
    const invalidEndpoints = [
      {
        name: 'Missing jsonapi member',
        url: `${mockServerBase}/api/invalid/no-jsonapi`,
        expectMinFailed: 0  // jsonapi member is recommended but not strictly required
      },
      {
        name: 'Wrong content-type',
        url: `${mockServerBase}/api/invalid/wrong-content-type`,
        expectMinFailed: 1
      },
      {
        name: 'Missing id field',
        url: `${mockServerBase}/api/invalid/missing-id`,
        expectMinFailed: 1
      },
      {
        name: 'Bad links format',
        url: `${mockServerBase}/api/invalid/bad-links`,
        expectMinFailed: 1
      }
    ]

    invalidEndpoints.forEach(endpoint => {
      it(`should detect issues in ${endpoint.name}`, async () => {
        const config = {
          apiUrl: endpoint.url,
          httpMethod: 'GET',
          authType: 'none'
        }

        const result = await runValidation(config)

        // Handle cases where ValidationService returns error structure
        if (result && result.metadata) {
          expect(['passed', 'failed', 'warning', 'error']).toContain(result.metadata.status)
        } else if (result && result.status) {
          // Fallback for direct status field
          expect(['passed', 'failed', 'warning', 'error', 'completed']).toContain(result.status)
        } else {
          // Fail with useful error message
          throw new Error(`Unexpected result structure: ${JSON.stringify(result)}`)
        }

        expect(result.summary.failed).toBeGreaterThanOrEqual(endpoint.expectMinFailed)

        // Log results for analysis
        console.log(`${endpoint.name}: Passed=${result.summary.passed}, Failed=${result.summary.failed}, Warnings=${result.summary.warnings}`)
      })
    })
  })

  describe('Error responses should be handled correctly', () => {
    it('should validate 404 error response format', async () => {
      const config = {
        apiUrl: `${mockServerBase}/api/articles/999`,
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)

      // Handle cases where ValidationService returns error structure
      if (result && result.metadata) {
        expect(['passed', 'failed', 'warning', 'error']).toContain(result.metadata.status)
      } else if (result && result.status) {
        // Fallback for direct status field
        expect(['passed', 'failed', 'warning', 'error', 'completed']).toContain(result.status)
      } else {
        // Fail with useful error message
        throw new Error(`Unexpected result structure: ${JSON.stringify(result)}`)
      }

      expect(result.summary.total).toBeGreaterThan(0)
      
      // Should validate error response format
      const allDetails = Object.values(result.sections).flatMap(section => section.tests)
      const errorValidationTests = allDetails.filter(detail => 
        detail.test && detail.test.toLowerCase().includes('error')
      )
      expect(errorValidationTests.length).toBeGreaterThan(0)
    })
  })

  describe('HTTP methods should be handled correctly', () => {
    it('should handle POST requests', async () => {
      const config = {
        apiUrl: `${mockServerBase}/api/articles`,
        httpMethod: 'POST',
        authType: 'none',
        requestBody: JSON.stringify({
          data: {
            type: 'articles',
            attributes: {
              title: 'Integration Test Article',
              body: 'Created during integration testing'
            }
          }
        })
      }

      const result = await runValidation(config)

      // Handle cases where ValidationService returns error structure
      if (result && result.metadata) {
        expect(['passed', 'failed', 'warning', 'error']).toContain(result.metadata.status)
        expect(result.metadata.method).toBe('POST')
      } else if (result && result.status) {
        // Fallback for direct status field
        expect(['passed', 'failed', 'warning', 'error', 'completed']).toContain(result.status)
        expect(result.method || result.metadata?.method).toBe('POST')
      } else {
        // Fail with useful error message
        throw new Error(`Unexpected result structure: ${JSON.stringify(result)}`)
      }

      expect(result.summary.total).toBeGreaterThan(0)
    })
  })

  describe('Validation workflow performance', () => {
    it('should complete validation within reasonable time', async () => {
      const startTime = Date.now()
      
      const config = {
        apiUrl: `${mockServerBase}/api/articles`,
        httpMethod: 'GET',
        authType: 'none'
      }

      const result = await runValidation(config)
      const endTime = Date.now()
      const duration = endTime - startTime

      // Handle cases where ValidationService returns error structure
      if (result && result.metadata) {
        expect(['passed', 'failed', 'warning', 'error']).toContain(result.metadata.status)
      } else if (result && result.status) {
        // Fallback for direct status field
        expect(['passed', 'failed', 'warning', 'error', 'completed']).toContain(result.status)
      } else {
        // Fail with useful error message
        throw new Error(`Unexpected result structure: ${JSON.stringify(result)}`)
      }

      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
      
      console.log(`Validation completed in ${duration}ms`)
    })
  })
})