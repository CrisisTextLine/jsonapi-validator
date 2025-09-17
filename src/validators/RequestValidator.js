/**
 * RequestValidator.js
 * 
 * Validates JSON:API v1.1 request document structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/#crud
 */

import { validateResourceObject } from './ResourceValidator.js'
import { validateMemberName } from './ResourceValidator.js'

/**
 * Validates a JSON:API request document for creating or updating resources
 * @param {Object} requestBody - The request body to validate
 * @param {string} method - The HTTP method (POST, PATCH, PUT)
 * @param {Object} options - Validation options
 * @returns {Object} Validation result with success/failure and details
 */
export function validateRequestDocument(requestBody, method, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!requestBody) {
    results.valid = false
    results.errors.push({
      test: 'Request Document Structure',
      message: 'Request body cannot be empty for resource operations'
    })
    return results
  }

  if (typeof requestBody !== 'object' || Array.isArray(requestBody)) {
    results.valid = false
    results.errors.push({
      test: 'Request Document Structure',
      message: 'Request document must be a JSON object'
    })
    return results
  }

  // Validate top-level structure
  const hasData = Object.prototype.hasOwnProperty.call(requestBody, 'data')
  const hasErrors = Object.prototype.hasOwnProperty.call(requestBody, 'errors')
  const hasMeta = Object.prototype.hasOwnProperty.call(requestBody, 'meta')

  // Request documents must have data member
  if (!hasData) {
    results.valid = false
    results.errors.push({
      test: 'Request Document Structure',
      message: 'Request document must contain a "data" member'
    })
    return results
  }

  // Request documents must not have errors member  
  if (hasErrors) {
    results.valid = false
    results.errors.push({
      test: 'Request Document Structure',
      message: 'Request document must not contain an "errors" member'
    })
  }

  // Validate allowed top-level members for requests
  const allowedMembers = ['data', 'meta']
  const presentMembers = Object.keys(requestBody)
  const additionalMembers = presentMembers.filter(member => !allowedMembers.includes(member))

  if (additionalMembers.length > 0) {
    results.warnings.push({
      test: 'Request Document Structure',
      message: `Request document contains additional top-level members: ${additionalMembers.join(', ')}. Only "data" and "meta" are typically allowed.`
    })
  }

  // Validate the data member based on HTTP method
  const dataValidation = validateRequestData(requestBody.data, method, options)
  results.details.push(...dataValidation.details)
  if (!dataValidation.valid) {
    results.valid = false
    results.errors.push(...dataValidation.errors)
  }
  if (dataValidation.warnings) {
    results.warnings.push(...dataValidation.warnings)
  }

  // Validate meta member if present
  if (hasMeta) {
    const metaValidation = validateRequestMeta(requestBody.meta)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Request Document Structure',
      status: 'passed',
      message: `Valid ${method} request document structure`
    })
  }

  return results
}

/**
 * Validates the data member of a request document
 * @param {any} data - The data value to validate
 * @param {string} method - The HTTP method
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateRequestData(data, method, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // For resource creation/update, data must be a resource object (not array or null)
  if (data === null || data === undefined) {
    results.valid = false
    results.errors.push({
      test: 'Request Data Structure',
      message: 'Request data cannot be null for resource operations'
    })
    return results
  }

  if (Array.isArray(data)) {
    if (method === 'POST') {
      results.warnings.push({
        test: 'Request Data Structure',
        message: 'Request data is an array. Bulk resource creation may not be supported by all servers.'
      })
      
      // Validate each resource in the array
      for (let i = 0; i < data.length; i++) {
        const resourceOptions = {
          allowMissingId: method === 'POST',
          context: `data[${i}]`,
          ...options
        }
        const resourceValidation = validateResourceObject(data[i], resourceOptions)
        results.details.push(...resourceValidation.details)
        if (!resourceValidation.valid) {
          results.valid = false
          results.errors.push(...resourceValidation.errors)
        }
      }
    } else {
      results.valid = false
      results.errors.push({
        test: 'Request Data Structure',
        message: `Request data must be a single resource object for ${method} requests, not an array`
      })
      return results
    }
  } else {
    // Single resource object
    const resourceOptions = {
      allowMissingId: method === 'POST', // POST can have client-generated or missing IDs
      context: 'data',
      ...options
    }
    
    // For PATCH, validate that ID is present and matches URL
    if (method === 'PATCH') {
      if (!Object.prototype.hasOwnProperty.call(data, 'id')) {
        results.valid = false
        results.errors.push({
          test: 'Resource Update Validation',
          context: 'data',
          message: 'PATCH request resource must include "id" member'
        })
      }
      
      // Validate that type is present for PATCH
      if (!Object.prototype.hasOwnProperty.call(data, 'type')) {
        results.valid = false
        results.errors.push({
          test: 'Resource Update Validation', 
          context: 'data',
          message: 'PATCH request resource must include "type" member'
        })
      }
    }

    const resourceValidation = validateResourceObject(data, resourceOptions)
    results.details.push(...resourceValidation.details)
    if (!resourceValidation.valid) {
      results.valid = false
      results.errors.push(...resourceValidation.errors)
    }
    if (resourceValidation.warnings) {
      results.warnings.push(...resourceValidation.warnings)
    }
  }

  // Additional validation for resource creation
  if (method === 'POST') {
    const creationValidation = validateResourceCreation(data, options)
    results.details.push(...creationValidation.details)
    if (!creationValidation.valid) {
      results.valid = false
      results.errors.push(...creationValidation.errors)
    }
    if (creationValidation.warnings) {
      results.warnings.push(...creationValidation.warnings)
    }
  }

  return results
}

/**
 * Validates resource creation specific rules
 * @param {Object|Array} data - The resource(s) to validate for creation
 * @param {Object} options - Validation options
 * @returns {Object} Validation result
 */
function validateResourceCreation(data, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const resources = Array.isArray(data) ? data : [data]
  
  resources.forEach((resource, index) => {
    const context = Array.isArray(data) ? `data[${index}]` : 'data'
    
    if (typeof resource !== 'object' || resource === null) {
      return // Already validated in parent function
    }

    // Check for client-generated IDs
    if (Object.prototype.hasOwnProperty.call(resource, 'id')) {
      results.details.push({
        test: 'Resource Creation Validation',
        status: 'passed',
        context,
        message: 'Resource includes client-generated ID'
      })
      
      // Validate ID format for client-generated IDs
      if (typeof resource.id !== 'string' || resource.id.length === 0) {
        results.valid = false
        results.errors.push({
          test: 'Resource Creation Validation',
          context,
          message: 'Client-generated ID must be a non-empty string'
        })
      }
    } else {
      results.details.push({
        test: 'Resource Creation Validation',
        status: 'passed',
        context,
        message: 'Resource creation without client-generated ID (server will assign)'
      })
    }

    // Validate that attributes or relationships are present
    const hasAttributes = Object.prototype.hasOwnProperty.call(resource, 'attributes')
    const hasRelationships = Object.prototype.hasOwnProperty.call(resource, 'relationships')
    
    if (!hasAttributes && !hasRelationships) {
      results.warnings.push({
        test: 'Resource Creation Validation',
        context,
        message: 'Resource creation without attributes or relationships may be unusual'
      })
    }

    // Validate attributes don't contain readonly fields (if specified)
    if (hasAttributes && options.readOnlyFields) {
      const readOnlyFields = options.readOnlyFields
      const attributeKeys = Object.keys(resource.attributes)
      const foundReadOnly = attributeKeys.filter(key => readOnlyFields.includes(key))
      
      if (foundReadOnly.length > 0) {
        results.warnings.push({
          test: 'Resource Creation Validation',
          context,
          message: `Resource creation includes read-only fields: ${foundReadOnly.join(', ')}`
        })
      }
    }
  })

  return results
}

/**
 * Validates the meta member of a request document
 * @param {any} meta - The meta value to validate
 * @returns {Object} Validation result
 */
function validateRequestMeta(meta) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    results.valid = false
    results.errors.push({
      test: 'Request Meta Structure',
      message: 'Request meta must be an object'
    })
    return results
  }

  const metaKeys = Object.keys(meta)
  
  // Validate each meta member name follows JSON:API naming conventions
  for (const metaName of metaKeys) {
    const nameValidation = validateMemberName(metaName, `meta.${metaName}`)
    results.details.push(...nameValidation.details)
    if (!nameValidation.valid) {
      results.valid = false
      results.errors.push(...nameValidation.errors)
    }
  }

  results.details.push({
    test: 'Request Meta Structure',
    status: 'passed',
    message: `Request meta object contains ${metaKeys.length} metadata field(s)`
  })

  return results
}