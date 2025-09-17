/**
 * JsonApiObjectValidator.js
 * 
 * Validates JSON:API object extensions and profiles.
 * Based on specification: https://jsonapi.org/format/1.1/#document-jsonapi-object
 */

import { validateMemberName } from './ResourceValidator.js'
import { isValidUrl } from '../utils/UrlValidator.js'

/**
 * Validates JSON:API object with extension and profile support
 * @param {any} jsonapi - The jsonapi object to validate
 * @returns {Object} Validation result with success/failure and details
 */
export function validateJsonApiObjectExtended(jsonapi) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (typeof jsonapi !== 'object' || jsonapi === null || Array.isArray(jsonapi)) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Object Structure',
      message: 'JSON:API object must be an object'
    })
    return results
  }

  // Check for known members
  const knownMembers = ['version', 'meta', 'ext', 'profile']
  const presentMembers = Object.keys(jsonapi)
  const unknownMembers = presentMembers.filter(member => !knownMembers.includes(member))

  // Validate version member
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'version')) {
    const versionValidation = validateVersionMember(jsonapi.version)
    results.details.push(...versionValidation.details)
    if (!versionValidation.valid) {
      results.valid = false
      results.errors.push(...versionValidation.errors)
    }
  }

  // Validate meta member  
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'meta')) {
    const metaValidation = validateJsonApiMeta(jsonapi.meta)
    results.details.push(...metaValidation.details)
    if (!metaValidation.valid) {
      results.valid = false
      results.errors.push(...metaValidation.errors)
    }
  }

  // Validate ext member (extensions)
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'ext')) {
    const extValidation = validateExtensionsMember(jsonapi.ext)
    results.details.push(...extValidation.details)
    if (!extValidation.valid) {
      results.valid = false
      results.errors.push(...extValidation.errors)
    }
    if (extValidation.warnings) {
      results.warnings.push(...extValidation.warnings)
    }
  }

  // Validate profile member
  if (Object.prototype.hasOwnProperty.call(jsonapi, 'profile')) {
    const profileValidation = validateProfileMember(jsonapi.profile)
    results.details.push(...profileValidation.details)
    if (!profileValidation.valid) {
      results.valid = false
      results.errors.push(...profileValidation.errors)
    }
  }

  // Handle unknown members (potential extensions)
  if (unknownMembers.length > 0) {
    results.warnings.push({
      test: 'JSON:API Object Extensions',
      message: `JSON:API object contains unknown members: ${unknownMembers.join(', ')}. These may be custom extensions.`
    })

    // Validate unknown member names follow conventions
    for (const memberName of unknownMembers) {
      const nameValidation = validateMemberName(memberName, `jsonapi.${memberName}`)
      if (!nameValidation.valid) {
        results.valid = false
        results.errors.push(...nameValidation.errors.map(error => ({
          ...error,
          test: 'JSON:API Object Extension Names'
        })))
      }
    }
  }

  if (results.valid) {
    results.details.push({
      test: 'JSON:API Object Structure',
      status: 'passed',
      message: `Valid JSON:API object with ${presentMembers.length} member(s)`
    })
  }

  return results
}

/**
 * Validates the version member of a JSON:API object
 * @param {any} version - The version value to validate
 * @returns {Object} Validation result
 */
function validateVersionMember(version) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof version !== 'string') {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Version Member',
      message: 'JSON:API version must be a string'
    })
    return results
  }

  if (version.length === 0) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Version Member',
      message: 'JSON:API version cannot be empty string'
    })
    return results
  }

  // Validate supported version values
  const supportedVersions = ['1.0', '1.1']
  if (!supportedVersions.includes(version)) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Version Value',
      message: `JSON:API version "${version}" is not supported. Supported versions: ${supportedVersions.join(', ')}`
    })
  } else {
    results.details.push({
      test: 'JSON:API Version Value',
      status: 'passed',
      message: `JSON:API version "${version}" is supported`
    })
  }

  return results
}

/**
 * Validates the meta member of a JSON:API object
 * @param {any} meta - The meta value to validate
 * @returns {Object} Validation result
 */
function validateJsonApiMeta(meta) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof meta !== 'object' || meta === null || Array.isArray(meta)) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Meta Member',
      message: 'JSON:API meta must be an object'
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
 * Validates the ext member (extensions) of a JSON:API object
 * @param {any} ext - The ext value to validate
 * @returns {Object} Validation result
 */
function validateExtensionsMember(ext) {
  const results = {
    valid: true,
    errors: [],
    warnings: [],
    details: []
  }

  if (typeof ext !== 'object' || ext === null || Array.isArray(ext)) {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Extensions Member',
      message: 'JSON:API ext must be an object'
    })
    return results
  }

  const extensionNames = Object.keys(ext)
  
  if (extensionNames.length === 0) {
    results.warnings.push({
      test: 'JSON:API Extensions Member',
      message: 'JSON:API ext object is empty'
    })
    return results
  }

  // Validate each extension
  for (const extensionName of extensionNames) {
    const extensionValue = ext[extensionName]
    
    // Validate extension name format
    if (!isValidExtensionName(extensionName)) {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Extension Name',
        message: `Invalid extension name "${extensionName}". Extension names should be URLs or follow naming conventions.`
      })
      continue
    }

    // Validate extension value
    if (typeof extensionValue !== 'string' && typeof extensionValue !== 'object') {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Extension Value',
        message: `Extension "${extensionName}" must have a string or object value`
      })
      continue
    }

    // If extension value is a URL string, validate it
    if (typeof extensionValue === 'string' && !isValidUrl(extensionValue)) {
      results.warnings.push({
        test: 'JSON:API Extension Value',
        message: `Extension "${extensionName}" value appears to be a malformed URL`
      })
    }

    results.details.push({
      test: 'JSON:API Extension Validation',
      status: 'passed',
      message: `Extension "${extensionName}" is valid`
    })
  }

  results.details.push({
    test: 'JSON:API Extensions Member',
    status: 'passed',
    message: `JSON:API extensions object contains ${extensionNames.length} extension(s)`
  })

  return results
}

/**
 * Validates the profile member of a JSON:API object
 * @param {any} profile - The profile value to validate
 * @returns {Object} Validation result
 */
function validateProfileMember(profile) {
  const results = {
    valid: true,
    errors: [],
    details: []
  }

  if (typeof profile === 'string') {
    // Single profile URL
    if (!isValidUrl(profile)) {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Profile Member',
        message: 'JSON:API profile must be a valid URL'
      })
    } else {
      results.details.push({
        test: 'JSON:API Profile Member',
        status: 'passed',
        message: `JSON:API profile URL is valid: ${profile}`
      })
    }
  } else if (Array.isArray(profile)) {
    // Array of profile URLs
    if (profile.length === 0) {
      results.valid = false
      results.errors.push({
        test: 'JSON:API Profile Member',
        message: 'JSON:API profile array cannot be empty'
      })
      return results
    }

    let allValid = true
    profile.forEach((profileUrl, index) => {
      if (typeof profileUrl !== 'string' || !isValidUrl(profileUrl)) {
        allValid = false
        results.valid = false
        results.errors.push({
          test: 'JSON:API Profile Member',
          message: `JSON:API profile[${index}] must be a valid URL`
        })
      }
    })

    if (allValid) {
      results.details.push({
        test: 'JSON:API Profile Member',
        status: 'passed',
        message: `JSON:API profile array contains ${profile.length} valid URL(s)`
      })
    }
  } else {
    results.valid = false
    results.errors.push({
      test: 'JSON:API Profile Member',
      message: 'JSON:API profile must be a string URL or array of URLs'
    })
  }

  return results
}

/**
 * Validates if a string is a valid extension name
 * @param {string} name - Extension name to validate
 * @returns {boolean} True if valid extension name
 */
function isValidExtensionName(name) {
  if (typeof name !== 'string' || name.length === 0) {
    return false
  }

  // Extension names can be:
  // 1. URLs (most common)
  // 2. Reverse domain notation (com.example.extension)
  // 3. Simple names following JSON:API member naming rules

  // Check if it's a URL
  if (isValidUrl(name)) {
    return true
  }

  // Check if it's reverse domain notation
  if (/^[a-z0-9]+(\.[a-z0-9]+)*\.[a-z]+$/.test(name)) {
    return true
  }

  // Check if it follows JSON:API member naming rules
  const memberNamePattern = /^[a-z0-9][a-z0-9_-]*[a-z0-9]$|^[a-z0-9]$/
  return memberNamePattern.test(name)
}