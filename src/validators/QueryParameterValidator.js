/**
 * QueryParameterValidator.js
 * 
 * Validates JSON:API v1.1 query parameter compliance.
 * Based on specification: https://jsonapi.org/format/1.1/#query-parameters
 */

/**
 * Validates JSON:API query parameters from a URL
 * @param {string} url - The URL to parse and validate query parameters from
 * @param {Object} response - The API response to validate parameter effects (optional)
 * @returns {Object} Validation result with success/failure and details
 */
export function validateQueryParameters(url, response = null) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  try {
    const urlObj = new URL(url)
    const params = urlObj.searchParams
    
    // Track all parameters for validation
    const allParams = {}
    params.forEach((value, key) => {
      allParams[key] = value
    })

    // If no query parameters, that's valid but note it
    if (Object.keys(allParams).length === 0) {
      results.details.push({
        test: 'Query Parameters Present',
        status: 'passed',
        message: 'No query parameters provided (valid)'
      })
      return results
    }

    results.details.push({
      test: 'Query Parameters Present',
      status: 'passed', 
      message: `Found ${Object.keys(allParams).length} query parameter(s)`
    })

    // Validate each parameter type
    const includeResult = validateIncludeParameter(allParams, response)
    mergeValidationResults(results, includeResult)

    const fieldsResult = validateFieldsParameter(allParams, response)
    mergeValidationResults(results, fieldsResult)

    const sortResult = validateSortParameter(allParams, response)
    mergeValidationResults(results, sortResult)

    const pageResult = validatePageParameter(allParams, response)
    mergeValidationResults(results, pageResult)

    const filterResult = validateFilterParameter(allParams, response)
    mergeValidationResults(results, filterResult)

    const customResult = validateCustomParameters(allParams)
    mergeValidationResults(results, customResult)

  } catch (error) {
    results.valid = false
    results.errors.push({
      test: 'Query Parameter Parsing',
      message: `Failed to parse URL: ${error.message}`
    })
  }

  return results
}

/**
 * Validates the include parameter for compound documents
 * @param {Object} params - All query parameters
 * @param {Object} response - API response (optional)
 * @returns {Object} Validation result
 */
function validateIncludeParameter(params, response) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const includeValue = params.include
  if (!includeValue) {
    results.details.push({
      test: 'Include Parameter',
      status: 'passed',
      message: 'No include parameter (valid)'
    })
    return results
  }

  // Validate include parameter format
  const includeFields = includeValue.split(',').map(field => field.trim())
  
  // Check for empty fields
  const emptyFields = includeFields.filter(field => field === '')
  if (emptyFields.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Include Parameter Format',
      message: 'Include parameter contains empty values (comma-separated list should not have empty entries)'
    })
  }

  // Validate relationship path format
  includeFields.forEach((field, index) => {
    if (field && !isValidRelationshipPath(field)) {
      results.valid = false
      results.errors.push({
        test: 'Include Parameter Format',
        message: `Invalid relationship path "${field}" at position ${index + 1}. Relationship paths must use only letters, numbers, hyphens, underscores, and dots for nested relationships.`
      })
    }
  })

  if (results.valid) {
    results.details.push({
      test: 'Include Parameter Format',
      status: 'passed',
      message: `Valid include parameter with ${includeFields.length} relationship(s): ${includeFields.join(', ')}`
    })

    // If response is provided, validate that included resources are present
    if (response && response.included) {
      results.details.push({
        test: 'Include Parameter Effect',
        status: 'passed',
        message: `Response includes ${response.included.length} related resource(s)`
      })
    } else if (response && !response.included) {
      results.warnings.push({
        test: 'Include Parameter Effect',
        message: 'Include parameter provided but response has no included array. Server may not support compound documents or no related resources exist.'
      })
    }
  }

  return results
}

/**
 * Validates fields[TYPE] parameters for sparse fieldsets
 * @param {Object} params - All query parameters
 * @param {Object} response - API response (optional)
 * @returns {Object} Validation result
 */
function validateFieldsParameter(params, response) {  // eslint-disable-line no-unused-vars
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const fieldsParams = Object.keys(params).filter(key => key.startsWith('fields[') && key.endsWith(']'))
  
  if (fieldsParams.length === 0) {
    results.details.push({
      test: 'Fields Parameter',
      status: 'passed',
      message: 'No fields parameters (valid)'
    })
    return results
  }

  fieldsParams.forEach(paramKey => {
    const resourceType = paramKey.slice(7, -1) // Extract type from fields[TYPE]
    const fieldValue = params[paramKey]

    // Validate resource type format
    if (!isValidMemberName(resourceType)) {
      results.valid = false
      results.errors.push({
        test: 'Fields Parameter Format',
        message: `Invalid resource type "${resourceType}" in fields parameter. Resource types must follow JSON:API member naming rules.`
      })
      return
    }

    // Validate field list format
    if (!fieldValue || fieldValue.trim() === '') {
      results.valid = false
      results.errors.push({
        test: 'Fields Parameter Format',
        message: `Empty value for fields[${resourceType}]. Field list cannot be empty.`
      })
      return
    }

    const fieldList = fieldValue.split(',').map(field => field.trim())
    const emptyFields = fieldList.filter(field => field === '')
    
    if (emptyFields.length > 0) {
      results.valid = false
      results.errors.push({
        test: 'Fields Parameter Format',
        message: `fields[${resourceType}] contains empty field names (comma-separated list should not have empty entries)`
      })
      return
    }

    // Validate each field name
    fieldList.forEach(fieldName => {
      if (!isValidMemberName(fieldName)) {
        results.valid = false
        results.errors.push({
          test: 'Fields Parameter Format',
          message: `Invalid field name "${fieldName}" in fields[${resourceType}]. Field names must follow JSON:API member naming rules.`
        })
      }
    })

    if (results.valid) {
      results.details.push({
        test: 'Fields Parameter Format',
        status: 'passed',
        message: `Valid fields[${resourceType}] parameter with ${fieldList.length} field(s): ${fieldList.join(', ')}`
      })
    }
  })

  return results
}

/**
 * Validates sort parameter
 * @param {Object} params - All query parameters
 * @param {Object} response - API response (optional) 
 * @returns {Object} Validation result
 */
function validateSortParameter(params, response) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const sortValue = params.sort
  if (!sortValue) {
    results.details.push({
      test: 'Sort Parameter',
      status: 'passed',
      message: 'No sort parameter (valid)'
    })
    return results
  }

  // Parse sort fields
  const sortFields = sortValue.split(',').map(field => field.trim())
  
  // Check for empty fields
  const emptyFields = sortFields.filter(field => field === '')
  if (emptyFields.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Sort Parameter Format',
      message: 'Sort parameter contains empty values (comma-separated list should not have empty entries)'
    })
  }

  // Validate each sort field format
  sortFields.forEach((field, index) => {
    if (field === '') return

    const isDescending = field.startsWith('-')
    const fieldName = isDescending ? field.substring(1) : field
    
    if (fieldName === '') {
      results.valid = false
      results.errors.push({
        test: 'Sort Parameter Format',
        message: `Invalid sort field "${field}" at position ${index + 1}. Field name cannot be empty after "-" prefix.`
      })
      return
    }

    if (!isValidSortFieldName(fieldName)) {
      results.valid = false
      results.errors.push({
        test: 'Sort Parameter Format',
        message: `Invalid sort field name "${fieldName}" at position ${index + 1}. Field names must follow JSON:API member naming rules and can use dots for nested fields.`
      })
    }
  })

  // If response is provided, validate response order and field existence
  if (response && response.data && Array.isArray(response.data)) {
    const responseValidation = validateSortResponse(sortFields, response.data, params)
    mergeValidationResults(results, responseValidation)
  }

  // Report format validation results
  if (results.valid && results.errors.length === 0) {
    const ascendingFields = sortFields.filter(field => !field.startsWith('-'))
    const descendingFields = sortFields.filter(field => field.startsWith('-'))
    
    results.details.push({
      test: 'Sort Parameter Format',
      status: 'passed',
      message: `Valid sort parameter with ${sortFields.length} field(s): ${ascendingFields.length} ascending, ${descendingFields.length} descending`
    })
  }

  return results
}

/**
 * Validates page[*] parameters for pagination
 * @param {Object} params - All query parameters
 * @param {Object} response - API response (optional)
 * @returns {Object} Validation result
 */
function validatePageParameter(params, response) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const pageParams = Object.keys(params).filter(key => key.startsWith('page[') && key.endsWith(']'))
  
  if (pageParams.length === 0) {
    results.details.push({
      test: 'Page Parameter',
      status: 'passed',
      message: 'No page parameters (valid)'
    })
    return results
  }

  const standardPageParams = ['page[size]', 'page[number]', 'page[limit]', 'page[offset]']
  
  pageParams.forEach(paramKey => {
    const pageType = paramKey.slice(5, -1) // Extract type from page[TYPE]
    const pageValue = params[paramKey]

    // Validate that page parameters have values
    if (!pageValue || pageValue.trim() === '') {
      results.valid = false
      results.errors.push({
        test: 'Page Parameter Format',
        message: `Empty value for ${paramKey}. Page parameters must have values.`
      })
      return
    }

    // For standard pagination parameters, validate they are positive integers
    if (standardPageParams.includes(paramKey)) {
      const numValue = parseInt(pageValue, 10)
      if (isNaN(numValue) || numValue < 1) {
        results.valid = false
        results.errors.push({
          test: 'Page Parameter Format',
          message: `Invalid value "${pageValue}" for ${paramKey}. Must be a positive integer.`
        })
      } else {
        results.details.push({
          test: 'Page Parameter Format',
          status: 'passed',
          message: `Valid ${paramKey} = ${numValue}`
        })
      }
    } else {
      // Custom pagination parameter - just validate the parameter name format
      if (!isValidMemberName(pageType)) {
        results.valid = false
        results.errors.push({
          test: 'Page Parameter Format',
          message: `Invalid page parameter type "${pageType}" in ${paramKey}. Page parameter types must follow JSON:API member naming rules.`
        })
      } else {
        results.details.push({
          test: 'Page Parameter Format',
          status: 'passed',
          message: `Custom pagination parameter ${paramKey} = ${pageValue}`
        })
      }
    }
  })

  // If response provided, check for pagination links
  if (response && response.links && pageParams.length > 0) {
    const paginationLinks = ['first', 'last', 'prev', 'next'].filter(link => response.links[link])
    if (paginationLinks.length > 0) {
      results.details.push({
        test: 'Page Parameter Effect',
        status: 'passed',
        message: `Response includes pagination links: ${paginationLinks.join(', ')}`
      })
    } else {
      results.warnings.push({
        test: 'Page Parameter Effect',
        message: 'Page parameters provided but response has no pagination links'
      })
    }
  }

  return results
}

/**
 * Validates filter[*] parameters
 * @param {Object} params - All query parameters
 * @param {Object} response - API response (optional)
 * @returns {Object} Validation result
 */
function validateFilterParameter(params, response) {  // eslint-disable-line no-unused-vars
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const filterParams = Object.keys(params).filter(key => key.startsWith('filter[') && key.endsWith(']'))
  
  if (filterParams.length === 0) {
    results.details.push({
      test: 'Filter Parameter',
      status: 'passed',
      message: 'No filter parameters (valid)'
    })
    return results
  }

  filterParams.forEach(paramKey => {
    const filterField = paramKey.slice(7, -1) // Extract field from filter[FIELD]
    const filterValue = params[paramKey]

    // Validate filter field name
    if (!filterField || filterField.trim() === '') {
      results.valid = false
      results.errors.push({
        test: 'Filter Parameter Format',
        message: `Empty filter field name in ${paramKey}`
      })
      return
    }

    if (!isValidMemberName(filterField)) {
      results.valid = false
      results.errors.push({
        test: 'Filter Parameter Format',
        message: `Invalid filter field name "${filterField}" in ${paramKey}. Filter field names must follow JSON:API member naming rules.`
      })
      return
    }

    // Filter values can be empty (to filter for resources without that field)
    results.details.push({
      test: 'Filter Parameter Format',
      status: 'passed',
      message: `Valid filter[${filterField}] = "${filterValue}"`
    })
  })

  if (filterParams.length > 0) {
    results.details.push({
      test: 'Filter Parameter Summary',
      status: 'passed',
      message: `Found ${filterParams.length} filter parameter(s)`
    })
  }

  return results
}

/**
 * Validates that the response order matches the requested sort fields
 * @param {Array} sortFields - Array of sort fields (including '-' prefix for descending)
 * @param {Array} resources - Array of resources from the response
 * @param {Object} params - All query parameters (to check for pagination)
 * @returns {Object} Validation result
 */
function validateSortResponse(sortFields, resources, params = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!sortFields.length || !resources.length) {
    return results
  }

  // Check if sort fields exist in resources
  const fieldExistenceResults = validateSortFieldsExist(sortFields, resources)
  mergeValidationResults(results, fieldExistenceResults)

  // If resources have 1 or fewer items, sorting is automatically correct
  if (resources.length <= 1) {
    results.details.push({
      test: 'Sort Response Order',
      status: 'passed',
      message: `Response has ${resources.length} resource(s), sort order is trivially correct`
    })
    return results
  }

  // Validate actual sort order in response
  const orderValidationResults = validateResponseOrder(sortFields, resources)
  mergeValidationResults(results, orderValidationResults)

  // Check for pagination consistency concerns
  const paginationResults = validateSortPaginationConsistency(sortFields, params)
  mergeValidationResults(results, paginationResults)

  return results
}

/**
 * Validates that sort fields actually exist in the response resources
 * @param {Array} sortFields - Array of sort fields (including '-' prefix for descending)
 * @param {Array} resources - Array of resources from the response
 * @returns {Object} Validation result
 */
function validateSortFieldsExist(sortFields, resources) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!resources.length) return results

  // Use first resource as representative sample to check field existence
  const sampleResource = resources[0]
  const missingFields = []
  const existingFields = []

  sortFields.forEach(field => {
    const isDescending = field.startsWith('-')
    const fieldName = isDescending ? field.substring(1) : field
    
    // Check if field exists in attributes or at root level
    let fieldExists = false
    
    if (sampleResource.attributes && hasNestedProperty(sampleResource.attributes, fieldName)) {
      fieldExists = true
    } else if (hasNestedProperty(sampleResource, fieldName)) {
      fieldExists = true
    }

    if (fieldExists) {
      existingFields.push(fieldName)
    } else {
      missingFields.push(fieldName)
    }
  })

  if (missingFields.length > 0) {
    results.warnings.push({
      test: 'Sort Field Existence',
      message: `Sort field(s) not found in response resources: ${missingFields.join(', ')}. This may indicate the API doesn't support sorting by these fields.`
    })
  }

  if (existingFields.length > 0) {
    results.details.push({
      test: 'Sort Field Existence',
      status: 'passed',
      message: `Sort field(s) found in response resources: ${existingFields.join(', ')}`
    })
  }

  return results
}

/**
 * Validates that the response resources are actually ordered according to sort fields
 * @param {Array} sortFields - Array of sort fields (including '-' prefix for descending)
 * @param {Array} resources - Array of resources from the response
 * @returns {Object} Validation result
 */
function validateResponseOrder(sortFields, resources) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Check ordering for each consecutive pair of resources
  for (let i = 0; i < resources.length - 1; i++) {
    const currentResource = resources[i]
    const nextResource = resources[i + 1]

    const comparison = compareResourcesBySortFields(currentResource, nextResource, sortFields)
    
    // If comparison > 0, it means current > next, which violates sort order
    if (comparison > 0) {
      results.valid = false
      results.errors.push({
        test: 'Sort Response Order',
        message: `Resources at positions ${i + 1} and ${i + 2} are not correctly ordered according to sort criteria: ${sortFields.join(', ')}`
      })
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Sort Response Order',
      status: 'passed',
      message: `Response resources are correctly ordered according to sort criteria: ${sortFields.join(', ')}`
    })
  }

  return results
}

/**
 * Compares two resources according to sort fields
 * @param {Object} a - First resource
 * @param {Object} b - Second resource  
 * @param {Array} sortFields - Array of sort fields (including '-' prefix for descending)
 * @returns {number} -1 if a < b, 0 if a === b, 1 if a > b
 */
function compareResourcesBySortFields(a, b, sortFields) {
  for (const field of sortFields) {
    const isDescending = field.startsWith('-')
    const fieldName = isDescending ? field.substring(1) : field
    
    const aVal = getResourceFieldValue(a, fieldName)
    const bVal = getResourceFieldValue(b, fieldName)
    
    // Handle null/undefined values
    if (aVal === null || aVal === undefined) {
      if (bVal === null || bVal === undefined) continue
      return isDescending ? 1 : -1
    }
    if (bVal === null || bVal === undefined) {
      return isDescending ? -1 : 1
    }

    // Compare values
    if (aVal < bVal) return isDescending ? 1 : -1
    if (aVal > bVal) return isDescending ? -1 : 1
    // If equal, continue to next sort field
  }
  return 0
}

/**
 * Gets the value of a field from a resource, checking both attributes and root level
 * @param {Object} resource - The resource object
 * @param {string} fieldName - The field name (may include dots for nested access)
 * @returns {*} The field value or null if not found
 */
function getResourceFieldValue(resource, fieldName) {
  // First check in attributes
  if (resource.attributes) {
    const attrValue = getNestedProperty(resource.attributes, fieldName)
    if (attrValue !== null) return attrValue
  }
  
  // Then check at root level
  return getNestedProperty(resource, fieldName)
}

/**
 * Gets a nested property from an object using dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - The property path (e.g., 'a.b.c')
 * @returns {*} The property value or null if not found
 */
function getNestedProperty(obj, path) {
  if (!obj || typeof obj !== 'object') return null
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return null
    }
    current = current[key]
  }
  
  return current === undefined ? null : current
}

/**
 * Checks if a nested property exists in an object using dot notation
 * @param {Object} obj - The object to search
 * @param {string} path - The property path (e.g., 'a.b.c')  
 * @returns {boolean} True if the property exists
 */
function hasNestedProperty(obj, path) {
  if (!obj || typeof obj !== 'object') return false
  
  const keys = path.split('.')
  let current = obj
  
  for (const key of keys) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return false
    }
    if (!(key in current)) {
      return false
    }
    current = current[key]
  }
  
  return true
}

/**
 * Validates pagination consistency with sorting
 * @param {Array} sortFields - Array of sort fields (including '-' prefix for descending)  
 * @param {Object} params - All query parameters
 * @returns {Object} Validation result
 */
function validateSortPaginationConsistency(sortFields, params) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Check if pagination parameters are present
  const pageParams = Object.keys(params).filter(key => key.startsWith('page[') && key.endsWith(']'))
  
  if (pageParams.length === 0) {
    results.details.push({
      test: 'Sort Pagination Consistency',
      status: 'passed', 
      message: 'No pagination parameters detected - sort consistency across pages not applicable'
    })
    return results
  }

  // If both sorting and pagination are used, provide guidance
  if (sortFields.length > 0 && pageParams.length > 0) {
    results.details.push({
      test: 'Sort Pagination Consistency',
      status: 'passed',
      message: `Sorting with pagination detected. Ensure sort order is consistent across all pages. Sort fields: ${sortFields.join(', ')}, Page params: ${pageParams.join(', ')}`
    })

    // Check for potential stability issues
    const hasPotentiallyUnstableSort = sortFields.some(field => {
      const fieldName = field.startsWith('-') ? field.substring(1) : field
      // Common fields that might not provide stable sort order
      return ['title', 'name', 'status'].includes(fieldName)
    })

    if (hasPotentiallyUnstableSort && !sortFields.includes('id') && !sortFields.includes('-id')) {
      results.warnings.push({
        test: 'Sort Pagination Consistency',
        message: 'Sorting by fields that may have duplicate values without including "id" as a tiebreaker may result in inconsistent ordering across pages. Consider adding "id" as a secondary sort field.'
      })
    }
  }

  return results
}

/**
 * Validates custom (non-reserved) parameters follow naming conventions
 * @param {Object} params - All query parameters
 * @returns {Object} Validation result
 */
function validateCustomParameters(params) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const reservedParams = ['include', 'sort']
  const reservedPrefixes = ['fields[', 'page[', 'filter[']
  
  const customParams = Object.keys(params).filter(param => {
    if (reservedParams.includes(param)) return false
    if (reservedPrefixes.some(prefix => param.startsWith(prefix) && param.endsWith(']'))) return false
    return true
  })

  if (customParams.length === 0) {
    results.details.push({
      test: 'Custom Parameters',
      status: 'passed',
      message: 'No custom parameters (valid)'
    })
    return results
  }

  // Validate custom parameter names follow member naming conventions
  customParams.forEach(param => {
    if (!isValidMemberName(param)) {
      results.valid = false
      results.errors.push({
        test: 'Custom Parameter Names',
        message: `Custom parameter "${param}" does not follow JSON:API member naming conventions. Parameter names must contain only lowercase letters, numbers, hyphens, and underscores, and cannot start/end with hyphens or underscores.`
      })
    } else {
      results.details.push({
        test: 'Custom Parameter Names',
        status: 'passed',
        message: `Valid custom parameter: ${param}`
      })
    }
  })

  if (customParams.length > 0 && results.valid) {
    results.details.push({
      test: 'Custom Parameters Summary',
      status: 'passed',
      message: `Found ${customParams.length} valid custom parameter(s): ${customParams.join(', ')}`
    })
  }

  return results
}

/**
 * Helper function to validate relationship path format (for include parameter)
 * @param {string} path - Relationship path to validate
 * @returns {boolean} True if valid relationship path
 */
function isValidRelationshipPath(path) {
  if (!path || typeof path !== 'string') return false
  
  // Split on dots for nested relationships
  const segments = path.split('.')
  
  // Each segment must be a valid member name
  return segments.every(segment => isValidMemberName(segment))
}

/**
 * Helper function to validate sort field names (allows dots for nested fields)
 * @param {string} fieldName - Field name to validate
 * @returns {boolean} True if valid sort field name
 */
function isValidSortFieldName(fieldName) {
  if (!fieldName || typeof fieldName !== 'string') return false
  
  // Allow dots for nested field access in sorting
  const segments = fieldName.split('.')
  
  // Each segment must be a valid member name
  return segments.every(segment => isValidMemberName(segment))
}

/**
 * Helper function to validate JSON:API member names
 * @param {string} name - Member name to validate
 * @returns {boolean} True if valid member name
 */
function isValidMemberName(name) {
  if (!name || typeof name !== 'string' || name.length === 0) return false
  
  // JSON:API member names must:
  // - Contain only lowercase letters, numbers, hyphens, and underscores
  // - Start and end with a letter or number
  // - Not have consecutive hyphens or underscores
  const validMemberRegex = /^[a-z0-9]([a-z0-9\-_]*[a-z0-9])?$/
  const hasConsecutive = /--+|__+/.test(name)
  
  return validMemberRegex.test(name) && !hasConsecutive
}

/**
 * Helper function to merge validation results
 * @param {Object} target - Target results object to merge into
 * @param {Object} source - Source results object to merge from
 */
function mergeValidationResults(target, source) {
  if (!source.valid) {
    target.valid = false
  }
  
  target.errors.push(...source.errors)
  target.warnings.push(...source.warnings)
  target.details.push(...source.details)
}