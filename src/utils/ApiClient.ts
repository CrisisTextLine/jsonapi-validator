/**
 * ApiClient.ts
 *
 * HTTP client for making requests to JSON:API endpoints
 */

import type { TestConfig, ApiResponse } from '../types/validation'

/**
 * Makes an HTTP request and returns parsed response with metadata
 * @param config - Request configuration
 * @returns Response object with data and metadata
 */
export async function makeRequest(config: TestConfig): Promise<ApiResponse & { success: boolean; rawResponse: string }> {
  const { apiUrl, httpMethod, authType, authCredentials, customHeaders, requestBody } = config

  try {
    // Build headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    }

    // Add authentication headers
    if (authType === 'bearer' && authCredentials.token) {
      headers['Authorization'] = `Bearer ${authCredentials.token}`
    } else if (authType === 'apiKey' && authCredentials.key) {
      const headerName = (authCredentials as { headerName?: string }).headerName || 'X-API-Key'
      headers[headerName] = authCredentials.key
    } else if (authType === 'basic' && authCredentials.username && authCredentials.password) {
      const encoded = btoa(`${authCredentials.username}:${authCredentials.password}`)
      headers['Authorization'] = `Basic ${encoded}`
    }

    // Add custom headers
    if (customHeaders) {
      if (Array.isArray(customHeaders)) {
        // Handle array format: [{ key: 'name', value: 'value' }]
        customHeaders.forEach((header) => {
          if (header && typeof header === 'object' && 'key' in header && 'value' in header) {
            const key = header.key
            const value = header.value
            if (key && value) {
              headers[key] = value
            }
          }
        })
      } else if (typeof customHeaders === 'object') {
        // Handle object format: { 'name': 'value' }
        Object.entries(customHeaders).forEach(([key, value]) => {
          if (key && value) {
            headers[key] = value
          }
        })
      }
    }

    // Build request options
    const requestOptions: RequestInit = {
      method: httpMethod,
      headers,
      mode: 'cors'
    }

    // Add request body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(httpMethod) && requestBody) {
      requestOptions.body = typeof requestBody === 'string' ? requestBody : JSON.stringify(requestBody)
    }

    // Make the request
    const response = await fetch(apiUrl, requestOptions)

    // Get response data
    const responseText = await response.text()

    // Parse JSON if possible
    let responseData: unknown = null
    let parseError: string | undefined = undefined

    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (error) {
      parseError = `Invalid JSON response: ${error instanceof Error ? error.message : String(error)}`
    }

    // Return response metadata
    return {
      success: true,
      data: responseData,
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      parseError,
      rawResponse: responseText
    }

  } catch (error) {
    // Handle network errors or other failures
    return {
      success: false,
      status: 0,
      statusText: 'Network Error',
      headers: {},
      error: error instanceof Error ? error.message : String(error),
      rawResponse: ''
    }
  }
}
