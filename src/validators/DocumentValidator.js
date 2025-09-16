/**
 * DocumentValidator.js
 * 
 * Validates JSON:API v1.1 top-level document structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/
 */

/**
 * Validates a JSON:API document's top-level structure
 * @param {any} response - The response object to validate
 * @returns {Object} Validation result with success/failure and details
 */
export function validateDocument(response) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Step 1: Validate that response is valid JSON (assume already parsed)
  if (response === null || response === undefined) {
    results.valid = false
    results.errors.push({
      test: 'JSON Parsing',
      message: 'Response is null or undefined'
    })
    return results
  }

  if (typeof response !== 'object') {
    results.valid = false
    results.errors.push({
      test: 'JSON Parsing', 
      message: 'Response must be a JSON object'
    })
    return results
  }

  results.details.push({
    test: 'JSON Parsing',
    status: 'passed',
    message: 'Response is valid JSON object'
  })

  // Step 2: Check that top-level contains at least one of: data, errors, or meta
  const hasData = Object.prototype.hasOwnProperty.call(response, 'data')
  const hasErrors = Object.prototype.hasOwnProperty.call(response, 'errors')
  const hasMeta = Object.prototype.hasOwnProperty.call(response, 'meta')

  if (!hasData && !hasErrors && !hasMeta) {
    results.valid = false
    results.errors.push({
      test: 'Required Top-Level Members',
      message: 'Document must contain at least one of: "data", "errors", or "meta"'
    })
  } else {
    results.details.push({
      test: 'Required Top-Level Members',
      status: 'passed',
      message: 'Document contains at least one required top-level member'
    })
  }

  // Step 3: Ensure data and errors are not both present
  if (hasData && hasErrors) {
    results.valid = false
    results.errors.push({
      test: 'Data and Errors Exclusivity',
      message: 'Document must not contain both "data" and "errors" at the top level'
    })
  } else {
    results.details.push({
      test: 'Data and Errors Exclusivity', 
      status: 'passed',
      message: 'Document does not have both "data" and "errors" present'
    })
  }

  // Step 4: Validate data structure if present
  if (hasData) {
    const dataValidation = validateDataMember(response.data)
    results.details.push(...dataValidation.details)
    if (!dataValidation.valid) {
      results.valid = false
      results.errors.push(...dataValidation.errors)
    }
  }

  // Step 5: Validate optional included array
  if (Object.prototype.hasOwnProperty.call(response, 'included')) {
    const includedValidation = validateIncludedMember(response.included)
    results.details.push(...includedValidation.details)
    if (!includedValidation.valid) {
      results.valid = false
      results.errors.push(...includedValidation.errors)
    }
    if (includedValidation.warnings) {
      results.warnings.push(...includedValidation.warnings)
    }
  }

  // Step 6: Validate optional links object
  if (Object.prototype.hasOwnProperty.call(response, 'links')) {
    const linksValidation = validateLinksMember(response.links)
    results.details.push(...linksValidation.details)
    if (!linksValidation.valid) {
      results.valid = false
      results.errors.push(...linksValidation.errors)
    }
  }

  // Step 7: Validate optional jsonapi object
  if (Object.prototype.hasOwnProperty.call(response, 'jsonapi')) {
    const jsonApiValidation = validateJsonApiMember(response.jsonapi)
    results.details.push(...jsonApiValidation.details)
    if (!jsonApiValidation.valid) {
      results.valid = false
      results.errors.push(...jsonApiValidation.errors)
    }
  }

  // Step 8: Check for additional top-level members beyond allowed ones
  const allowedMembers = ['data', 'errors', 'meta', 'links', 'included', 'jsonapi']
  const presentMembers = Object.keys(response)
  const additionalMembers = presentMembers.filter(member => !allowedMembers.includes(member))

  if (additionalMembers.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Additional Top-Level Members',
      message: `Document contains additional top-level members not allowed by JSON:API spec: ${additionalMembers.join(', ')}`
    })
  } else {
    results.details.push({
      test: 'Additional Top-Level Members',
      status: 'passed', 
      message: 'Document contains only allowed top-level members'
    })
  }

  return results
}

/**
 * Validates the data member structure
 * @param {any} data - The data value to validate
 * @returns {Object} Validation result
 */
function validateDataMember(data) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  // data can be:
  // - null for empty single resource
  // - Resource object for single resource  
  // - Array of resource objects for collection
  // - Empty array for empty collection

  if (data === null) {
    results.details.push({
      test: 'Data Member Structure',
      status: 'passed',
      message: 'Data is null (valid for empty single resource)'
    })
  } else if (Array.isArray(data)) {
    if (data.length === 0) {
      results.details.push({
        test: 'Data Member Structure',
        status: 'passed',
        message: 'Data is empty array (valid for empty collection)'
      })
    } else {
      // Validate each resource object in collection
      let allResourcesValid = true
      for (let i = 0; i < data.length; i++) {
        if (!isValidResourceObject(data[i])) {
          allResourcesValid = false
          break
        }
      }
      
      if (allResourcesValid) {
        results.details.push({
          test: 'Data Member Structure',
          status: 'passed',
          message: `Data is array of ${data.length} resource objects`
        })
      } else {
        results.valid = false
        results.errors.push({
          test: 'Data Member Structure',
          message: 'Data array contains invalid resource objects'
        })
      }
    }
  } else if (typeof data === 'object') {
    // Single resource object
    if (isValidResourceObject(data)) {
      results.details.push({
        test: 'Data Member Structure',
        status: 'passed',
        message: 'Data is valid single resource object'
      })
    } else {
      results.valid = false
      results.errors.push({
        test: 'Data Member Structure',
        message: 'Data is not a valid resource object'
      })
    }
  } else {
    results.valid = false
    results.errors.push({
      test: 'Data Member Structure', 
      message: 'Data must be null, a resource object, or an array of resource objects'
    })
  }

  return results
}

/**
 * Basic check if an object has the minimal structure of a resource object
 * @param {any} obj - Object to check
 * @returns {boolean} True if has basic resource object structure
 */
function isValidResourceObject(obj) {
  return obj !== null &&
         typeof obj === 'object' &&
         typeof obj.type === 'string' &&
         obj.type.length > 0 &&
         (Object.prototype.hasOwnProperty.call(obj, 'id') ? typeof obj.id === 'string' : true)
}

/**
 * Validates the included member
 * @param {any} included - The included value to validate
 * @returns {Object} Validation result
 */
function validateIncludedMember(included) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!Array.isArray(included)) {
    results.valid = false
    results.errors.push({
      test: 'Included Member Structure',
      message: 'Included member must be an array'
    })
    return results
  }

  if (included.length === 0) {
    results.warnings.push({
      test: 'Included Member Structure',
      message: 'Included array is empty - consider omitting if no included resources'
    })
  }

  // Validate each resource in included array
  let allResourcesValid = true
  for (let i = 0; i < included.length; i++) {
    if (!isValidResourceObject(included[i])) {
      allResourcesValid = false
      break
    }
  }

  if (allResourcesValid) {
    results.details.push({
      test: 'Included Member Structure',
      status: 'passed',
      message: `Included array contains ${included.length} valid resource objects`
    })
  } else {
    results.valid = false
    results.errors.push({
      test: 'Included Member Structure',
      message: 'Included array contains invalid resource objects'
    })
  }

  return results
}

/**
 * Validates the links member
 * @param {any} links - The links value to validate
 * @returns {Object} Validation result
 */
function validateLinksMember(links) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof links !== 'object' || links === null) {
    results.valid = false
    results.errors.push({
      test: 'Links Member Structure',
      message: 'Links member must be an object'
    })
    return results
  }

  // Basic validation - links should be an object with string or object values
  const linkKeys = Object.keys(links)
  let validLinks = true
  
  for (const key of linkKeys) {
    const linkValue = links[key]
    if (typeof linkValue !== 'string' && (typeof linkValue !== 'object' || linkValue === null)) {
      validLinks = false
      break
    }
  }

  if (validLinks) {
    results.details.push({
      test: 'Links Member Structure',
      status: 'passed', 
      message: `Links object contains ${linkKeys.length} valid link(s)`
    })
  } else {
    results.valid = false
    results.errors.push({
      test: 'Links Member Structure',
      message: 'Links object contains invalid link values'
    })
  }

  return results
}

/**
 * Validates the jsonapi member
 * @param {any} jsonapi - The jsonapi value to validate
 * @returns {Object} Validation result
 */
function validateJsonApiMember(jsonapi) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof jsonapi !== 'object' || jsonapi === null) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Member Structure',
      message: 'JSON:API member must be an object'
    })
    return results
  }

  // Check for version if present
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'version')) {
    if (typeof jsonapi.version !== 'string') {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Member Structure',
        message: 'JSON:API version must be a string'
      })
    } else {
      results.details.push({
        test: 'JSON:API Member Structure',
        status: 'passed',
        message: `JSON:API version specified: ${jsonapi.version}`
      })
    }
  } else {
    results.details.push({
      test: 'JSON:API Member Structure',
      status: 'passed',
      message: 'JSON:API object present (version not specified)'
    })
  }

  return results
}