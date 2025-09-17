/**
 * UrlStructureValidator.js
 * 
 * Validates JSON:API URL structure patterns and conventions.
 * Based on specification: https://jsonapi.org/format/1.1/#url-based-json-api
 */

/**
 * Validates JSON:API URL structure and patterns
 * @param {string} url - The URL to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with success/failure and details
 */
export function validateUrlStructure(url, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!url || typeof url !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'URL Structure',
      message: 'URL must be a non-empty string'
    })
    return results
  }

  let parsedUrl
  try {
    parsedUrl = new URL(url)
  } catch {
    results.valid = false
    results.errors.push({
      test: 'URL Structure',
      message: `Invalid URL format: ${url}`
    })
    return results
  }

  results.details.push({
    test: 'URL Structure',
    status: 'passed',
    message: 'URL format is valid'
  })

  // Validate URL path structure
  const pathValidation = validateUrlPath(parsedUrl.pathname, options)
  mergeResults(results, pathValidation)

  // Validate query parameters
  const queryValidation = validateUrlQuery(parsedUrl.searchParams, options)
  mergeResults(results, queryValidation)

  // Validate fragment (should not be present)
  if (parsedUrl.hash) {
    results.warnings.push({
      test: 'URL Structure',
      message: 'URL contains fragment identifier (#), which is unusual for JSON:API endpoints'
    })
  }

  return results
}

/**
 * Validates JSON:API URL path structure
 * @param {string} pathname - URL pathname to validate
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateUrlPath(pathname, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!pathname || pathname === '/') {
    results.warnings.push({
      test: 'URL Path Structure',
      message: 'URL path is root (/) - typically JSON:API endpoints have resource paths'
    })
    return results
  }

  // Remove leading/trailing slashes and split path
  const pathSegments = pathname.replace(/^\/+|\/+$/g, '').split('/').filter(segment => segment.length > 0)
  
  if (pathSegments.length === 0) {
    results.warnings.push({
      test: 'URL Path Structure',
      message: 'URL path contains no segments'
    })
    return results
  }

  // Analyze path structure
  const pathAnalysis = analyzePathStructure(pathSegments)
  
  // Validate resource collection patterns
  if (pathAnalysis.isResourceCollection) {
    const collectionValidation = validateResourceCollectionUrl(pathSegments)
    mergeResults(results, collectionValidation)
  }

  // Validate individual resource patterns
  if (pathAnalysis.isIndividualResource) {
    const resourceValidation = validateIndividualResourceUrl(pathSegments)
    mergeResults(results, resourceValidation)
  }

  // Validate relationship patterns
  if (pathAnalysis.isRelationshipUrl) {
    const relationshipValidation = validateRelationshipUrl(pathSegments)
    mergeResults(results, relationshipValidation)
  }

  // General path validation
  const generalValidation = validateGeneralPathStructure(pathSegments, options)
  mergeResults(results, generalValidation)

  return results
}

/**
 * Analyzes URL path structure to determine endpoint type
 * @param {Array} pathSegments - Array of path segments
 * @returns {Object} Analysis result
 */
function analyzePathStructure(pathSegments) {
  const analysis = {
    isResourceCollection: false,
    isIndividualResource: false,
    isRelationshipUrl: false,
    resourceType: null,
    resourceId: null,
    relationshipName: null
  }

  if (pathSegments.length >= 1) {
    analysis.resourceType = pathSegments[0]
    
    if (pathSegments.length === 1) {
      // /resources - resource collection
      analysis.isResourceCollection = true
    } else if (pathSegments.length === 2) {
      // /resources/123 - individual resource
      analysis.isIndividualResource = true
      analysis.resourceId = pathSegments[1]
    } else if (pathSegments.length >= 3) {
      // /resources/123/relationships/author - relationship URL
      // /resources/123/author - related resource URL
      analysis.resourceId = pathSegments[1]
      
      if (pathSegments[2] === 'relationships' && pathSegments.length >= 4) {
        analysis.isRelationshipUrl = true
        analysis.relationshipName = pathSegments[3]
      } else {
        // Could be related resource URL
        analysis.relationshipName = pathSegments[2]
      }
    }
  }

  return analysis
}

/**
 * Validates resource collection URL structure
 * @param {Array} pathSegments - Array of path segments
 * @returns {Object} Validation result
 */
function validateResourceCollectionUrl(pathSegments) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const resourceType = pathSegments[0]
  
  // Validate resource type naming
  if (!isValidResourceType(resourceType)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Collection URL',
      message: `Resource type "${resourceType}" should follow JSON:API naming conventions (lowercase, plural, hyphen-separated)`
    })
  } else {
    results.details.push({
      test: 'Resource Collection URL',
      status: 'passed',
      message: `Resource collection URL for type "${resourceType}" is valid`
    })
  }

  // Check if resource type appears plural
  if (!resourceType.endsWith('s') && !isKnownPluralForm(resourceType)) {
    results.warnings.push({
      test: 'Resource Collection URL',
      message: `Resource type "${resourceType}" may not be plural. JSON:API recommends plural resource types for collections.`
    })
  }

  return results
}

/**
 * Validates individual resource URL structure
 * @param {Array} pathSegments - Array of path segments
 * @returns {Object} Validation result
 */
function validateIndividualResourceUrl(pathSegments) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const resourceType = pathSegments[0]
  const resourceId = pathSegments[1]
  
  // Validate resource type
  if (!isValidResourceType(resourceType)) {
    results.valid = false
    results.errors.push({
      test: 'Individual Resource URL',
      message: `Resource type "${resourceType}" should follow JSON:API naming conventions`
    })
  }

  // Validate resource ID
  if (!isValidResourceId(resourceId)) {
    results.valid = false
    results.errors.push({
      test: 'Individual Resource URL',
      message: `Resource ID "${resourceId}" contains invalid characters`
    })
  } else {
    results.details.push({
      test: 'Individual Resource URL',
      status: 'passed',
      message: `Individual resource URL for "${resourceType}/${resourceId}" is valid`
    })
  }

  return results
}

/**
 * Validates relationship URL structure
 * @param {Array} pathSegments - Array of path segments
 * @returns {Object} Validation result
 */
function validateRelationshipUrl(pathSegments) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const resourceType = pathSegments[0]
  const resourceId = pathSegments[1]
  const relationshipKeyword = pathSegments[2]
  const relationshipName = pathSegments[3]

  // Validate resource type and ID
  if (!isValidResourceType(resourceType)) {
    results.valid = false
    results.errors.push({
      test: 'Relationship URL',
      message: `Resource type "${resourceType}" should follow JSON:API naming conventions`
    })
  }

  if (!isValidResourceId(resourceId)) {
    results.valid = false
    results.errors.push({
      test: 'Relationship URL',
      message: `Resource ID "${resourceId}" contains invalid characters`
    })
  }

  // Validate relationship keyword
  if (relationshipKeyword === 'relationships') {
    // This is a relationship endpoint: /resources/123/relationships/author
    if (!relationshipName) {
      results.valid = false
      results.errors.push({
        test: 'Relationship URL',
        message: 'Relationship URL must specify relationship name after "relationships"'
      })
    } else if (!isValidRelationshipName(relationshipName)) {
      results.valid = false
      results.errors.push({
        test: 'Relationship URL',
        message: `Relationship name "${relationshipName}" should follow JSON:API naming conventions`
      })
    } else {
      results.details.push({
        test: 'Relationship URL',
        status: 'passed',
        message: `Relationship URL for "${resourceType}/${resourceId}/relationships/${relationshipName}" is valid`
      })
    }
  } else {
    // This is a related resource endpoint: /resources/123/author
    if (!isValidRelationshipName(relationshipKeyword)) {
      results.valid = false
      results.errors.push({
        test: 'Related Resource URL',
        message: `Related resource name "${relationshipKeyword}" should follow JSON:API naming conventions`
      })
    } else {
      results.details.push({
        test: 'Related Resource URL',
        status: 'passed',
        message: `Related resource URL for "${resourceType}/${resourceId}/${relationshipKeyword}" is valid`
      })
    }
  }

  return results
}

/**
 * Validates general path structure requirements
 * @param {Array} pathSegments - Array of path segments
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateGeneralPathStructure(pathSegments, options = {}) {  // eslint-disable-line no-unused-vars
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Check for empty segments (double slashes)
  if (pathSegments.some(segment => segment.length === 0)) {
    results.valid = false
    results.errors.push({
      test: 'URL Path Structure',
      message: 'URL path contains empty segments (double slashes)'
    })
  }

  // Check for URL encoding issues
  pathSegments.forEach((segment, index) => {
    if (segment !== decodeURIComponent(segment)) {
      results.details.push({
        test: 'URL Path Encoding',
        status: 'passed',
        message: `Path segment ${index + 1} is URL encoded`
      })
    }
  })

  // Check path length
  if (pathSegments.length > 6) {
    results.warnings.push({
      test: 'URL Path Structure',
      message: `URL path has ${pathSegments.length} segments, which is quite deep. Consider if this structure is necessary.`
    })
  }

  results.details.push({
    test: 'URL Path Structure',
    status: 'passed',
    message: `URL path structure analyzed: ${pathSegments.length} segment(s)`
  })

  return results
}

/**
 * Validates URL query parameters structure
 * @param {URLSearchParams} searchParams - URL search parameters
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateUrlQuery(searchParams, options = {}) {  // eslint-disable-line no-unused-vars
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const params = Array.from(searchParams.keys())
  
  if (params.length === 0) {
    results.details.push({
      test: 'URL Query Parameters',
      status: 'passed',
      message: 'No query parameters present'
    })
    return results
  }

  // Validate JSON:API reserved parameter names
  const reservedParams = ['include', 'sort']
  const reservedPrefixes = ['fields[', 'page[', 'filter[']
  
  params.forEach(param => {
    const isReserved = reservedParams.includes(param) || 
                      reservedPrefixes.some(prefix => param.startsWith(prefix) && param.endsWith(']'))
    
    if (!isReserved && !isValidMemberName(param)) {
      results.valid = false
      results.errors.push({
        test: 'URL Query Parameters',
        message: `Query parameter "${param}" should follow JSON:API naming conventions`
      })
    }
  })

  results.details.push({
    test: 'URL Query Parameters',
    status: 'passed',
    message: `URL contains ${params.length} query parameter(s)`
  })

  return results
}

/**
 * Validates if a string is a valid resource type name
 * @param {string} resourceType - Resource type to validate
 * @returns {boolean} True if valid resource type
 */
function isValidResourceType(resourceType) {
  if (!resourceType || typeof resourceType !== 'string') {
    return false
  }
  
  // Resource types should follow JSON:API member naming conventions
  return isValidMemberName(resourceType)
}

/**
 * Validates if a string is a valid resource ID
 * @param {string} resourceId - Resource ID to validate
 * @returns {boolean} True if valid resource ID
 */
function isValidResourceId(resourceId) {
  if (!resourceId || typeof resourceId !== 'string') {
    return false
  }
  
  // Resource IDs can be more flexible than member names
  // Allow alphanumeric, hyphens, underscores, and periods
  return /^[a-zA-Z0-9._-]+$/.test(resourceId)
}

/**
 * Validates if a string is a valid relationship name
 * @param {string} relationshipName - Relationship name to validate
 * @returns {boolean} True if valid relationship name
 */
function isValidRelationshipName(relationshipName) {
  if (!relationshipName || typeof relationshipName !== 'string') {
    return false
  }
  
  // Relationship names should follow JSON:API member naming conventions
  return isValidMemberName(relationshipName)
}

/**
 * Validates if a string is a valid JSON:API member name
 * @param {string} name - Member name to validate
 * @returns {boolean} True if valid member name
 */
function isValidMemberName(name) {
  if (!name || typeof name !== 'string' || name.length === 0) return false
  
  // JSON:API member names: lowercase letters, numbers, hyphens, underscores
  // Must start and end with letter or number
  const validMemberRegex = /^[a-z0-9]([a-z0-9\-_]*[a-z0-9])?$/
  const hasConsecutive = /--+|__+/.test(name)
  
  return validMemberRegex.test(name) && !hasConsecutive
}

/**
 * Checks if a resource type is a known plural form
 * @param {string} resourceType - Resource type to check
 * @returns {boolean} True if known to be plural
 */
function isKnownPluralForm(resourceType) {
  // Common irregular plurals
  const irregularPlurals = [
    'people', 'children', 'mice', 'geese', 'feet', 'teeth',
    'men', 'women', 'sheep', 'deer', 'fish', 'data', 'media'
  ]
  
  return irregularPlurals.includes(resourceType.toLowerCase())
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