/**
 * DocumentValidator.js
 * 
 * Validates JSON:API v1.1 top-level document structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/
 */

import { validateResourceObject, validateResourceCollection, validateMemberName } from './ResourceValidator.js'
import { validateErrorsMember } from './ErrorValidator.js'
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
    if (dataValidation.warnings) {
      results.warnings.push(...dataValidation.warnings)
    }
  }

  // Step 4b: Validate errors structure if present
  if (hasErrors) {
    const errorsValidation = validateErrorsMember(response.errors)
    results.details.push(...errorsValidation.details)
    if (!errorsValidation.valid) {
      results.valid = false
      results.errors.push(...errorsValidation.errors)
    }
    if (errorsValidation.warnings) {
      results.warnings.push(...errorsValidation.warnings)
    }
  }

  // Step 5: Validate optional included array and compound document rules
  const hasIncluded = Object.prototype.hasOwnProperty.call(response, 'included')
  
  if (hasIncluded) {
    // First validate that included is only present when data is present
    if (!hasData) {
      results.valid = false
      results.errors.push({
        test: 'Compound Document Structure',
        message: 'Included member must not be present without data member'
      })
    } else {
      results.details.push({
        test: 'Compound Document Structure',
        status: 'passed',
        message: 'Included member is properly paired with data member'
      })
    }
    
    // Validate the included member structure
    const includedValidation = validateIncludedMember(response.included)
    results.details.push(...includedValidation.details)
    if (!includedValidation.valid) {
      results.valid = false
      results.errors.push(...includedValidation.errors)
    }
    if (includedValidation.warnings) {
      results.warnings.push(...includedValidation.warnings)
    }
    
    // Validate compound document if both data and included are present and valid
    if (hasData && includedValidation.valid && results.valid) {
      const compoundValidation = validateCompoundDocument(response.data, response.included)
      results.details.push(...compoundValidation.details)
      if (!compoundValidation.valid) {
        results.valid = false
        results.errors.push(...compoundValidation.errors)
      }
      if (compoundValidation.warnings) {
        results.warnings.push(...compoundValidation.warnings)
      }
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

  // Step 7b: Validate optional top-level meta object
  if (Object.prototype.hasOwnProperty.call(response, 'meta')) {
    const metaValidation = validateTopLevelMetaMember(response.meta)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
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
 * Validates compound document rules - linkage, duplicates, and circular references
 * @param {any} data - The primary data (resource object, array of resources, or null)
 * @param {Array} included - The included resources array
 * @returns {Object} Validation result
 */
function validateCompoundDocument(data, included) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Skip most validation if data is null, but check for orphaned included resources
  if (data === null) {
    if (included.length > 0) {
      results.valid = false
      results.errors.push({
        test: 'Resource Linkage',
        message: `All ${included.length} included resources are orphaned when data is null`
      })
    } else {
      results.details.push({
        test: 'Compound Document Validation',
        status: 'passed',
        message: 'No compound document validation needed (data is null and included is empty)'
      })
    }
    return results
  }

  // Skip validation if included is empty
  if (!Array.isArray(included) || included.length === 0) {
    results.details.push({
      test: 'Compound Document Validation',
      status: 'passed',
      message: 'No compound document validation needed (included is empty)'
    })
    return results
  }

  // Step 1: Check for duplicate resources in included array
  const duplicateValidation = validateNoDuplicatesInIncluded(included)
  results.details.push(...duplicateValidation.details)
  if (!duplicateValidation.valid) {
    results.valid = false
    results.errors.push(...duplicateValidation.errors)
  }

  // Step 2: Validate that all included resources are referenced from primary data
  const linkageValidation = validateResourceLinkage(data, included)
  results.details.push(...linkageValidation.details)
  if (!linkageValidation.valid) {
    results.valid = false
    results.errors.push(...linkageValidation.errors)
  }
  if (linkageValidation.warnings) {
    results.warnings.push(...linkageValidation.warnings)
  }

  // Step 3: Check for circular references
  const circularRefValidation = validateNoCircularReferences(data, included)
  results.details.push(...circularRefValidation.details)
  if (!circularRefValidation.valid) {
    results.valid = false
    results.errors.push(...circularRefValidation.errors)
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
        // Validate meta member names follow JSON:API naming conventions
        const metaKeys = Object.keys(link.meta)
        for (const metaName of metaKeys) {
          const nameValidation = validateMemberName(metaName, `${context}.meta.${metaName}`)
          results.details.push(...nameValidation.details)
          if (!nameValidation.valid) {
            results.valid = false
            results.errors.push(...nameValidation.errors)
          }
        }
        
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
      test: 'JSON:API Version Object Structure',
      message: 'JSON:API member must be an object'
    })
    return results
  }

  // Check for additional members beyond allowed ones
  const allowedMembers = ['version', 'meta']
  const presentMembers = Object.keys(jsonapi)
  const additionalMembers = presentMembers.filter(member => !allowedMembers.includes(member))

  if (additionalMembers.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Version Object Additional Members',
      message: `JSON:API object contains additional members not allowed by spec: ${additionalMembers.join(', ')}. Only "version" and "meta" are allowed`
    })
  } else {
    results.details.push({
      test: 'JSON:API Version Object Additional Members',
      status: 'passed',
      message: 'JSON:API object contains only allowed members'
    })
  }

  // Check for version if present
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'version')) {
    if (typeof jsonapi.version !== 'string') {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Version String Format',
        message: 'JSON:API version must be a string'
      })
    } else {
      // Validate supported version values
      const supportedVersions = ['1.0', '1.1']
      if (!supportedVersions.includes(jsonapi.version)) {
        results.valid = false
        results.errors.push({
          test: 'JSON:API Version Value',
          message: `JSON:API version "${jsonapi.version}" is not supported. Supported versions: ${supportedVersions.join(', ')}`
        })
      } else {
        results.details.push({
          test: 'JSON:API Version Value',
          status: 'passed',
          message: `JSON:API version "${jsonapi.version}" is supported`
        })
      }
    }
  } else {
    results.details.push({
      test: 'JSON:API Version Value',
      status: 'passed',
      message: 'JSON:API object present (version not specified - optional per spec)'
    })
  }

  // Validate optional meta object
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'meta')) {
    const metaValidation = validateJsonApiMetaMember(jsonapi.meta)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
    }
  }

  return results
}

/**
 * Validates the meta member within jsonapi object
 * @param {any} meta - The meta value to validate
 * @returns {Object} Validation result
 */
function validateJsonApiMetaMember(meta) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Meta Member',
      message: 'JSON:API "meta" must be an object'
    })
    return results
  }

  const metaKeys = Object.keys(meta)
  
  // Validate each meta member name follows JSON:API naming conventions
  for (const metaName of metaKeys) {
    const nameValidation = validateMemberName(metaName, `jsonapi.meta.${metaName}`)
    results.details.push(...nameValidation.details)
    if (!nameValidation.valid) {
      results.valid = false
      results.errors.push(...nameValidation.errors)
    }
  }

  results.details.push({
    test: 'JSON:API Meta Member',
    status: 'passed',
    message: `JSON:API meta object contains ${metaKeys.length} metadata field(s)`
  })

  return results
}

/**
 * Validates the top-level meta member
 * @param {any} meta - The meta value to validate
 * @returns {Object} Validation result
 */
function validateTopLevelMetaMember(meta) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    results.valid = false
    results.errors.push({
      test: 'Top-Level Meta Member',
      message: 'Top-level "meta" must be an object'
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
    test: 'Top-Level Meta Member',
    status: 'passed',
    message: `Top-level meta object contains ${metaKeys.length} metadata field(s)`
  })

  return results
}

/**
 * Validates that there are no duplicate resources in the included array
 * @param {Array} included - The included resources array
 * @returns {Object} Validation result
 */
function validateNoDuplicatesInIncluded(included) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  const seenResources = new Set()
  const duplicates = []

  for (let i = 0; i < included.length; i++) {
    const resource = included[i]
    if (resource && typeof resource === 'object' && resource.type && resource.id) {
      const resourceKey = `${resource.type}:${resource.id}`
      if (seenResources.has(resourceKey)) {
        duplicates.push({ type: resource.type, id: resource.id, index: i })
      } else {
        seenResources.add(resourceKey)
      }
    }
  }

  if (duplicates.length > 0) {
    results.valid = false
    duplicates.forEach(dup => {
      results.errors.push({
        test: 'Included Resource Duplicates',
        message: `Duplicate resource found in included array: ${dup.type}:${dup.id} at index ${dup.index}`
      })
    })
  } else {
    results.details.push({
      test: 'Included Resource Duplicates',
      status: 'passed',
      message: `No duplicate resources found in included array (${included.length} unique resources)`
    })
  }

  return results
}

/**
 * Validates that all included resources are referenced from the primary data
 * @param {any} data - The primary data (resource object, array, or null)
 * @param {Array} included - The included resources array
 * @returns {Object} Validation result
 */
function validateResourceLinkage(data, included) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Get all resource identifiers referenced from primary data
  const referencedResources = extractReferencedResources(data)
  
  // Create set of included resource identifiers
  const includedResources = new Set()
  included.forEach(resource => {
    if (resource && typeof resource === 'object' && resource.type && resource.id) {
      includedResources.add(`${resource.type}:${resource.id}`)
    }
  })

  // Find orphaned resources (included but not referenced)
  const orphanedResources = []
  includedResources.forEach(resourceKey => {
    if (!referencedResources.has(resourceKey)) {
      const [type, id] = resourceKey.split(':')
      orphanedResources.push({ type, id })
    }
  })

  // Find missing resources (referenced but not included)
  const missingResources = []
  referencedResources.forEach(resourceKey => {
    if (!includedResources.has(resourceKey)) {
      const [type, id] = resourceKey.split(':')
      missingResources.push({ type, id })
    }
  })

  // Report orphaned resources as errors
  if (orphanedResources.length > 0) {
    results.valid = false
    orphanedResources.forEach(resource => {
      results.errors.push({
        test: 'Resource Linkage',
        message: `Orphaned included resource: ${resource.type}:${resource.id} is not referenced from primary data`
      })
    })
  }

  // Report missing resources as warnings (they might be intentionally omitted)
  if (missingResources.length > 0) {
    missingResources.forEach(resource => {
      results.warnings.push({
        test: 'Resource Linkage',
        message: `Referenced resource ${resource.type}:${resource.id} is not included in compound document`
      })
    })
  }

  if (orphanedResources.length === 0 && missingResources.length === 0) {
    results.details.push({
      test: 'Resource Linkage',
      status: 'passed',
      message: `Perfect linkage: all ${included.length} included resources are referenced from primary data`
    })
  } else if (orphanedResources.length === 0) {
    results.details.push({
      test: 'Resource Linkage',
      status: 'passed',
      message: `No orphaned resources found (${missingResources.length} referenced resources not included)`
    })
  }

  return results
}

/**
 * Extracts all resource identifiers referenced from relationships in primary data
 * @param {any} data - The primary data (resource object, array, or null)
 * @returns {Set} Set of resource identifiers in format "type:id"
 */
function extractReferencedResources(data) {
  const references = new Set()

  if (data === null) {
    return references
  }

  const resources = Array.isArray(data) ? data : [data]
  
  resources.forEach(resource => {
    if (resource && typeof resource === 'object' && resource.relationships) {
      Object.values(resource.relationships).forEach(relationship => {
        if (relationship && relationship.data) {
          const relData = Array.isArray(relationship.data) ? relationship.data : [relationship.data]
          relData.forEach(rel => {
            if (rel && rel.type && rel.id) {
              references.add(`${rel.type}:${rel.id}`)
            }
          })
        }
      })
    }
  })

  return references
}

/**
 * Validates that there are no circular references in compound documents
 * Note: In JSON:API, bidirectional relationships are normal and allowed.
 * This validation primarily serves as informational analysis rather than strict validation.
 * @param {any} data - The primary data
 * @param {Array} included - The included resources array
 * @returns {Object} Validation result
 */
function validateNoCircularReferences(data, included) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  // Create a map of all resources (primary + included) for reference lookup
  const allResources = new Map()
  
  // Add primary data resources
  if (data !== null) {
    const primaryResources = Array.isArray(data) ? data : [data]
    primaryResources.forEach(resource => {
      if (resource && typeof resource === 'object' && resource.type && resource.id) {
        allResources.set(`${resource.type}:${resource.id}`, resource)
      }
    })
  }
  
  // Add included resources
  included.forEach(resource => {
    if (resource && typeof resource === 'object' && resource.type && resource.id) {
      allResources.set(`${resource.type}:${resource.id}`, resource)
    }
  })

  // Analyze relationship structure for informational purposes
  const relationshipCount = analyzeRelationshipStructure(allResources)
  
  results.details.push({
    test: 'Circular References',
    status: 'passed',
    message: `Relationship structure analyzed: ${allResources.size} resources with ${relationshipCount.total} relationships (${relationshipCount.bidirectional} bidirectional). Bidirectional relationships are normal in JSON:API.`
  })

  return results
}

/**
 * Analyzes relationship structure in compound documents for informational purposes
 * @param {Map} allResources - Map of all resources (primary + included)
 * @returns {Object} Analysis results with counts
 */
function analyzeRelationshipStructure(allResources) {
  let totalRelationships = 0
  let bidirectionalCount = 0
  const relationships = new Set()
  
  for (const [resourceKey, resource] of allResources) {
    if (resource.relationships) {
      Object.values(resource.relationships).forEach(relationship => {
        if (relationship && relationship.data) {
          const relData = Array.isArray(relationship.data) ? relationship.data : [relationship.data]
          relData.forEach(rel => {
            if (rel && rel.type && rel.id) {
              const relKey = `${rel.type}:${rel.id}`
              const relationshipPair = `${resourceKey}->${relKey}`
              const reverseRelationshipPair = `${relKey}->${resourceKey}`
              
              relationships.add(relationshipPair)
              totalRelationships++
              
              // Check if reverse relationship exists
              if (relationships.has(reverseRelationshipPair)) {
                bidirectionalCount++
              }
            }
          })
        }
      })
    }
  }
  
  return {
    total: totalRelationships,
    bidirectional: Math.floor(bidirectionalCount / 2) // Each bidirectional pair is counted twice
  }
}