/**
 * ContentNegotiationValidator.js
 * 
 * Validates JSON:API v1.1 content negotiation compliance including media type parameters.
 * Based on specification: https://jsonapi.org/format/1.1/#content-negotiation
 */

/**
 * Validates JSON:API content negotiation headers and media types
 * @param {Object} headers - Request or response headers
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with success/failure and details
 */
export function validateContentNegotiation(headers, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Validate Content-Type header
  if (options.validateContentType !== false) {
    const contentTypeValidation = validateContentTypeHeader(headers['content-type'] || '')
    mergeResults(results, contentTypeValidation)
  }

  // Validate Accept header
  if (options.validateAccept !== false) {
    const acceptValidation = validateAcceptHeader(headers['accept'] || '')
    mergeResults(results, acceptValidation)
  }

  return results
}

/**
 * Validates Content-Type header for JSON:API compliance
 * @param {string} contentType - Content-Type header value
 * @returns {Object} Validation result
 */
export function validateContentTypeHeader(contentType) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!contentType || typeof contentType !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'Content-Type Header Presence',
      message: 'Content-Type header is required'
    })
    return results
  }

  const parsed = parseMediaType(contentType)
  if (!parsed) {
    results.valid = false
    results.errors.push({
      test: 'Content-Type Header Format',
      message: 'Content-Type header has invalid format'
    })
    return results
  }

  // Validate base media type
  if (parsed.type !== 'application/vnd.api+json') {
    results.valid = false
    results.errors.push({
      test: 'Content-Type Media Type',
      message: `Content-Type must be "application/vnd.api+json", got "${parsed.type}"`
    })
    return results
  }

  results.details.push({
    test: 'Content-Type Media Type',
    status: 'passed',
    message: 'Content-Type is correct JSON:API media type'
  })

  // Validate parameters
  const parameterValidation = validateMediaTypeParameters(parsed.parameters, 'Content-Type')
  mergeResults(results, parameterValidation)

  return results
}

/**
 * Validates Accept header for JSON:API compliance
 * @param {string} accept - Accept header value
 * @returns {Object} Validation result
 */
export function validateAcceptHeader(accept) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!accept || typeof accept !== 'string') {
    results.details.push({
      test: 'Accept Header Presence',
      status: 'passed',
      message: 'Accept header not specified (optional)'
    })
    return results
  }

  // Parse Accept header (can contain multiple media types)
  const mediaTypes = parseAcceptHeader(accept)
  
  if (mediaTypes.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Accept Header Format',
      message: 'Accept header has invalid format'
    })
    return results
  }

  // Check if JSON:API media type is accepted
  const jsonApiTypes = mediaTypes.filter(mt => 
    mt.type === 'application/vnd.api+json' || 
    mt.type === 'application/*' || 
    mt.type === '*/*'
  )

  if (jsonApiTypes.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Accept Header Compatibility',
      message: 'Accept header does not include JSON:API media type (application/vnd.api+json)'
    })
    return results
  }

  results.details.push({
    test: 'Accept Header Compatibility',
    status: 'passed',
    message: 'Accept header includes JSON:API media type'
  })

  // Validate parameters for JSON:API specific media types
  jsonApiTypes.forEach((mediaType, index) => {
    if (mediaType.type === 'application/vnd.api+json') {
      const parameterValidation = validateMediaTypeParameters(mediaType.parameters, `Accept[${index}]`)
      mergeResults(results, parameterValidation)
    }
  })

  return results
}

/**
 * Validates media type parameters for JSON:API compliance
 * @param {Object} parameters - Parsed media type parameters
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateMediaTypeParameters(parameters, context) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!parameters || Object.keys(parameters).length === 0) {
    results.details.push({
      test: 'Media Type Parameters',
      status: 'passed',
      message: `${context} has no parameters (valid)`
    })
    return results
  }

  const knownParams = ['ext', 'profile']
  const paramKeys = Object.keys(parameters)
  const unknownParams = paramKeys.filter(key => !knownParams.includes(key))

  // Warn about unknown parameters
  if (unknownParams.length > 0) {
    results.warnings.push({
      test: 'Media Type Parameters',
      message: `${context} contains unknown parameters: ${unknownParams.join(', ')}. These may not be supported.`
    })
  }

  // Validate 'ext' parameter
  if (parameters.ext) {
    const extValidation = validateExtParameter(parameters.ext, context)
    mergeResults(results, extValidation)
  }

  // Validate 'profile' parameter
  if (parameters.profile) {
    const profileValidation = validateProfileParameter(parameters.profile, context)
    mergeResults(results, profileValidation)
  }

  if (paramKeys.length > 0) {
    results.details.push({
      test: 'Media Type Parameters',
      status: 'passed',
      message: `${context} contains ${paramKeys.length} parameter(s): ${paramKeys.join(', ')}`
    })
  }

  return results
}

/**
 * Validates 'ext' parameter in media type
 * @param {string} ext - Extension parameter value
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateExtParameter(ext, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof ext !== 'string' || ext.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Extension Parameter',
      message: `${context} ext parameter must be a non-empty string`
    })
    return results
  }

  // ext parameter should be a space-separated list of extension URLs
  const extensions = ext.split(/\s+/).filter(e => e.length > 0)
  
  if (extensions.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Extension Parameter',
      message: `${context} ext parameter cannot be empty after parsing`
    })
    return results
  }

  // Validate each extension
  const invalidExtensions = []
  extensions.forEach(extension => {
    if (!isValidExtensionUrl(extension)) {
      invalidExtensions.push(extension)
    }
  })

  if (invalidExtensions.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Extension Parameter',
      message: `${context} ext parameter contains invalid extension URLs: ${invalidExtensions.join(', ')}`
    })
  } else {
    results.details.push({
      test: 'Extension Parameter',
      status: 'passed',
      message: `${context} ext parameter contains ${extensions.length} valid extension(s)`
    })
  }

  return results
}

/**
 * Validates 'profile' parameter in media type
 * @param {string} profile - Profile parameter value
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateProfileParameter(profile, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof profile !== 'string' || profile.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Profile Parameter',
      message: `${context} profile parameter must be a non-empty string`
    })
    return results
  }

  // profile parameter should be a space-separated list of profile URLs
  const profiles = profile.split(/\s+/).filter(p => p.length > 0)
  
  if (profiles.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Profile Parameter',
      message: `${context} profile parameter cannot be empty after parsing`
    })
    return results
  }

  // Validate each profile URL
  const invalidProfiles = []
  profiles.forEach(profileUrl => {
    if (!isValidUrl(profileUrl)) {
      invalidProfiles.push(profileUrl)
    }
  })

  if (invalidProfiles.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Profile Parameter',
      message: `${context} profile parameter contains invalid URLs: ${invalidProfiles.join(', ')}`
    })
  } else {
    results.details.push({
      test: 'Profile Parameter',
      status: 'passed',
      message: `${context} profile parameter contains ${profiles.length} valid profile(s)`
    })
  }

  return results
}

/**
 * Parses a media type string into type and parameters
 * @param {string} mediaType - Media type string to parse
 * @returns {Object|null} Parsed media type or null if invalid
 */
function parseMediaType(mediaType) {
  if (!mediaType || typeof mediaType !== 'string') {
    return null
  }

  const parts = mediaType.trim().split(';')
  const type = parts[0].trim()
  
  if (!type) {
    return null
  }

  const parameters = {}
  
  for (let i = 1; i < parts.length; i++) {
    const param = parts[i].trim()
    const equalIndex = param.indexOf('=')
    
    if (equalIndex === -1) {
      continue // Invalid parameter format, skip
    }
    
    const key = param.substring(0, equalIndex).trim()
    const value = param.substring(equalIndex + 1).trim()
    
    if (key && value) {
      // Remove quotes if present
      parameters[key] = value.replace(/^"(.*)"$/, '$1')
    }
  }

  return { type, parameters }
}

/**
 * Parses Accept header into array of media types
 * @param {string} accept - Accept header value
 * @returns {Array} Array of parsed media types
 */
function parseAcceptHeader(accept) {
  if (!accept || typeof accept !== 'string') {
    return []
  }

  return accept.split(',').map(mediaType => {
    const parsed = parseMediaType(mediaType.trim())
    return parsed
  }).filter(Boolean)
}

/**
 * Validates if a string is a valid extension URL
 * @param {string} url - URL to validate
 * @returns {boolean} True if valid extension URL
 */
function isValidExtensionUrl(url) {
  // Extension URLs should be valid URLs
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Validates if a string is a valid URL (from utils)
 * @param {string} url - URL to validate  
 * @returns {boolean} True if valid URL
 */
function isValidUrl(url) {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

/**
 * Merges validation results
 * @param {Object} target - Target results object
 * @param {Object} source - Source results object
 */
function mergeResults(target, source) {
  if (!source.valid) {
    target.valid = false
  }
  
  target.errors.push(...source.errors)
  target.warnings.push(...source.warnings)
  target.details.push(...source.details)
}