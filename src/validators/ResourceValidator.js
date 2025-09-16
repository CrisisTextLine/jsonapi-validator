/**
 * ResourceValidator.js
 * 
 * Validates JSON:API v1.1 resource object structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/#document-resource-objects
 */

/**
 * Validates a single resource object for JSON:API compliance
 * @param {any} resource - The resource object to validate
 * @param {Object} options - Validation options
 * @param {boolean} options.allowMissingId - Whether to allow resources without id (client-generated)
 * @param {string} options.context - Context for error messages (e.g., "data[0]", "included[1]")
 * @returns {Object} Validation result with success/failure and details
 */
export function validateResourceObject(resource, options = {}) {
  const { allowMissingId = false, context = 'resource' } = options
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  // Step 1: Basic structure validation
  if (resource === null || resource === undefined) {
    results.valid = false
    results.errors.push({
      test: 'Resource Object Structure',
      context,
      message: 'Resource cannot be null or undefined'
    })
    return results
  }

  if (typeof resource !== 'object' || Array.isArray(resource)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Object Structure',
      context,
      message: 'Resource must be an object'
    })
    return results
  }

  // Step 2: Validate required 'type' member
  const typeValidation = validateTypeMember(resource.type, context)
  results.details.push(...typeValidation.details)
  if (!typeValidation.valid) {
    results.valid = false
    results.errors.push(...typeValidation.errors)
  }

  // Step 3: Validate required 'id' member (unless allowMissingId is true)
  const idValidation = validateIdMember(resource.id, context, allowMissingId)
  results.details.push(...idValidation.details)
  if (!idValidation.valid) {
    results.valid = false
    results.errors.push(...idValidation.errors)
  }
  if (idValidation.warnings) {
    results.warnings.push(...idValidation.warnings)
  }

  // Step 4: Validate optional 'attributes' member
  if (Object.prototype.hasOwnProperty.call(resource, 'attributes')) {
    const attributesValidation = validateAttributesMember(resource.attributes, context)
    results.details.push(...attributesValidation.details)
    if (!attributesValidation.valid) {
      results.valid = false
      results.errors.push(...attributesValidation.errors)
    }
    if (attributesValidation.warnings) {
      results.warnings.push(...attributesValidation.warnings)
    }
  }

  // Step 5: Validate optional 'relationships' member
  if (Object.prototype.hasOwnProperty.call(resource, 'relationships')) {
    const relationshipsValidation = validateRelationshipsMember(resource.relationships, context)
    results.details.push(...relationshipsValidation.details)
    if (!relationshipsValidation.valid) {
      results.valid = false
      results.errors.push(...relationshipsValidation.errors)
    }
  }

  // Step 6: Validate optional 'links' member
  if (Object.prototype.hasOwnProperty.call(resource, 'links')) {
    const linksValidation = validateResourceLinksMember(resource.links, context)
    results.details.push(...linksValidation.details)
    if (!linksValidation.valid) {
      results.valid = false
      results.errors.push(...linksValidation.errors)
    }
  }

  // Step 7: Validate optional 'meta' member
  if (Object.prototype.hasOwnProperty.call(resource, 'meta')) {
    const metaValidation = validateMetaMember(resource.meta, context)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
    }
  }

  // Step 8: Check for reserved/forbidden member names
  const memberValidation = validateMemberNames(resource, context)
  results.details.push(...memberValidation.details)
  if (!memberValidation.valid) {
    results.valid = false
    results.errors.push(...memberValidation.errors)
  }
  if (memberValidation.warnings) {
    results.warnings.push(...memberValidation.warnings)
  }

  return results
}

/**
 * Validates the 'type' member of a resource object
 * @param {any} type - The type value to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateTypeMember(type, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (type === undefined) {
    results.valid = false
    results.errors.push({
      test: 'Resource Type Member',
      context,
      message: 'Resource must have a "type" member'
    })
    return results
  }

  if (typeof type !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'Resource Type Member',
      context,
      message: 'Resource "type" must be a string'
    })
    return results
  }

  if (type.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource Type Member',
      context,
      message: 'Resource "type" cannot be an empty string'
    })
    return results
  }

  // Validate type naming conventions (should follow recommended patterns)
  // JSON:API recommends using plural, kebab-case names
  const typePattern = /^[a-z][a-z0-9-]*[a-z0-9]$|^[a-z]$/
  if (!typePattern.test(type)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Type Naming Convention',
      context,
      message: `Resource "type" "${type}" should follow naming conventions (lowercase, kebab-case, typically plural)`
    })
  } else {
    results.details.push({
      test: 'Resource Type Member',
      status: 'passed',
      context,
      message: `Resource type "${type}" is valid`
    })
  }

  return results
}

/**
 * Validates the 'id' member of a resource object
 * @param {any} id - The id value to validate
 * @param {string} context - Context for error messages
 * @param {boolean} allowMissingId - Whether missing id is allowed
 * @returns {Object} Validation result
 */
function validateIdMember(id, context, allowMissingId) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (id === undefined) {
    if (!allowMissingId) {
      results.valid = false
      results.errors.push({
        test: 'Resource ID Member',
        context,
        message: 'Resource must have an "id" member'
      })
    } else {
      results.warnings.push({
        test: 'Resource ID Member',
        context,
        message: 'Resource is missing "id" member (acceptable for client-generated resources)'
      })
    }
    return results
  }

  if (typeof id !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'Resource ID Member',
      context,
      message: 'Resource "id" must be a string'
    })
    return results
  }

  if (id.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource ID Member',
      context,
      message: 'Resource "id" cannot be an empty string'
    })
    return results
  }

  results.details.push({
    test: 'Resource ID Member',
    status: 'passed',
    context,
    message: `Resource id "${id}" is valid`
  })

  return results
}

/**
 * Validates the 'attributes' member of a resource object
 * @param {any} attributes - The attributes object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateAttributesMember(attributes, context) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (typeof attributes !== 'object' || attributes === null || Array.isArray(attributes)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Attributes Member',
      context,
      message: 'Resource "attributes" must be an object'
    })
    return results
  }

  const attributeKeys = Object.keys(attributes)
  
  if (attributeKeys.length === 0) {
    results.warnings.push({
      test: 'Resource Attributes Member',
      context,
      message: 'Resource "attributes" object is empty - consider omitting if no attributes'
    })
  }

  // Check for forbidden members (type, id) in attributes
  const forbiddenMembers = ['type', 'id']
  const foundForbidden = attributeKeys.filter(key => forbiddenMembers.includes(key))
  
  if (foundForbidden.length > 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource Attributes Forbidden Members',
      context,
      message: `Attributes object contains forbidden members: ${foundForbidden.join(', ')}. The "type" and "id" members are reserved for resource object level`
    })
  }

  // Check for relationship-like structures in attributes (common mistake)
  for (const key of attributeKeys) {
    const value = attributes[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      if (Object.prototype.hasOwnProperty.call(value, 'data') || 
          Object.prototype.hasOwnProperty.call(value, 'links') ||
          Object.prototype.hasOwnProperty.call(value, 'meta')) {
        results.valid = false
        results.errors.push({
          test: 'Resource Attributes Relationship Structure',
          context,
          message: `Attribute "${key}" appears to be a relationship object with "data", "links", or "meta" members. Relationships should be in the "relationships" member, not "attributes"`
        })
      }
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Resource Attributes Member',
      status: 'passed',
      context,
      message: `Resource attributes object contains ${attributeKeys.length} valid attribute(s)`
    })
  }

  return results
}

/**
 * Validates the 'relationships' member of a resource object
 * @param {any} relationships - The relationships object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateRelationshipsMember(relationships, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof relationships !== 'object' || relationships === null || Array.isArray(relationships)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Relationships Member',
      context,
      message: 'Resource "relationships" must be an object'
    })
    return results
  }

  const relationshipKeys = Object.keys(relationships)
  
  if (relationshipKeys.length === 0) {
    results.errors.push({
      test: 'Resource Relationships Member',
      context,
      message: 'Resource "relationships" object is empty - consider omitting if no relationships'
    })
    return results
  }

  // Validate each relationship object and its name
  let allRelationshipsValid = true
  for (const relationshipName of relationshipKeys) {
    // Validate relationship name follows JSON:API member naming rules
    const nameValidation = validateMemberName(relationshipName, `${context}.relationships.${relationshipName}`)
    results.details.push(...nameValidation.details)
    if (!nameValidation.valid) {
      allRelationshipsValid = false
      results.errors.push(...nameValidation.errors)
    }

    const relationship = relationships[relationshipName]
    const relationshipValidation = validateRelationshipObject(relationship, `${context}.relationships.${relationshipName}`)
    
    results.details.push(...relationshipValidation.details)
    if (!relationshipValidation.valid) {
      allRelationshipsValid = false
      results.errors.push(...relationshipValidation.errors)
    }
  }

  if (allRelationshipsValid) {
    results.valid = true
    results.details.push({
      test: 'Resource Relationships Member',
      status: 'passed',
      context,
      message: `Resource relationships object contains ${relationshipKeys.length} valid relationship(s)`
    })
  } else {
    results.valid = false
  }

  return results
}

/**
 * Validates a single relationship object
 * @param {any} relationship - The relationship object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateRelationshipObject(relationship, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof relationship !== 'object' || relationship === null || Array.isArray(relationship)) {
    results.valid = false
    results.errors.push({
      test: 'Relationship Object Structure',
      context,
      message: 'Relationship must be an object'
    })
    return results
  }

  // A relationship object must contain at least one of: data, links, meta
  const hasData = Object.prototype.hasOwnProperty.call(relationship, 'data')
  const hasLinks = Object.prototype.hasOwnProperty.call(relationship, 'links')
  const hasMeta = Object.prototype.hasOwnProperty.call(relationship, 'meta')

  if (!hasData && !hasLinks && !hasMeta) {
    results.valid = false
    results.errors.push({
      test: 'Relationship Object Structure',
      context,
      message: 'Relationship object must contain at least one of: "data", "links", or "meta"'
    })
    return results
  }

  // Validate data member if present
  if (hasData) {
    const dataValidation = validateRelationshipData(relationship.data, context)
    results.details.push(...dataValidation.details)
    if (!dataValidation.valid) {
      results.valid = false
      results.errors.push(...dataValidation.errors)
    }
  }

  // Validate links member if present
  if (hasLinks) {
    const linksValidation = validateRelationshipLinks(relationship.links, context)
    results.details.push(...linksValidation.details)
    if (!linksValidation.valid) {
      results.valid = false
      results.errors.push(...linksValidation.errors)
    }
  }

  // Validate meta member if present
  if (hasMeta) {
    if (typeof relationship.meta !== 'object' || relationship.meta === null) {
      results.valid = false
      results.errors.push({
        test: 'Relationship Meta Structure',
        context,
        message: 'Relationship "meta" must be an object'
      })
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Relationship Object Structure',
      status: 'passed',
      context,
      message: 'Relationship object structure is valid'
    })
  }

  return results
}

/**
 * Validates relationship data (resource identifiers)
 * @param {any} data - The relationship data to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateRelationshipData(data, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  // data can be null, a resource identifier object, or array of resource identifier objects
  if (data === null) {
    results.details.push({
      test: 'Relationship Data Structure',
      status: 'passed',
      context,
      message: 'Relationship data is null (valid for empty to-one relationship)'
    })
    return results
  }

  if (Array.isArray(data)) {
    // Array of resource identifier objects (to-many relationship)
    for (let i = 0; i < data.length; i++) {
      const identifier = data[i]
      const identifierValidation = validateResourceIdentifier(identifier, `${context}.data[${i}]`)
      results.details.push(...identifierValidation.details)
      if (!identifierValidation.valid) {
        results.valid = false
        results.errors.push(...identifierValidation.errors)
      }
    }
    
    if (results.valid) {
      results.details.push({
        test: 'Relationship Data Structure',
        status: 'passed',
        context,
        message: `Relationship data contains ${data.length} valid resource identifier(s)`
      })
    }
  } else {
    // Single resource identifier object (to-one relationship)
    const identifierValidation = validateResourceIdentifier(data, `${context}.data`)
    results.details.push(...identifierValidation.details)
    if (!identifierValidation.valid) {
      results.valid = false
      results.errors.push(...identifierValidation.errors)
    }
  }

  return results
}

/**
 * Validates a resource identifier object
 * @param {any} identifier - The resource identifier to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateResourceIdentifier(identifier, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof identifier !== 'object' || identifier === null || Array.isArray(identifier)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier Structure',
      context,
      message: 'Resource identifier must be an object'
    })
    return results
  }

  // Resource identifier must have type and id
  if (!Object.prototype.hasOwnProperty.call(identifier, 'type')) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier Type',
      context,
      message: 'Resource identifier must have a "type" member'
    })
  } else if (typeof identifier.type !== 'string' || identifier.type.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier Type',
      context,
      message: 'Resource identifier "type" must be a non-empty string'
    })
  }

  if (!Object.prototype.hasOwnProperty.call(identifier, 'id')) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier ID',
      context,
      message: 'Resource identifier must have an "id" member'
    })
  } else if (typeof identifier.id !== 'string' || identifier.id.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier ID',
      context,
      message: 'Resource identifier "id" must be a non-empty string'
    })
  }

  if (results.valid) {
    results.details.push({
      test: 'Resource Identifier Structure',
      status: 'passed',
      context,
      message: `Resource identifier (type: "${identifier.type}", id: "${identifier.id}") is valid`
    })
  }

  return results
}

/**
 * Validates relationship links object
 * @param {any} links - The links object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateRelationshipLinks(links, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof links !== 'object' || links === null) {
    results.valid = false
    results.errors.push({
      test: 'Relationship Links Structure',
      context,
      message: 'Relationship "links" must be an object'
    })
    return results
  }

  const linkKeys = Object.keys(links)
  
  // A relationship links object must contain at least one of: self, related, or pagination links
  const hasSelf = Object.prototype.hasOwnProperty.call(links, 'self')
  const hasRelated = Object.prototype.hasOwnProperty.call(links, 'related')
  const hasPagination = linkKeys.some(key => ['first', 'last', 'prev', 'next'].includes(key))

  if (!hasSelf && !hasRelated && !hasPagination) {
    results.valid = false
    results.errors.push({
      test: 'Relationship Links Content',
      context,
      message: 'Relationship links object should contain at least one of: "self", "related", or pagination links'
    })
  }

  // Validate self link if present
  if (hasSelf) {
    const selfValidation = validateLinkValue(links.self, `${context}.links.self`)
    results.details.push(...selfValidation.details)
    if (!selfValidation.valid) {
      results.valid = false
      results.errors.push(...selfValidation.errors)
    }
  }

  // Validate related link if present
  if (hasRelated) {
    const relatedValidation = validateLinkValue(links.related, `${context}.links.related`)
    results.details.push(...relatedValidation.details)
    if (!relatedValidation.valid) {
      results.valid = false
      results.errors.push(...relatedValidation.errors)
    }
  }

  // Validate pagination links for to-many relationships
  const paginationLinks = ['first', 'last', 'prev', 'next']
  for (const paginationLink of paginationLinks) {
    if (Object.prototype.hasOwnProperty.call(links, paginationLink)) {
      const paginationValidation = validateLinkValue(links[paginationLink], `${context}.links.${paginationLink}`)
      results.details.push(...paginationValidation.details)
      if (!paginationValidation.valid) {
        results.valid = false
        results.errors.push(...paginationValidation.errors)
      }
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Relationship Links Structure',
      status: 'passed',
      context,
      message: `Relationship links object contains valid link(s): ${linkKeys.join(', ')}`
    })
  }

  return results
}

/**
 * Validates a single link value (string or link object)
 * @param {any} link - The link value to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateLinkValue(link, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (link === null) {
    results.details.push({
      test: 'Link Value',
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
        test: 'Link Value',
        context,
        message: 'Link string cannot be empty'
      })
    } else {
      results.details.push({
        test: 'Link Value',
        status: 'passed',
        context,
        message: 'Link string is valid'
      })
    }
  } else if (typeof link === 'object' && !Array.isArray(link)) {
    // Link object must have href member
    if (!Object.prototype.hasOwnProperty.call(link, 'href')) {
      results.valid = false
      results.errors.push({
        test: 'Link Object Structure',
        context,
        message: 'Link object must have an "href" member'
      })
    } else if (typeof link.href !== 'string' || link.href.length === 0) {
      results.valid = false
      results.errors.push({
        test: 'Link Object Structure',
        context,
        message: 'Link object "href" must be a non-empty string'
      })
    } else {
      results.details.push({
        test: 'Link Object Structure',
        status: 'passed',
        context,
        message: 'Link object structure is valid'
      })
    }
  } else {
    results.valid = false
    results.errors.push({
      test: 'Link Value',
      context,
      message: 'Link must be a string, link object, or null'
    })
  }

  return results
}

/**
 * Validates a member name follows JSON:API naming conventions
 * @param {string} memberName - The member name to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateMemberName(memberName, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof memberName !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'Member Name Structure',
      context,
      message: 'Member name must be a string'
    })
    return results
  }

  if (memberName.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Member Name Structure',
      context,
      message: 'Member name cannot be empty'
    })
    return results
  }

  // JSON:API spec: Member names MUST contain at least one character.
  // Member names MUST contain only the allowed characters a-z, A-Z, 0-9, hyphen, and underscore.
  // Member names MUST start and end with a "globally allowed character" (a-z, A-Z, 0-9).
  const memberNamePattern = /^[a-zA-Z0-9][a-zA-Z0-9_-]*[a-zA-Z0-9]$|^[a-zA-Z0-9]$/
  
  if (!memberNamePattern.test(memberName)) {
    results.valid = false
    results.errors.push({
      test: 'Member Name Format',
      context,
      message: `Member name "${memberName}" must start and end with alphanumeric characters and contain only letters, numbers, hyphens, and underscores`
    })
    return results
  }

  // Check for reserved member names that should not be used for relationships
  const reservedNames = ['type', 'id', 'attributes', 'relationships', 'links', 'meta', 'data', 'errors', 'included', 'jsonapi']
  if (reservedNames.includes(memberName)) {
    results.valid = false
    results.errors.push({
      test: 'Member Name Reserved',
      context,
      message: `Member name "${memberName}" is reserved and should not be used for relationships`
    })
    return results
  }

  results.details.push({
    test: 'Member Name Format',
    status: 'passed',
    context,
    message: `Member name "${memberName}" follows JSON:API naming conventions`
  })

  return results
}

/**
 * Validates the 'links' member of a resource object
 * @param {any} links - The links object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateResourceLinksMember(links, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof links !== 'object' || links === null || Array.isArray(links)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Links Member',
      context,
      message: 'Resource "links" must be an object'
    })
    return results
  }

  const linkKeys = Object.keys(links)
  if (linkKeys.length === 0) {
    results.errors.push({
      test: 'Resource Links Member',
      context,
      message: 'Resource "links" object is empty - consider omitting if no links'
    })
    return results
  }

  // Resource objects commonly have a 'self' link
  let hasSelfLink = false
  let validLinks = true

  for (const linkName of linkKeys) {
    const linkValue = links[linkName]
    
    if (linkName === 'self') {
      hasSelfLink = true
    }

    // Links can be strings or objects
    if (typeof linkValue !== 'string' && (typeof linkValue !== 'object' || linkValue === null)) {
      validLinks = false
      results.errors.push({
        test: 'Resource Link Structure',
        context,
        message: `Link "${linkName}" must be a string URL or link object`
      })
    }
  }

  if (validLinks) {
    const selfMessage = hasSelfLink ? ' (includes recommended "self" link)' : ''
    results.details.push({
      test: 'Resource Links Member',
      status: 'passed',
      context,
      message: `Resource links object contains ${linkKeys.length} valid link(s)${selfMessage}`
    })
  } else {
    results.valid = false
  }

  return results
}

/**
 * Validates the 'meta' member of a resource object
 * @param {any} meta - The meta object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateMetaMember(meta, context) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Meta Member',
      context,
      message: 'Resource "meta" must be an object'
    })
    return results
  }

  const metaKeys = Object.keys(meta)
  results.details.push({
    test: 'Resource Meta Member',
    status: 'passed',
    context,
    message: `Resource meta object contains ${metaKeys.length} metadata field(s)`
  })

  return results
}

/**
 * Validates that resource object doesn't use reserved member names inappropriately
 * @param {Object} resource - The resource object to validate
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
function validateMemberNames(resource, context) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  const resourceKeys = Object.keys(resource)
  const allowedMembers = ['type', 'id', 'attributes', 'relationships', 'links', 'meta']
  
  // Check for additional members beyond the standard ones
  const additionalMembers = resourceKeys.filter(key => !allowedMembers.includes(key))
  
  if (additionalMembers.length > 0) {
    results.warnings.push({
      test: 'Resource Member Names',
      context,
      message: `Resource contains additional non-standard members: ${additionalMembers.join(', ')}. These may not be processed by JSON:API clients`
    })
  }

  results.details.push({
    test: 'Resource Member Names',
    status: 'passed',
    context,
    message: 'Resource object member names are valid'
  })

  return results
}

/**
 * Basic check if an object has the minimal structure of a resource object
 * @param {any} obj - Object to check
 * @returns {boolean} True if has basic resource object structure
 */
export function isValidResourceObject(obj) {
  return obj !== null &&
         typeof obj === 'object' &&
         !Array.isArray(obj) &&
         typeof obj.type === 'string' &&
         obj.type.length > 0 &&
         (Object.prototype.hasOwnProperty.call(obj, 'id') ? typeof obj.id === 'string' && obj.id.length > 0 : true)
}

/**
 * Validates an array of resource objects
 * @param {any[]} resources - Array of resource objects to validate
 * @param {Object} options - Validation options
 * @returns {Object} Combined validation result
 */
export function validateResourceCollection(resources, options = {}) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (!Array.isArray(resources)) {
    results.valid = false
    results.errors.push({
      test: 'Resource Collection Structure',
      message: 'Resource collection must be an array'
    })
    return results
  }

  if (resources.length === 0) {
    results.details.push({
      test: 'Resource Collection Structure',
      status: 'passed',
      message: 'Empty resource collection is valid'
    })
    return results
  }

  // Validate each resource in the collection
  for (let i = 0; i < resources.length; i++) {
    const resourceValidation = validateResourceObject(resources[i], {
      ...options,
      context: `resource[${i}]`
    })

    results.details.push(...resourceValidation.details)
    if (!resourceValidation.valid) {
      results.valid = false
      results.errors.push(...resourceValidation.errors)
    }
    if (resourceValidation.warnings) {
      results.warnings.push(...resourceValidation.warnings)
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'Resource Collection Structure',
      status: 'passed',
      message: `Resource collection contains ${resources.length} valid resource(s)`
    })
  }

  return results
}