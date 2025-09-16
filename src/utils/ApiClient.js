/**
 * ApiClient.js
 * 
 * HTTP client for making requests to JSON:API endpoints
 */

/**
 * Makes an HTTP request and returns parsed response with metadata
 * @param {Object} config - Request configuration
 * @returns {Promise<Object>} Response object with data and metadata
 */
export async function makeRequest(config) {
  const { apiUrl, httpMethod, authType, authCredentials, customHeaders, requestBody } = config

  try {
    // Build headers
    const headers = {
      'Content-Type': 'application/vnd.api+json',
      'Accept': 'application/vnd.api+json'
    }

    // Add authentication headers
    if (authType === 'bearer' && authCredentials.token) {
      headers['Authorization'] = `Bearer ${authCredentials.token}`
    } else if (authType === 'apiKey' && authCredentials.key) {
      const headerName = authCredentials.headerName || 'X-API-Key'
      headers[headerName] = authCredentials.key
    } else if (authType === 'basic' && authCredentials.username && authCredentials.password) {
      const encoded = btoa(`${authCredentials.username}:${authCredentials.password}`)
      headers['Authorization'] = `Basic ${encoded}`
    }

    // Add custom headers
    if (customHeaders && Array.isArray(customHeaders)) {
      customHeaders.forEach(header => {
        if (header.key && header.value) {
          headers[header.key] = header.value
        }
      })
    }

    // Build request options
    const requestOptions = {
      method: httpMethod,
      headers,
      mode: 'cors'
    }

    // Add request body for methods that support it
    if (['POST', 'PUT', 'PATCH'].includes(httpMethod) && requestBody) {
      requestOptions.body = requestBody
    }

    // Make the request
    const response = await fetch(apiUrl, requestOptions)

    // Get response data
    const responseText = await response.text()
    
    // Parse JSON if possible
    let responseData = null
    let parseError = null
    
    try {
      responseData = responseText ? JSON.parse(responseText) : null
    } catch (error) {
      parseError = `Invalid JSON response: ${error.message}`
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
    return {
      success: false,
      error: error.message,
      data: null,
      status: null,
      statusText: null,
      headers: {},
      parseError: null,
      rawResponse: null
    }
  }
}