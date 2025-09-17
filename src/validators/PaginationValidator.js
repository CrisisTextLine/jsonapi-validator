/**
 * PaginationValidator.js
 * 
 * Validates JSON:API v1.1 pagination implementation compliance.
 * Based on specification: https://jsonapi.org/format/1.1/#fetching-pagination
 */

/**
 * Validates pagination implementation in a JSON:API response
 * @param {Object} response - The API response to validate
 * @param {string} originalUrl - The original request URL
 * @param {Object} requestParams - The original query parameters
 * @returns {Object} Validation result with success/failure and details
 */
export function validatePagination(response, originalUrl, requestParams = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!response) {
    results.details.push({
      test: 'Pagination Validation',
      status: 'skipped',
      message: 'No response provided for pagination validation'
    })
    return results
  }

  // Check if this is a collection response that could have pagination
  if (!response.data || !Array.isArray(response.data)) {
    results.details.push({
      test: 'Pagination Applicability',
      status: 'skipped',
      message: 'Response is not a collection, pagination validation not applicable'
    })
    return results
  }

  const links = response.links || {}
  const meta = response.meta || {}
  
  // Check for pagination links presence
  const paginationLinksResult = validatePaginationLinksPresence(links, requestParams)
  mergeValidationResults(results, paginationLinksResult)

  // If pagination links are present, validate their structure and correctness
  const paginationLinks = ['first', 'last', 'prev', 'next']
  const presentLinks = paginationLinks.filter(linkName => links[linkName])
  
  if (presentLinks.length > 0) {
    // Validate pagination link URLs
    const linkUrlResult = validatePaginationLinkUrls(links, originalUrl)
    mergeValidationResults(results, linkUrlResult)

    // Validate query parameter preservation
    const queryParamResult = validateQueryParameterPreservation(links, requestParams)
    mergeValidationResults(results, queryParamResult)

    // Validate pagination boundaries
    const boundaryResult = validatePaginationBoundaries(links, requestParams, response)
    mergeValidationResults(results, boundaryResult)

    // Validate pagination consistency
    const consistencyResult = validatePaginationConsistency(links, meta, response.data, requestParams)
    mergeValidationResults(results, consistencyResult)
  }

  // Validate pagination meta information
  const metaResult = validatePaginationMeta(meta, response.data, links)
  mergeValidationResults(results, metaResult)

  // Check for cursor-based pagination
  const cursorResult = validateCursorPagination(requestParams, links, meta)
  mergeValidationResults(results, cursorResult)

  return results
}

/**
 * Validates the presence and basic structure of pagination links
 * @param {Object} links - Links object from response
 * @param {Object} requestParams - Original request parameters
 * @returns {Object} Validation result
 */
function validatePaginationLinksPresence(links, requestParams) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const paginationLinks = ['first', 'last', 'prev', 'next']
  const presentLinks = paginationLinks.filter(linkName => links[linkName])
  const pageParams = Object.keys(requestParams).filter(key => key.startsWith('page['))

  if (presentLinks.length === 0) {
    if (pageParams.length > 0) {
      results.warnings.push({
        test: 'Pagination Links Presence',
        message: 'Page parameters provided but no pagination links found in response'
      })
    } else {
      results.details.push({
        test: 'Pagination Links Presence',
        status: 'passed',
        message: 'No pagination parameters or links (valid for single-page collections)'
      })
    }
  } else {
    results.details.push({
      test: 'Pagination Links Presence',
      status: 'passed',
      message: `Found pagination links: ${presentLinks.join(', ')}`
    })
  }

  return results
}

/**
 * Validates that pagination link URLs are properly formed
 * @param {Object} links - Links object from response
 * @param {string} originalUrl - The original request URL
 * @returns {Object} Validation result
 */
function validatePaginationLinkUrls(links, originalUrl) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const paginationLinks = ['first', 'last', 'prev', 'next', 'self']
  
  for (const linkName of paginationLinks) {
    if (!links[linkName]) continue

    const linkUrl = links[linkName]
    
    // Validate URL format
    try {
      new URL(linkUrl)
      results.details.push({
        test: 'Pagination Link URL Format',
        status: 'passed',
        message: `${linkName} link is a valid URL: ${linkUrl}`
      })
    } catch {
      results.valid = false
      results.errors.push({
        test: 'Pagination Link URL Format',
        message: `${linkName} link is not a valid URL: "${linkUrl}"`
      })
      continue
    }

    // Validate that pagination links use the same base URL as the original request
    if (originalUrl) {
      try {
        const originalUrlObj = new URL(originalUrl)
        const linkUrlObj = new URL(linkUrl)
        
        const originalBase = `${originalUrlObj.protocol}//${originalUrlObj.host}${originalUrlObj.pathname}`
        const linkBase = `${linkUrlObj.protocol}//${linkUrlObj.host}${linkUrlObj.pathname}`
        
        if (originalBase !== linkBase) {
          results.warnings.push({
            test: 'Pagination Link Base URL',
            message: `${linkName} link uses different base URL: expected "${originalBase}", got "${linkBase}"`
          })
        }
      } catch {
        // Already handled URL parsing errors above
      }
    }
  }

  return results
}

/**
 * Validates that original query parameters are preserved in pagination links
 * @param {Object} links - Links object from response
 * @param {Object} requestParams - Original request parameters
 * @returns {Object} Validation result
 */
function validateQueryParameterPreservation(links, requestParams) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const paginationLinks = ['first', 'last', 'prev', 'next']
  
  // Get non-page parameters from original request
  const nonPageParams = Object.keys(requestParams).filter(key => !key.startsWith('page['))
  
  if (nonPageParams.length === 0) {
    results.details.push({
      test: 'Query Parameter Preservation',
      status: 'passed',
      message: 'No non-pagination parameters to preserve'
    })
    return results
  }

  for (const linkName of paginationLinks) {
    if (!links[linkName]) continue

    try {
      const linkUrl = new URL(links[linkName])
      const linkParams = Object.fromEntries(linkUrl.searchParams.entries())

      // Check that all non-page parameters are preserved
      const missingParams = []
      const modifiedParams = []
      
      for (const paramName of nonPageParams) {
        if (!(paramName in linkParams)) {
          missingParams.push(paramName)
        } else if (linkParams[paramName] !== requestParams[paramName]) {
          modifiedParams.push({
            name: paramName,
            original: requestParams[paramName],
            inLink: linkParams[paramName]
          })
        }
      }

      if (missingParams.length > 0) {
        results.valid = false
        results.errors.push({
          test: 'Query Parameter Preservation',
          message: `${linkName} link missing query parameters: ${missingParams.join(', ')}`
        })
      }

      if (modifiedParams.length > 0) {
        results.warnings.push({
          test: 'Query Parameter Preservation',
          message: `${linkName} link has modified parameters: ${modifiedParams.map(p => `${p.name}="${p.original}" -> "${p.inLink}"`).join(', ')}`
        })
      }

      if (missingParams.length === 0 && modifiedParams.length === 0) {
        results.details.push({
          test: 'Query Parameter Preservation',
          status: 'passed',
          message: `${linkName} link preserves all ${nonPageParams.length} non-pagination parameter(s)`
        })
      }

    } catch {
      // URL parsing error already handled in validatePaginationLinkUrls
    }
  }

  return results
}

/**
 * Validates pagination boundaries (first/last page behavior)
 * @param {Object} links - Links object from response
 * @param {Object} requestParams - Original request parameters
 * @param {Object} response - Full response object
 * @returns {Object} Validation result
 */
function validatePaginationBoundaries(links, requestParams, response) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const pageNumber = parseInt(requestParams['page[number]']) || 1
  const pageSize = parseInt(requestParams['page[size]']) || 10
  const dataLength = response.data?.length || 0
  
  // Check first page boundaries
  if (pageNumber === 1) {
    if (links.prev) {
      results.warnings.push({
        test: 'Pagination Boundaries',
        message: 'First page should not have a "prev" link'
      })
    } else {
      results.details.push({
        test: 'Pagination Boundaries',
        status: 'passed',
        message: 'First page correctly has no "prev" link'
      })
    }
  }

  // Check if we're potentially on the last page
  if (dataLength < pageSize && dataLength > 0) {
    if (links.next) {
      results.warnings.push({
        test: 'Pagination Boundaries',
        message: `Received ${dataLength} items (less than page size ${pageSize}) but "next" link is present - may indicate last page`
      })
    } else {
      results.details.push({
        test: 'Pagination Boundaries',
        status: 'passed',
        message: `Last page correctly has no "next" link (${dataLength} items < page size ${pageSize})`
      })
    }
  }

  // Validate that first and last links are always present when pagination is used
  const hasPaginationLinks = ['prev', 'next'].some(link => links[link])
  if (hasPaginationLinks) {
    if (!links.first) {
      results.warnings.push({
        test: 'Pagination Boundaries',
        message: 'Pagination links present but missing "first" link'
      })
    }
    if (!links.last) {
      results.warnings.push({
        test: 'Pagination Boundaries', 
        message: 'Pagination links present but missing "last" link'
      })
    }
    
    if (links.first && links.last) {
      results.details.push({
        test: 'Pagination Boundaries',
        status: 'passed',
        message: 'Both "first" and "last" links are present'
      })
    }
  }

  return results
}

/**
 * Validates pagination consistency across links, meta, and data
 * @param {Object} links - Links object from response
 * @param {Object} meta - Meta object from response
 * @param {Array} data - Data array from response
 * @param {Object} requestParams - Original request parameters
 * @returns {Object} Validation result
 */
function validatePaginationConsistency(links, meta, data, requestParams) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const pageSize = parseInt(requestParams['page[size]']) || 10
  const pageNumber = parseInt(requestParams['page[number]']) || 1
  
  // Validate data size consistency
  if (data.length > pageSize) {
    results.valid = false
    results.errors.push({
      test: 'Pagination Consistency',
      message: `Response contains ${data.length} items, exceeds page size of ${pageSize}`
    })
  } else if (data.length <= pageSize) {
    results.details.push({
      test: 'Pagination Consistency',
      status: 'passed',
      message: `Response contains ${data.length} items, within page size of ${pageSize}`
    })
  }

  // If meta contains page information, validate consistency
  if (meta.page) {
    if (meta.page.number && meta.page.number !== pageNumber) {
      results.valid = false
      results.errors.push({
        test: 'Pagination Consistency',
        message: `Meta page number ${meta.page.number} does not match requested page number ${pageNumber}`
      })
    }
    
    if (meta.page.size && meta.page.size !== pageSize) {
      results.valid = false
      results.errors.push({
        test: 'Pagination Consistency',
        message: `Meta page size ${meta.page.size} does not match requested page size ${pageSize}`
      })
    }

    if (meta.page.number === pageNumber && meta.page.size === pageSize) {
      results.details.push({
        test: 'Pagination Consistency',
        status: 'passed',
        message: 'Meta page information matches request parameters'
      })
    }
  }

  // Validate link consistency with current page
  if (links.self) {
    try {
      const selfUrl = new URL(links.self)
      const selfParams = Object.fromEntries(selfUrl.searchParams.entries())
      
      const selfPageNumber = parseInt(selfParams['page[number]']) || 1
      const selfPageSize = parseInt(selfParams['page[size]']) || 10
      
      if (selfPageNumber !== pageNumber || selfPageSize !== pageSize) {
        results.warnings.push({
          test: 'Pagination Consistency',
          message: `Self link parameters (page[number]=${selfPageNumber}, page[size]=${selfPageSize}) don't match request (page[number]=${pageNumber}, page[size]=${pageSize})`
        })
      }
    } catch {
      // URL parsing error already handled elsewhere
    }
  }

  return results
}

/**
 * Validates pagination-related meta information
 * @param {Object} meta - Meta object from response
 * @param {Array} data - Data array from response
 * @param {Object} links - Links object from response
 * @returns {Object} Validation result
 */
function validatePaginationMeta(meta, data, links) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const hasPaginationLinks = ['first', 'last', 'prev', 'next'].some(link => links[link])
  
  if (!hasPaginationLinks) {
    results.details.push({
      test: 'Pagination Meta',
      status: 'skipped',
      message: 'No pagination links present, meta validation not applicable'
    })
    return results
  }

  // Check for common pagination meta fields
  const commonMetaFields = ['totalResources', 'total', 'totalCount', 'count']
  const totalField = commonMetaFields.find(field => meta[field] !== undefined)
  
  if (totalField) {
    const totalValue = meta[totalField]
    if (typeof totalValue === 'number' && totalValue >= 0) {
      results.details.push({
        test: 'Pagination Meta',
        status: 'passed',
        message: `Found total count in meta.${totalField}: ${totalValue}`
      })
    } else {
      results.warnings.push({
        test: 'Pagination Meta',
        message: `meta.${totalField} should be a non-negative number, got: ${typeof totalValue} ${totalValue}`
      })
    }
  } else {
    results.warnings.push({
      test: 'Pagination Meta',
      message: 'No total count found in meta (recommended for paginated responses)'
    })
  }

  // Check for page-specific meta information
  if (meta.page) {
    const pageMetaFields = ['number', 'size', 'total', 'totalPages']
    const presentPageFields = pageMetaFields.filter(field => meta.page[field] !== undefined)
    
    if (presentPageFields.length > 0) {
      results.details.push({
        test: 'Pagination Meta',
        status: 'passed',
        message: `Found page meta information: ${presentPageFields.join(', ')}`
      })
    }

    // Validate page total if present
    if (meta.page.total) {
      const pageTotal = meta.page.total
      if (typeof pageTotal === 'number' && pageTotal >= 1) {
        results.details.push({
          test: 'Pagination Meta',
          status: 'passed',
          message: `Page total is valid: ${pageTotal} pages`
        })
      } else {
        results.warnings.push({
          test: 'Pagination Meta',
          message: `meta.page.total should be a positive number, got: ${typeof pageTotal} ${pageTotal}`
        })
      }
    }
  }

  return results
}

/**
 * Validates cursor-based pagination if present
 * @param {Object} requestParams - Original request parameters
 * @param {Object} links - Links object from response
 * @param {Object} meta - Meta object from response
 * @returns {Object} Validation result
 */
function validateCursorPagination(requestParams, links, meta) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Check for cursor-based pagination parameters
  const cursorParams = Object.keys(requestParams).filter(key => 
    key.startsWith('page[') && (key.includes('cursor') || key.includes('before') || key.includes('after'))
  )

  if (cursorParams.length === 0) {
    results.details.push({
      test: 'Cursor Pagination',
      status: 'skipped',
      message: 'No cursor-based pagination parameters detected'
    })
    return results
  }

  results.details.push({
    test: 'Cursor Pagination',
    status: 'passed',
    message: `Cursor-based pagination detected with parameters: ${cursorParams.join(', ')}`
  })

  // For cursor pagination, validate that links contain appropriate cursor values
  const paginationLinks = ['prev', 'next', 'first', 'last']
  for (const linkName of paginationLinks) {
    if (!links[linkName]) continue

    try {
      const linkUrl = new URL(links[linkName])
      const linkParams = Object.fromEntries(linkUrl.searchParams.entries())
      
      const linkCursorParams = Object.keys(linkParams).filter(key => 
        key.startsWith('page[') && (key.includes('cursor') || key.includes('before') || key.includes('after'))
      )

      if (linkCursorParams.length > 0) {
        results.details.push({
          test: 'Cursor Pagination',
          status: 'passed',
          message: `${linkName} link includes cursor parameters: ${linkCursorParams.join(', ')}`
        })
      } else if (linkName === 'prev' || linkName === 'next') {
        results.warnings.push({
          test: 'Cursor Pagination',
          message: `${linkName} link missing cursor parameters for cursor-based pagination`
        })
      }
    } catch {
      // URL parsing error already handled elsewhere
    }
  }

  // Check for cursor information in meta
  if (meta.cursors || meta.pagination) {
    results.details.push({
      test: 'Cursor Pagination',
      status: 'passed',
      message: 'Response includes cursor information in meta'
    })
  }

  return results
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