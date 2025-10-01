/**
 * HttpStatusValidator.ts
 *
 * Validates HTTP status codes for JSON:API compliance.
 * Based on specification: https://jsonapi.org/format/1.1/
 */

import type { JsonApiDocument } from '../types/validation'

interface ValidationError {
  test: string
  message: string
}

interface ValidationWarning {
  test: string
  message: string
}

interface ValidationDetail {
  test: string
  status: 'passed' | 'failed' | 'warning'
  message: string
}

interface HttpStatusValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  details: ValidationDetail[]
}

/**
 * Validates HTTP status codes for JSON:API compliance
 * @param statusCode - The HTTP status code to validate
 * @param method - The HTTP method used
 * @param response - The response body (optional)
 * @returns Validation result with success/failure and details
 */
export function validateHttpStatus(
  statusCode: number,
  method: string,
  response: JsonApiDocument | null = null
): HttpStatusValidationResult {
  const results: HttpStatusValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (typeof statusCode !== 'number' || statusCode < 100 || statusCode > 599) {
    results.valid = false
    results.errors.push({
      test: 'HTTP Status Code Format',
      message: `Invalid HTTP status code: ${statusCode}. Must be a number between 100-599`
    })
    return results
  }

  // Validate status code appropriateness based on method and response content
  const statusCategory = Math.floor(statusCode / 100)

  switch (statusCategory) {
    case 2: // Success codes
      validateSuccessStatus(statusCode, method, response, results)
      break
    case 4: // Client error codes
      validateClientErrorStatus(statusCode, method, response, results)
      break
    case 5: // Server error codes
      validateServerErrorStatus(statusCode, method, response, results)
      break
    default:
      results.warnings.push({
        test: 'HTTP Status Code Category',
        message: `Unusual status code category ${statusCategory}xx for JSON:API response`
      })
  }

  return results
}

/**
 * Validates 2xx success status codes
 * @param statusCode - The status code
 * @param method - The HTTP method
 * @param response - The response body
 * @param results - Results object to update
 */
function validateSuccessStatus(
  statusCode: number,
  method: string,
  response: JsonApiDocument | null,
  results: HttpStatusValidationResult
): void {
  const hasData = response && Object.prototype.hasOwnProperty.call(response, 'data')
  const hasErrors = response && Object.prototype.hasOwnProperty.call(response, 'errors')

  switch (statusCode) {
    case 200: // OK
      if (method === 'GET' || method === 'PATCH') {
        results.details.push({
          test: 'HTTP Status Code Appropriateness',
          status: 'passed',
          message: `200 OK is appropriate for ${method} requests`
        })

        if (hasErrors) {
          results.warnings.push({
            test: 'HTTP Status Code Consistency',
            message: '200 OK status with errors array may be confusing. Consider using 4xx status for client errors.'
          })
        }
      } else {
        results.warnings.push({
          test: 'HTTP Status Code Appropriateness',
          message: `200 OK is unusual for ${method} requests. Consider 201 for POST or 204 for DELETE/PUT.`
        })
      }
      break

    case 201: // Created
      if (method === 'POST') {
        results.details.push({
          test: 'HTTP Status Code Appropriateness',
          status: 'passed',
          message: '201 Created is appropriate for POST requests'
        })

        if (!hasData) {
          results.warnings.push({
            test: 'HTTP Status Code Consistency',
            message: '201 Created typically includes the created resource in the data member'
          })
        }
      } else {
        results.warnings.push({
          test: 'HTTP Status Code Appropriateness',
          message: `201 Created is typically used for POST requests, not ${method}`
        })
      }
      break

    case 202: // Accepted
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '202 Accepted is valid for asynchronous processing'
      })
      break

    case 204: // No Content
      if (method === 'DELETE' || method === 'PUT' || method === 'PATCH') {
        results.details.push({
          test: 'HTTP Status Code Appropriateness',
          status: 'passed',
          message: `204 No Content is appropriate for ${method} requests`
        })

        if (hasData || hasErrors) {
          results.valid = false
          results.errors.push({
            test: 'HTTP Status Code Consistency',
            message: '204 No Content must not include response body with data or errors'
          })
        }
      } else {
        results.warnings.push({
          test: 'HTTP Status Code Appropriateness',
          message: `204 No Content is unusual for ${method} requests`
        })
      }
      break

    default:
      results.warnings.push({
        test: 'HTTP Status Code Appropriateness',
        message: `${statusCode} is an unusual success status for JSON:API. Common codes are 200, 201, 202, 204.`
      })
  }
}

/**
 * Validates 4xx client error status codes
 * @param statusCode - The status code
 * @param method - The HTTP method
 * @param response - The response body
 * @param results - Results object to update
 */
function validateClientErrorStatus(
  statusCode: number,
  method: string,
  response: JsonApiDocument | null,
  results: HttpStatusValidationResult
): void {
  const hasErrors = response && Object.prototype.hasOwnProperty.call(response, 'errors')
  const hasData = response && Object.prototype.hasOwnProperty.call(response, 'data')

  // For client errors, response should have errors array, not data
  if (hasData && !hasErrors) {
    results.warnings.push({
      test: 'HTTP Status Code Consistency',
      message: `${statusCode} client error status typically includes errors array instead of data`
    })
  }

  switch (statusCode) {
    case 400: // Bad Request
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '400 Bad Request is appropriate for malformed requests'
      })
      break

    case 401: // Unauthorized
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '401 Unauthorized is appropriate for authentication failures'
      })
      break

    case 403: // Forbidden
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '403 Forbidden is appropriate for authorization failures'
      })
      break

    case 404: // Not Found
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '404 Not Found is appropriate for missing resources'
      })
      break

    case 405: // Method Not Allowed
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '405 Method Not Allowed is appropriate for unsupported HTTP methods'
      })
      break

    case 406: // Not Acceptable
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '406 Not Acceptable is appropriate for JSON:API Accept header issues'
      })
      break

    case 409: // Conflict
      if (method === 'POST') {
        results.details.push({
          test: 'HTTP Status Code Appropriateness',
          status: 'passed',
          message: '409 Conflict is appropriate for client-generated ID conflicts'
        })
      } else {
        results.details.push({
          test: 'HTTP Status Code Appropriateness',
          status: 'passed',
          message: '409 Conflict is appropriate for resource conflicts'
        })
      }
      break

    case 415: // Unsupported Media Type
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '415 Unsupported Media Type is appropriate for JSON:API Content-Type issues'
      })
      break

    case 422: // Unprocessable Entity
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '422 Unprocessable Entity is appropriate for validation errors'
      })
      break

    default:
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: `${statusCode} client error status is acceptable`
      })
  }
}

/**
 * Validates 5xx server error status codes
 * @param statusCode - The status code
 * @param method - The HTTP method
 * @param response - The response body
 * @param results - Results object to update
 */
function validateServerErrorStatus(
  statusCode: number,
  method: string,
  response: JsonApiDocument | null,
  results: HttpStatusValidationResult
): void {
  const hasErrors = response && Object.prototype.hasOwnProperty.call(response, 'errors')

  if (!hasErrors && response !== null) {
    results.warnings.push({
      test: 'HTTP Status Code Consistency',
      message: `${statusCode} server error status should typically include errors array`
    })
  }

  switch (statusCode) {
    case 500: // Internal Server Error
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: '500 Internal Server Error is appropriate for server failures'
      })
      break

    case 502: // Bad Gateway
    case 503: // Service Unavailable
    case 504: // Gateway Timeout
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: `${statusCode} is appropriate for server infrastructure issues`
      })
      break

    default:
      results.details.push({
        test: 'HTTP Status Code Appropriateness',
        status: 'passed',
        message: `${statusCode} server error status is acceptable`
      })
  }
}
