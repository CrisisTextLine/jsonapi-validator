/**
 * UrlValidator.ts
 *
 * Utilities for validating URL formats in JSON:API links.
 * Based on specification: https://jsonapi.org/format/1.1/#document-links
 */

/**
 * Validates if a string is a valid URL format
 * @param url - The URL string to validate
 * @returns True if URL is valid format
 */
export function isValidUrl(url: unknown): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false
  }

  // First check for obviously invalid characters that shouldn't be in URLs
  const invalidChars = /[\s<>^`{|}\\]/
  if (invalidChars.test(url)) {
    return false
  }

  try {
    // Use URL constructor to validate basic URL format
    // This handles most cases including relative URLs with baseURL
    new URL(url, 'http://example.com')
    return true
  } catch {
    // If URL constructor fails, check for relative paths
    // JSON:API allows relative URLs like "/articles/1" or "articles/1"
    return isValidRelativeUrl(url)
  }
}

/**
 * Validates if a string is a valid relative URL
 * @param url - The relative URL string to validate
 * @returns True if relative URL is valid format
 */
function isValidRelativeUrl(url: string): boolean {
  if (typeof url !== 'string' || url.length === 0) {
    return false
  }

  // Check for obviously invalid characters that shouldn't be in URLs
  // Spaces, control characters, and some special characters not allowed in URLs
  const invalidChars = /[\s<>^`{|}\\]/
  if (invalidChars.test(url)) {
    return false
  }

  // Allow relative paths starting with / or not
  // Allow query parameters and fragments
  // More restrictive regex to catch invalid URLs
  const relativeUrlPattern = /^[a-zA-Z0-9._~:/?#[\]@!$&'()*+,;=%-]+$/

  return relativeUrlPattern.test(url)
}

/**
 * Gets descriptive error message for invalid URLs
 * @param url - The invalid URL
 * @returns Error message describing why URL is invalid, or null if valid
 */
export function getUrlValidationError(url: unknown): string | null {
  if (typeof url !== 'string') {
    return 'URL must be a string'
  }

  if (url.length === 0) {
    return 'URL cannot be empty'
  }

  // Check for obviously invalid characters first
  const invalidChars = /[\s<>^`{|}\\]/
  if (invalidChars.test(url)) {
    return `Invalid URL format: "${url}". URLs cannot contain spaces or special characters like <, >, ^, \`, {, }, |, or \\`
  }

  try {
    new URL(url, 'http://example.com')
    return null // URL is valid
  } catch {
    if (!isValidRelativeUrl(url)) {
      return `Invalid URL format: "${url}". URLs must be valid absolute URLs (e.g., "https://api.example.com/articles") or relative paths (e.g., "/articles", "articles/1")`
    }
    return null // Relative URL is valid
  }
}
