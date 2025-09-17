/**
 * QueryValidator.js
 * 
 * Validates JSON:API query parameters including sparse fieldsets, includes, sorting, and pagination
 */

/**
 * Parses sparse fieldset parameters from query parameters
 * @param {Object} queryParams - Object containing query parameters
 * @returns {Object} Parsed fieldsets object with type -> fields mapping
 */
export function parseSparseFieldsets(queryParams) {
  const fieldsets = {}
  
  if (!queryParams) {
    return fieldsets
  }

  // Handle both URL-encoded and decoded parameter names
  for (const [key, value] of Object.entries(queryParams)) {
    // Match fields[type] or fields%5Btype%5D patterns
    const match = key.match(/^fields(?:\[|%5B)([^%\]]+)(?:\]|%5D)$/i)
    if (match) {
      const resourceType = decodeURIComponent(match[1])
      if (typeof value === 'string' && value.trim()) {
        fieldsets[resourceType] = value.split(',').map(field => field.trim()).filter(field => field)
      }
    }
  }

  return fieldsets
}

/**
 * Validates that sparse fieldsets are correctly applied to a resource
 * @param {Object} resource - The resource object to validate
 * @param {Object} fieldsets - Parsed fieldsets object
 * @returns {Object} Validation result
 */
export function validateResourceFieldset(resource, fieldsets) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!resource || typeof resource !== 'object' || !resource.type) {
    results.valid = false
    results.errors.push({
      test: 'Sparse Fieldset Validation',
      message: 'Resource must be a valid object with a type'
    })
    return results
  }

  const resourceType = resource.type
  const requestedFields = fieldsets[resourceType]

  // If no fieldset is specified for this resource type, no validation needed
  if (!requestedFields || !Array.isArray(requestedFields)) {
    results.details.push({
      test: 'Sparse Fieldset Validation',
      status: 'passed',
      message: `No fieldset restrictions for resource type "${resourceType}"`
    })
    return results
  }

  // Required fields that must always be present
  if (!resource.id) {
    results.valid = false
    results.errors.push({
      test: 'Sparse Fieldset Required Fields',
      message: 'Resource "id" field must always be present regardless of fieldset restrictions'
    })
  }

  if (!resource.type) {
    results.valid = false
    results.errors.push({
      test: 'Sparse Fieldset Required Fields',
      message: 'Resource "type" field must always be present regardless of fieldset restrictions'
    })
  }

  // Validate attributes fieldset compliance
  if (resource.attributes && typeof resource.attributes === 'object') {
    const presentAttributes = Object.keys(resource.attributes)
    const extraAttributes = presentAttributes.filter(attr => !requestedFields.includes(attr))
    const missingAttributes = requestedFields.filter(field => 
      // Only check for missing attributes that would be in the attributes object
      // (not relationships, links, or meta)
      !['links', 'meta', 'relationships'].includes(field) && 
      !(field in resource.attributes)
    )

    // Check for fields that should not be present
    if (extraAttributes.length > 0) {
      results.valid = false
      results.errors.push({
        test: 'Sparse Fieldset Compliance',
        message: `Resource contains unrequested attribute fields: ${extraAttributes.join(', ')}`
      })
    }

    // Report on successfully filtered fields
    if (presentAttributes.length > 0 && extraAttributes.length === 0) {
      results.details.push({
        test: 'Sparse Fieldset Compliance',
        status: 'passed',
        message: `Resource attributes correctly limited to requested fields: ${presentAttributes.join(', ')}`
      })
    }

    // Warn about requested fields that are not present
    if (missingAttributes.length > 0) {
      results.warnings.push({
        test: 'Sparse Fieldset Completeness',
        message: `Some requested fields not present in resource: ${missingAttributes.join(', ')}`
      })
    }
  } else if (requestedFields.some(field => !['links', 'meta', 'relationships'].includes(field))) {
    // Only warn if requested fields would normally be in attributes
    results.warnings.push({
      test: 'Sparse Fieldset Completeness',
      message: 'Resource has no attributes object but fieldset includes attribute fields'
    })
  }

  // Validate that special fields (links, meta, relationships) can be present regardless of fieldset
  // These are allowed but not required to be in the fieldset specification
  const specialFieldsPresent = []
  if (resource.links) specialFieldsPresent.push('links')
  if (resource.meta) specialFieldsPresent.push('meta')
  if (resource.relationships) specialFieldsPresent.push('relationships')

  if (specialFieldsPresent.length > 0) {
    results.details.push({
      test: 'Sparse Fieldset Special Fields',
      status: 'passed',
      message: `Resource includes allowed special fields: ${specialFieldsPresent.join(', ')}`
    })
  }

  return results
}

/**
 * Validates sparse fieldsets across an entire JSON:API response
 * @param {Object} response - The JSON:API response object
 * @param {Object} queryParams - The original query parameters used in the request
 * @returns {Object} Validation result
 */
export function validateSparseFieldsets(response, queryParams) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!response || typeof response !== 'object') {
    results.valid = false
    results.errors.push({
      test: 'Sparse Fieldset Document Validation',
      message: 'Response must be a valid JSON:API document object'
    })
    return results
  }

  const fieldsets = parseSparseFieldsets(queryParams)

  // If no fieldsets specified, no validation needed
  if (Object.keys(fieldsets).length === 0) {
    results.details.push({
      test: 'Sparse Fieldset Parsing',
      status: 'passed',
      message: 'No sparse fieldset parameters found in request'
    })
    return results
  }

  results.details.push({
    test: 'Sparse Fieldset Parsing',
    status: 'passed',
    message: `Parsed fieldsets for resource types: ${Object.keys(fieldsets).join(', ')}`
  })

  // Validate primary data resources
  if (response.data) {
    const dataArray = Array.isArray(response.data) ? response.data : [response.data]
    
    dataArray.forEach((resource, index) => {
      if (resource && typeof resource === 'object') {
        const resourceValidation = validateResourceFieldset(resource, fieldsets)
        
        // Add context to results
        const contextSuffix = Array.isArray(response.data) ? ` (resource ${index})` : ''
        resourceValidation.details.forEach(detail => {
          detail.context = `Primary data${contextSuffix}`
        })
        resourceValidation.errors.forEach(error => {
          error.context = `Primary data${contextSuffix}`
        })
        resourceValidation.warnings.forEach(warning => {
          warning.context = `Primary data${contextSuffix}`
        })

        results.details.push(...resourceValidation.details)
        results.errors.push(...resourceValidation.errors)
        results.warnings.push(...resourceValidation.warnings)

        if (!resourceValidation.valid) {
          results.valid = false
        }
      }
    })
  }

  // Validate included resources
  if (response.included && Array.isArray(response.included)) {
    response.included.forEach((resource, index) => {
      const resourceValidation = validateResourceFieldset(resource, fieldsets)
      
      // Add context to results
      resourceValidation.details.forEach(detail => {
        detail.context = `Included resource ${index} (${resource.type}:${resource.id})`
      })
      resourceValidation.errors.forEach(error => {
        error.context = `Included resource ${index} (${resource.type}:${resource.id})`
      })
      resourceValidation.warnings.forEach(warning => {
        warning.context = `Included resource ${index} (${resource.type}:${resource.id})`
      })

      results.details.push(...resourceValidation.details)
      results.errors.push(...resourceValidation.errors)
      results.warnings.push(...resourceValidation.warnings)

      if (!resourceValidation.valid) {
        results.valid = false
      }
    })
  }

  return results
}

/**
 * Validates query parameter syntax for sparse fieldsets
 * @param {Object} queryParams - The query parameters to validate
 * @returns {Object} Validation result
 */
export function validateFieldsetSyntax(queryParams) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!queryParams || typeof queryParams !== 'object') {
    results.details.push({
      test: 'Fieldset Syntax Validation',
      status: 'passed',
      message: 'No query parameters to validate'
    })
    return results
  }

  const fieldsetParams = []
  const invalidParams = []

  for (const [key, value] of Object.entries(queryParams)) {
    // Check for fieldset parameter pattern
    const match = key.match(/^fields(?:\[|%5B)([^%\]]+)(?:\]|%5D)$/i)
    if (match) {
      fieldsetParams.push(key)
      
      const resourceType = decodeURIComponent(match[1])
      
      // Validate resource type format
      if (!resourceType || typeof resourceType !== 'string' || !resourceType.trim()) {
        results.valid = false
        results.errors.push({
          test: 'Fieldset Syntax',
          message: `Empty or invalid resource type in fieldset parameter: ${key}`
        })
        invalidParams.push(key)
        continue
      }

      // Validate field list format
      if (typeof value !== 'string') {
        results.valid = false
        results.errors.push({
          test: 'Fieldset Syntax',
          message: `Fieldset parameter value must be a string: ${key}`
        })
        invalidParams.push(key)
        continue
      }

      if (!value.trim()) {
        results.warnings.push({
          test: 'Fieldset Syntax',
          message: `Empty fieldset value for resource type "${resourceType}"`
        })
        continue
      }

      // Parse and validate individual fields
      const fields = value.split(',').map(f => f.trim()).filter(f => f)
      
      if (fields.length === 0) {
        results.warnings.push({
          test: 'Fieldset Syntax',
          message: `No valid fields specified for resource type "${resourceType}"`
        })
        continue
      }

      // Validate field name format (basic check for valid member names)
      const invalidFields = fields.filter(field => {
        // JSON:API member names must not contain certain characters
        return /[[\]{}()<>@,;:\\"/?=]/.test(field) || field.length === 0
      })

      if (invalidFields.length > 0) {
        results.valid = false
        results.errors.push({
          test: 'Fieldset Syntax',
          message: `Invalid field names for resource type "${resourceType}": ${invalidFields.join(', ')}`
        })
        invalidParams.push(key)
      }
    }
  }

  if (fieldsetParams.length === 0) {
    results.details.push({
      test: 'Fieldset Syntax Validation',
      status: 'passed',
      message: 'No sparse fieldset parameters found'
    })
  } else if (invalidParams.length === 0) {
    results.details.push({
      test: 'Fieldset Syntax Validation',
      status: 'passed',
      message: `Valid fieldset syntax for ${fieldsetParams.length} resource type(s)`
    })
  }

  return results
}