/**
 * ValidationService.js
 * 
 * Service that coordinates API requests and validation
 */

import { makeRequest } from '../utils/ApiClient.js'
import { validateDocument } from '../validators/DocumentValidator.js'
import { validateSparseFieldsets, validateFieldsetSyntax } from '../validators/QueryValidator.js'

/**
 * Runs comprehensive JSON:API validation on an endpoint
 * @param {Object} config - Test configuration
 * @returns {Promise<Object>} Validation results
 */
export async function runValidation(config) {
  const startTime = Date.now()
  
  try {
    // Extract query parameters from URL for validation
    let queryParams = {}
    try {
      const url = new URL(config.apiUrl)
      queryParams = Object.fromEntries(url.searchParams.entries())
    } catch {
      // If URL parsing fails, we'll continue without query parameter validation
    }

    // Step 1: Validate query parameter syntax (before making request)
    const queryValidation = validateFieldsetSyntax(queryParams)
    
    // Step 2: Make the API request
    const response = await makeRequest(config)
    
    if (!response.success) {
      return {
        timestamp: new Date().toISOString(),
        endpoint: config.apiUrl,
        method: config.httpMethod,
        status: 'error',
        error: `Request failed: ${response.error}`,
        summary: {
          total: 0,
          passed: 0,
          failed: 1,
          warnings: 0
        },
        details: [{
          test: 'HTTP Request',
          status: 'failed',
          message: response.error
        }]
      }
    }

    // Step 3: Validate response structure
    const results = {
      timestamp: new Date().toISOString(),
      endpoint: config.apiUrl,
      method: config.httpMethod,
      status: 'completed',
      httpStatus: response.status,
      contentType: response.headers['content-type'] || 'unknown',
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        warnings: 0
      },
      details: []
    }

    // Add query parameter validation results
    results.details.push(...queryValidation.details)
    queryValidation.errors.forEach(error => {
      results.details.push({
        test: error.test,
        status: 'failed',
        message: error.message
      })
      results.summary.failed++
    })
    queryValidation.warnings.forEach(warning => {
      results.details.push({
        test: warning.test,
        status: 'warning',
        message: warning.message
      })
      results.summary.warnings++
    })
    queryValidation.details.forEach(detail => {
      if (detail.status === 'passed') {
        results.summary.passed++
      }
    })

    // Step 4: Check JSON parsing
    if (response.parseError) {
      results.details.push({
        test: 'JSON Parsing',
        status: 'failed',
        message: response.parseError
      })
      results.summary.failed++
    } else {
      results.details.push({
        test: 'JSON Parsing', 
        status: 'passed',
        message: 'Response is valid JSON'
      })
      results.summary.passed++
    }

    // Step 5: Check Content-Type header
    const contentType = response.headers['content-type'] || ''
    if (contentType.includes('application/vnd.api+json')) {
      results.details.push({
        test: 'Content-Type Header',
        status: 'passed',
        message: 'Content-Type is application/vnd.api+json'
      })
      results.summary.passed++
    } else {
      results.details.push({
        test: 'Content-Type Header',
        status: 'failed', 
        message: `Expected "application/vnd.api+json" but got "${contentType}"`
      })
      results.summary.failed++
    }

    // Step 6: Validate document structure (if JSON parsed successfully)
    if (!response.parseError && response.data !== null) {
      const documentValidation = validateDocument(response.data)
      
      // Add document validation results
      results.details.push(...documentValidation.details)
      
      // Add any errors
      documentValidation.errors.forEach(error => {
        results.details.push({
          test: error.test,
          status: 'failed',
          message: error.message
        })
        results.summary.failed++
      })

      // Add any warnings  
      documentValidation.warnings.forEach(warning => {
        results.details.push({
          test: warning.test,
          status: 'warning',
          message: warning.message
        })
        results.summary.warnings++
      })

      // Count passed tests from document validation
      documentValidation.details.forEach(detail => {
        if (detail.status === 'passed') {
          results.summary.passed++
        }
      })

      // Step 7: Validate sparse fieldsets (if response has data and query parameters exist)
      if (response.data && Object.keys(queryParams).length > 0) {
        const fieldsetValidation = validateSparseFieldsets(response.data, queryParams)
        
        // Add sparse fieldset validation results
        results.details.push(...fieldsetValidation.details)
        
        // Add any errors
        fieldsetValidation.errors.forEach(error => {
          results.details.push({
            test: error.test,
            status: 'failed',
            message: error.message,
            context: error.context
          })
          results.summary.failed++
        })

        // Add any warnings  
        fieldsetValidation.warnings.forEach(warning => {
          results.details.push({
            test: warning.test,
            status: 'warning',
            message: warning.message,
            context: warning.context
          })
          results.summary.warnings++
        })

        // Count passed tests from fieldset validation
        fieldsetValidation.details.forEach(detail => {
          if (detail.status === 'passed') {
            results.summary.passed++
          }
        })
      }
    }

    // Calculate totals
    results.summary.total = results.summary.passed + results.summary.failed + results.summary.warnings

    // Add execution time
    const duration = Date.now() - startTime
    results.duration = `${duration}ms`

    return results

  } catch (error) {
    return {
      timestamp: new Date().toISOString(),
      endpoint: config.apiUrl,
      method: config.httpMethod,
      status: 'error',
      error: `Validation failed: ${error.message}`,
      summary: {
        total: 1,
        passed: 0,
        failed: 1,
        warnings: 0
      },
      details: [{
        test: 'Validation Process',
        status: 'failed',
        message: error.message
      }]
    }
  }
}