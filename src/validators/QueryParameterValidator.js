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
function validateSortParameter(params, response) {  // eslint-disable-line no-unused-vars
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

  // Validate each sort field
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

  if (results.valid) {
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