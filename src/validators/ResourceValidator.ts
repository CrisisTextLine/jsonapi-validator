/**
 * ResourceValidator.ts
 *
 * Validates JSON:API v1.1 resource object structure compliance.
 * Based on specification: https://jsonapi.org/format/1.1/#document-resource-objects
 */

import { isValidUrl, getUrlValidationError } from '../utils/UrlValidator.js'

interface ValidationError {
  test: string
  message: string
  context?: string
}

interface ValidationWarning {
  test: string
  message: string
  context?: string
}

interface ValidationDetail {
  test: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  context?: string
}

interface ValidationResult {
  valid: boolean
  errors: ValidationError[]
  warnings: ValidationWarning[]
  details: ValidationDetail[]
}

interface ResourceValidationOptions {
  allowMissingId?: boolean
  context?: string
}

/**
 * Validates a single resource object for JSON:API compliance
 * @param resource - The resource object to validate
 * @param options - Validation options
 * @returns Validation result with success/failure and details
 */
export function validateResourceObject(resource: unknown, options: ResourceValidationOptions = {}): ValidationResult {
  const { allowMissingId = false, context = 'resource' } = options
  const results: ValidationResult = {
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

  const resourceObj = resource as Record<string, unknown>

  // Step 2: Validate required 'type' member
  const typeValidation = validateTypeMember(resourceObj.type, context)
  results.details.push(...typeValidation.details)
  if (!typeValidation.valid) {
    results.valid = false
    results.errors.push(...typeValidation.errors)
  }

  // Step 3: Validate required 'id' member (unless allowMissingId is true)
  const idValidation = validateIdMember(resourceObj.id, context, allowMissingId)
  results.details.push(...idValidation.details)
  if (!idValidation.valid) {
    results.valid = false
    results.errors.push(...idValidation.errors)
  }
  if (idValidation.warnings.length > 0) {
    results.warnings.push(...idValidation.warnings)
  }

  // Step 4: Validate optional 'attributes' member
  if (Object.prototype.hasOwnProperty.call(resourceObj, 'attributes')) {
    const attributesValidation = validateAttributesMember(resourceObj.attributes, context)
    results.details.push(...attributesValidation.details)
    if (!attributesValidation.valid) {
      results.valid = false
      results.errors.push(...attributesValidation.errors)
    }
    if (attributesValidation.warnings.length > 0) {
      results.warnings.push(...attributesValidation.warnings)
    }
  }

  // Step 5: Validate optional 'relationships' member
  if (Object.prototype.hasOwnProperty.call(resourceObj, 'relationships')) {
    const relationshipsValidation = validateRelationshipsMember(resourceObj.relationships, context)
    results.details.push(...relationshipsValidation.details)
    if (!relationshipsValidation.valid) {
      results.valid = false
      results.errors.push(...relationshipsValidation.errors)
    }
  }

  // Step 6: Validate optional 'links' member
  if (Object.prototype.hasOwnProperty.call(resourceObj, 'links')) {
    const linksValidation = validateResourceLinksMember(resourceObj.links, context)
    results.details.push(...linksValidation.details)
    if (!linksValidation.valid) {
      results.valid = false
      results.errors.push(...linksValidation.errors)
    }
  }

  // Step 7: Validate optional 'meta' member
  if (Object.prototype.hasOwnProperty.call(resourceObj, 'meta')) {
    const metaValidation = validateMetaMember(resourceObj.meta, context)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
    }
  }

  // Step 8: Check for reserved/forbidden member names
  const memberValidation = validateMemberNames(resourceObj, context)
  results.details.push(...memberValidation.details)
  if (!memberValidation.valid) {
    results.valid = false
    results.errors.push(...memberValidation.errors)
  }
  if (memberValidation.warnings.length > 0) {
    results.warnings.push(...memberValidation.warnings)
  }

  return results
}

/**
 * Validates the 'type' member of a resource object
 * @param type - The type value to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateTypeMember(type: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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
  const typeValidation = validateMemberName(type, `${context}.type`)
  results.details.push(...typeValidation.details)
  if (!typeValidation.valid) {
    results.valid = false
    results.errors.push(...typeValidation.errors)
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
 * @param id - The id value to validate
 * @param context - Context for error messages
 * @param allowMissingId - Whether missing id is allowed
 * @returns Validation result
 */
function validateIdMember(id: unknown, context: string, allowMissingId: boolean): ValidationResult {
  const results: ValidationResult = {
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
 * @param attributes - The attributes object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateAttributesMember(attributes: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
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

  const attributesObj = attributes as Record<string, unknown>
  const attributeKeys = Object.keys(attributesObj)

  if (attributeKeys.length === 0) {
    results.warnings.push({
      test: 'Resource Attributes Member',
      context,
      message: 'Resource "attributes" object is empty - consider omitting if no attributes'
    })
  }

  // Validate each attribute name follows JSON:API naming conventions
  for (const attributeName of attributeKeys) {
    const nameValidation = validateMemberName(attributeName, `${context}.attributes.${attributeName}`)
    results.details.push(...nameValidation.details)
    if (!nameValidation.valid) {
      results.valid = false
      results.errors.push(...nameValidation.errors)
    }
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
    const value = attributesObj[key]
    if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
      const valueObj = value as Record<string, unknown>
      if (Object.prototype.hasOwnProperty.call(valueObj, 'data') ||
          Object.prototype.hasOwnProperty.call(valueObj, 'links') ||
          Object.prototype.hasOwnProperty.call(valueObj, 'meta')) {
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
 * @param relationships - The relationships object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateRelationshipsMember(relationships: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const relationshipsObj = relationships as Record<string, unknown>
  const relationshipKeys = Object.keys(relationshipsObj)

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

    const relationship = relationshipsObj[relationshipName]
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
 * @param relationship - The relationship object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateRelationshipObject(relationship: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const relationshipObj = relationship as Record<string, unknown>

  // A relationship object must contain at least one of: data, links, meta
  const hasData = Object.prototype.hasOwnProperty.call(relationshipObj, 'data')
  const hasLinks = Object.prototype.hasOwnProperty.call(relationshipObj, 'links')
  const hasMeta = Object.prototype.hasOwnProperty.call(relationshipObj, 'meta')

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
    const dataValidation = validateRelationshipData(relationshipObj.data, context)
    results.details.push(...dataValidation.details)
    if (!dataValidation.valid) {
      results.valid = false
      results.errors.push(...dataValidation.errors)
    }
  }

  // Validate links member if present
  if (hasLinks) {
    const linksValidation = validateRelationshipLinks(relationshipObj.links, context)
    results.details.push(...linksValidation.details)
    if (!linksValidation.valid) {
      results.valid = false
      results.errors.push(...linksValidation.errors)
    }
  }

  // Validate meta member if present
  if (hasMeta) {
    if (typeof relationshipObj.meta !== 'object' || relationshipObj.meta === null) {
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
 * @param data - The relationship data to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateRelationshipData(data: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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
 * @param identifier - The resource identifier to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateResourceIdentifier(identifier: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const identifierObj = identifier as Record<string, unknown>

  // Resource identifier must have type and id
  if (!Object.prototype.hasOwnProperty.call(identifierObj, 'type')) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier Type',
      context,
      message: 'Resource identifier must have a "type" member'
    })
  } else if (typeof identifierObj.type !== 'string' || identifierObj.type.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier Type',
      context,
      message: 'Resource identifier "type" must be a non-empty string'
    })
  }

  if (!Object.prototype.hasOwnProperty.call(identifierObj, 'id')) {
    results.valid = false
    results.errors.push({
      test: 'Resource Identifier ID',
      context,
      message: 'Resource identifier must have an "id" member'
    })
  } else if (typeof identifierObj.id !== 'string' || identifierObj.id.length === 0) {
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
      message: `Resource identifier (type: "${identifierObj.type}", id: "${identifierObj.id}") is valid`
    })
  }

  return results
}

/**
 * Validates relationship links object
 * @param links - The links object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateRelationshipLinks(links: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const linksObj = links as Record<string, unknown>
  const linkKeys = Object.keys(linksObj)

  // A relationship links object must contain at least one of: self, related, or pagination links
  const hasSelf = Object.prototype.hasOwnProperty.call(linksObj, 'self')
  const hasRelated = Object.prototype.hasOwnProperty.call(linksObj, 'related')
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
    const selfValidation = validateLinkValue(linksObj.self, `${context}.links.self`)
    results.details.push(...selfValidation.details)
    if (!selfValidation.valid) {
      results.valid = false
      results.errors.push(...selfValidation.errors)
    }
  }

  // Validate related link if present
  if (hasRelated) {
    const relatedValidation = validateLinkValue(linksObj.related, `${context}.links.related`)
    results.details.push(...relatedValidation.details)
    if (!relatedValidation.valid) {
      results.valid = false
      results.errors.push(...relatedValidation.errors)
    }
  }

  // Validate pagination links for to-many relationships
  const paginationLinks = ['first', 'last', 'prev', 'next']
  for (const paginationLink of paginationLinks) {
    if (Object.prototype.hasOwnProperty.call(linksObj, paginationLink)) {
      const paginationValidation = validateLinkValue(linksObj[paginationLink], `${context}.links.${paginationLink}`)
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
 * @param link - The link value to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateLinkValue(link: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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
      // Validate URL format
      if (!isValidUrl(link)) {
        const urlError = getUrlValidationError(link)
        results.valid = false
        results.errors.push({
          test: 'Link URL Format',
          context,
          message: urlError || 'Link URL format is invalid'
        })
      } else {
        results.details.push({
          test: 'Link Value',
          status: 'passed',
          context,
          message: 'Link string URL format is valid'
        })
      }
    }
  } else if (typeof link === 'object' && !Array.isArray(link)) {
    const linkObj = link as Record<string, unknown>

    // Link object must have href member
    if (!Object.prototype.hasOwnProperty.call(linkObj, 'href')) {
      results.valid = false
      results.errors.push({
        test: 'Link Object Structure',
        context,
        message: 'Link object must have an "href" member'
      })
    } else if (typeof linkObj.href !== 'string' || linkObj.href.length === 0) {
      results.valid = false
      results.errors.push({
        test: 'Link Object Structure',
        context,
        message: 'Link object "href" must be a non-empty string'
      })
    } else {
      // Validate href URL format
      if (!isValidUrl(linkObj.href)) {
        const urlError = getUrlValidationError(linkObj.href)
        results.valid = false
        results.errors.push({
          test: 'Link Object URL Format',
          context,
          message: urlError || 'Link object "href" URL format is invalid'
        })
      } else {
        results.details.push({
          test: 'Link Object Structure',
          status: 'passed',
          context,
          message: 'Link object "href" URL format is valid'
        })
      }
    }

    // Validate optional meta member
    if (Object.prototype.hasOwnProperty.call(linkObj, 'meta')) {
      if (typeof linkObj.meta !== 'object' || linkObj.meta === null || Array.isArray(linkObj.meta)) {
        results.valid = false
        results.errors.push({
          test: 'Link Object Meta',
          context,
          message: 'Link object "meta" must be an object'
        })
      } else {
        results.details.push({
          test: 'Link Object Meta',
          status: 'passed',
          context,
          message: 'Link object "meta" structure is valid'
        })
      }
    }

    // Check for additional members beyond href and meta
    const linkKeys = Object.keys(linkObj)
    const allowedMembers = ['href', 'meta']
    const additionalMembers = linkKeys.filter(key => !allowedMembers.includes(key))

    if (additionalMembers.length > 0) {
      results.valid = false
      results.errors.push({
        test: 'Link Object Additional Members',
        context,
        message: `Link object contains additional members not allowed: ${additionalMembers.join(', ')}. Only "href" and "meta" are allowed`
      })
    } else if (results.valid) {
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
 * @param memberName - The member name to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
export function validateMemberName(memberName: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  // JSON:API v1.1 spec: Member names MUST contain only lowercase letters (a-z),
  // digits (0-9), hyphen (-), and underscore (_) characters.
  // Member names MUST start and end with a "globally allowed character" (a-z, 0-9).
  const memberNamePattern = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/

  if (!memberNamePattern.test(memberName)) {
    results.valid = false
    results.errors.push({
      test: 'Member Name Format',
      context,
      message: `Member name "${memberName}" must start and end with lowercase letters or digits and contain only lowercase letters, digits, hyphens, and underscores`
    })
    return results
  }

  // Check for consecutive dashes or underscores (not allowed by JSON:API spec)
  if (/--/.test(memberName) || /__/.test(memberName) || /-_/.test(memberName) || /_-/.test(memberName)) {
    results.valid = false
    results.errors.push({
      test: 'Member Name Format',
      context,
      message: `Member name "${memberName}" cannot contain consecutive dashes, underscores, or mixed consecutive separators`
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
 * @param links - The links object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateResourceLinksMember(links: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const linksObj = links as Record<string, unknown>
  const linkKeys = Object.keys(linksObj)

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
  let allLinksValid = true

  for (const linkName of linkKeys) {
    const linkValue = linksObj[linkName]

    if (linkName === 'self') {
      hasSelfLink = true
    }

    // Validate each link using the comprehensive validateLinkValue function
    const linkValidation = validateLinkValue(linkValue, `${context}.links.${linkName}`)
    results.details.push(...linkValidation.details)
    if (!linkValidation.valid) {
      allLinksValid = false
      results.errors.push(...linkValidation.errors)
    }
  }

  if (allLinksValid) {
    const selfMessage = hasSelfLink ? ' (includes recommended "self" link)' : ''
    results.details.push({
      test: 'Resource Links Member',
      status: 'passed',
      context,
      message: `Resource links object contains ${linkKeys.length} valid link(s)${selfMessage}`
    })
    results.valid = true
  } else {
    results.valid = false
  }

  return results
}

/**
 * Validates the 'meta' member of a resource object
 * @param meta - The meta object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateMetaMember(meta: unknown, context: string): ValidationResult {
  const results: ValidationResult = {
    valid: true,
    errors: [],
    warnings: [],
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

  const metaObj = meta as Record<string, unknown>
  const metaKeys = Object.keys(metaObj)

  // Validate each meta member name follows JSON:API naming conventions
  for (const metaName of metaKeys) {
    const nameValidation = validateMemberName(metaName, `${context}.meta.${metaName}`)
    results.details.push(...nameValidation.details)
    if (!nameValidation.valid) {
      results.valid = false
      results.errors.push(...nameValidation.errors)
    }
  }

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
 * @param resource - The resource object to validate
 * @param context - Context for error messages
 * @returns Validation result
 */
function validateMemberNames(resource: Record<string, unknown>, context: string): ValidationResult {
  const results: ValidationResult = {
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
 * @param obj - Object to check
 * @returns True if has basic resource object structure
 */
export function isValidResourceObject(obj: unknown): boolean {
  if (obj === null || typeof obj !== 'object' || Array.isArray(obj)) {
    return false
  }

  const resourceObj = obj as Record<string, unknown>

  // Check type is a non-empty string
  if (typeof resourceObj.type !== 'string' || resourceObj.type.length === 0) {
    return false
  }

  // Check id is a non-empty string if present
  if (Object.prototype.hasOwnProperty.call(obj, 'id')) {
    if (typeof resourceObj.id !== 'string' || resourceObj.id.length === 0) {
      return false
    }
  }

  return true
}

/**
 * Validates an array of resource objects
 * @param resources - Array of resource objects to validate
 * @param options - Validation options
 * @returns Combined validation result
 */
export function validateResourceCollection(resources: unknown, options: ResourceValidationOptions = {}): ValidationResult {
  const results: ValidationResult = {
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
    if (resourceValidation.warnings.length > 0) {
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
