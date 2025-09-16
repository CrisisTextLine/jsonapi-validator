/**
 * DocumentValidator.js
 * 
 * Validates JSON:API v1.1 top-level document structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/
 */

import { validateResourceObject, validateResourceCollection } from './ResourceValidator.js'
import { isValidUrl, getUrlValidationError } from '../utils/UrlValidator.js'

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
    warnings: [],
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
      // Validate resource collection using comprehensive ResourceValidator
      const collectionValidation = validateResourceCollection(data, { context: 'data' })
      results.details.push(...collectionValidation.details)
      if (!collectionValidation.valid) {
        results.valid = false
        results.errors.push(...collectionValidation.errors)
      }
      if (collectionValidation.warnings) {
        results.warnings.push(...collectionValidation.warnings)
      }
    }
  } else if (typeof data === 'object') {
    // Single resource object - use comprehensive ResourceValidator
    const resourceValidation = validateResourceObject(data, { context: 'data' })
    results.details.push(...resourceValidation.details)
    if (!resourceValidation.valid) {
      results.valid = false
      results.errors.push(...resourceValidation.errors)
    }
    if (resourceValidation.warnings) {
      results.warnings.push(...resourceValidation.warnings)
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

  // Validate each resource in included array using comprehensive ResourceValidator
  const collectionValidation = validateResourceCollection(included, { context: 'included' })
  results.details.push(...collectionValidation.details)
  if (!collectionValidation.valid) {
    results.valid = false
    results.errors.push(...collectionValidation.errors)
  }
  if (collectionValidation.warnings) {
    results.warnings.push(...collectionValidation.warnings)
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

  const linkKeys = Object.keys(links)
  let allLinksValid = true
  
  // Common pagination link names for document-level links
  const paginationLinks = ['first', 'last', 'prev', 'next', 'self', 'related']
  
  for (const linkName of linkKeys) {
    const linkValue = links[linkName]
    const context = `links.${linkName}`
    
    // Validate the link value (string, link object, or null)
    const linkValidation = validateDocumentLinkValue(linkValue, context, linkName)
    results.details.push(...linkValidation.details)
    if (!linkValidation.valid) {
      allLinksValid = false
      results.errors.push(...linkValidation.errors)
    }
  }

  if (allLinksValid) {
    const knownLinks = linkKeys.filter(key => paginationLinks.includes(key))
    const customLinks = linkKeys.filter(key => !paginationLinks.includes(key))
    
    let message = `Links object contains ${linkKeys.length} valid link(s)`
    if (knownLinks.length > 0) {
      message += ` (includes: ${knownLinks.join(', ')})`
    }
    if (customLinks.length > 0) {
      message += ` (custom links: ${customLinks.join(', ')})`
    }
    
    results.details.push({
      test: 'Links Member Structure',
      status: 'passed', 
      message
    })
  } else {
    results.valid = false
  }

  return results
}

/**
 * Validates a single document-level link value
 * @param {any} link - The link value to validate
 * @param {string} context - Context for error messages
 * @param {string} linkName - Name of the link being validated
 * @returns {Object} Validation result
 */
function validateDocumentLinkValue(link, context, linkName) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (link === null) {
    results.details.push({
      test: 'Document Link Value',
      status: 'passed',
      context,
      message: 'Link value is null (valid for indicating no link available)'
    })
    return results
  }

  if (typeof link === 'string') {
    if (link.length === 0) {
      results.valid = false
      results.errors.push({
        test: 'Document Link Value',
        context,
        message: 'Link string cannot be empty'
      })
    } else {
      // Validate URL format
      if (!isValidUrl(link)) {
        const urlError = getUrlValidationError(link)
        results.valid = false
        results.errors.push({
          test: 'Document Link URL Format',
          context,
          message: urlError || 'Document link URL format is invalid'
        })
      } else {
        results.details.push({
          test: 'Document Link Value',
          status: 'passed',
          context,
          message: `Document link "${linkName}" URL format is valid`
        })
      }
    }
  } else if (typeof link === 'object' && !Array.isArray(link)) {
    // Link object must have href member
    if (!Object.prototype.hasOwnProperty.call(link, 'href')) {
      results.valid = false
      results.errors.push({
        test: 'Document Link Object Structure',
        context,
        message: 'Document link object must have an "href" member'
      })
    } else if (typeof link.href !== 'string' || link.href.length === 0) {
      results.valid = false
      results.errors.push({
        test: 'Document Link Object Structure',
        context,
        message: 'Document link object "href" must be a non-empty string'
      })
    } else {
      // Validate href URL format
      if (!isValidUrl(link.href)) {
        const urlError = getUrlValidationError(link.href)
        results.valid = false
        results.errors.push({
          test: 'Document Link Object URL Format',
          context,
          message: urlError || 'Document link object "href" URL format is invalid'
        })
      } else {
        results.details.push({
          test: 'Document Link Object Structure',
          status: 'passed',
          context,
          message: `Document link "${linkName}" href URL format is valid`
        })
      }
    }

    // Validate optional meta member
    if (Object.prototype.hasOwnProperty.call(link, 'meta')) {
      if (typeof link.meta !== 'object' || link.meta === null || Array.isArray(link.meta)) {
        results.valid = false
        results.errors.push({
          test: 'Document Link Object Meta',
          context,
          message: 'Document link object "meta" must be an object'
        })
      } else {
        results.details.push({
          test: 'Document Link Object Meta',
          status: 'passed',
          context,
          message: `Document link "${linkName}" meta structure is valid`
        })
      }
    }

    // Check for additional members beyond href and meta
    const linkKeys = Object.keys(link)
    const allowedMembers = ['href', 'meta']
    const additionalMembers = linkKeys.filter(key => !allowedMembers.includes(key))
    
    if (additionalMembers.length > 0) {
      results.valid = false
      results.errors.push({
        test: 'Document Link Object Additional Members',
        context,
        message: `Document link object contains additional members not allowed: ${additionalMembers.join(', ')}. Only "href" and "meta" are allowed`
      })
    } else if (results.valid) {
      results.details.push({
        test: 'Document Link Object Structure',
        status: 'passed',
        context,
        message: `Document link "${linkName}" object structure is valid`
      })
    }
  } else {
    results.valid = false
    results.errors.push({
      test: 'Document Link Value',
      context,
      message: 'Document link must be a string, link object, or null'
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