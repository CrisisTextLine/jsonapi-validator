/**
 * ValidationReporter.js
 * 
 * Comprehensive reporting system for JSON:API validation results
 * Provides structured reports with severity levels, location info, and export capabilities
 */

/**
 * Severity levels for validation issues
 */
export const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning', 
  INFO: 'info'
}

/**
 * Validation categories for organizing results
 */
export const CATEGORIES = {
  DOCUMENT_STRUCTURE: 'Document Structure',
  RESOURCE_OBJECTS: 'Resource Objects',
  ERROR_HANDLING: 'Error Handling',
  CONTENT_TYPE: 'Content-Type Headers',
  QUERY_PARAMETERS: 'Query Parameters',
  RELATIONSHIPS: 'Relationships',
  PAGINATION: 'Pagination',
  SPARSE_FIELDSETS: 'Sparse Fieldsets',
  REQUEST_FORMAT: 'Request Format'
}

/**
 * Common issue suggestions mapping
 */
const ISSUE_SUGGESTIONS = {
  'JSON Parsing': {
    suggestion: 'Ensure the response body contains valid JSON. Check for trailing commas, unescaped quotes, or malformed objects.',
    severity: SEVERITY.ERROR
  },
  'Content-Type Header': {
    suggestion: 'JSON:API requires the "application/vnd.api+json" media type. Update your server to send the correct Content-Type header.',
    severity: SEVERITY.ERROR
  },
  'Document Structure': {
    suggestion: 'JSON:API documents must contain at least one of: "data", "errors", or "meta" at the top level.',
    severity: SEVERITY.ERROR
  },
  'Resource Type': {
    suggestion: 'All resource objects must include a "type" member that identifies the type of resource.',
    severity: SEVERITY.ERROR
  },
  'Resource ID': {
    suggestion: 'Resource objects must include an "id" member except when creating new resources.',
    severity: SEVERITY.ERROR
  },
  'Relationship Format': {
    suggestion: 'Relationships must be objects containing "links", "data", and/or "meta" members.',
    severity: SEVERITY.WARNING
  },
  'Query Parameter Format': {
    suggestion: 'Check query parameter syntax. Use proper escaping and ensure sparse fieldsets follow the format: fields[type]=field1,field2',
    severity: SEVERITY.WARNING
  },
  'Pagination Links': {
    suggestion: 'Implement pagination links (first, last, prev, next) in the links object for better API navigation.',
    severity: SEVERITY.INFO
  }
}

/**
 * Enhances raw validation results with comprehensive reporting structure
 * @param {Object} rawResults - Raw validation results from ValidationService
 * @returns {Object} Enhanced report with structured sections and metadata
 */
export function createComprehensiveReport(rawResults) {
  const report = {
    metadata: {
      timestamp: rawResults.timestamp || new Date().toISOString(),
      endpoint: rawResults.endpoint,
      method: rawResults.method,
      duration: rawResults.duration,
      status: determineOverallStatus(rawResults)
    },
    summary: {
      ...rawResults.summary,
      severity: categorizeBySeverity(rawResults.details || [])
    },
    sections: organizeBySections(rawResults.details || []),
    suggestions: generateSuggestions(rawResults.details || []),
    export: {
      availableFormats: ['json', 'markdown', 'pdf'],
      generatedAt: new Date().toISOString()
    }
  }

  return report
}

/**
 * Determines overall validation status
 * @param {Object} results - Raw validation results
 * @returns {string} Overall status
 */
function determineOverallStatus(results) {
  if (results.status === 'error') return 'error'
  if (results.summary?.failed > 0) return 'failed'
  if (results.summary?.warnings > 0) return 'warning'
  return 'passed'
}

/**
 * Categorizes results by severity level
 * @param {Array} details - Array of validation details
 * @returns {Object} Counts by severity level
 */
function categorizeBySeverity(details) {
  const severity = {
    error: 0,
    warning: 0,
    info: 0
  }

  details.forEach(detail => {
    const detailSeverity = mapStatusToSeverity(detail.status)
    severity[detailSeverity]++
  })

  return severity
}

/**
 * Maps validation status to severity level
 * @param {string} status - Validation status (passed, failed, warning)
 * @returns {string} Severity level
 */
function mapStatusToSeverity(status) {
  switch (status) {
    case 'failed': return SEVERITY.ERROR
    case 'warning': return SEVERITY.WARNING
    case 'passed': return SEVERITY.INFO
    default: return SEVERITY.INFO
  }
}

/**
 * Organizes validation results into logical sections
 * @param {Array} details - Array of validation details
 * @returns {Object} Results organized by category
 */
function organizeBySections(details) {
  const sections = {}

  // Initialize all categories
  Object.values(CATEGORIES).forEach(category => {
    sections[category] = {
      tests: [],
      summary: { passed: 0, failed: 0, warnings: 0 }
    }
  })

  details.forEach(detail => {
    const category = categorizeTest(detail.test)
    const enhancedDetail = enhanceDetailWithLocation(detail)
    
    sections[category].tests.push(enhancedDetail)
    
    // Update section summary
    switch (detail.status) {
      case 'passed':
        sections[category].summary.passed++
        break
      case 'failed':
        sections[category].summary.failed++
        break
      case 'warning':
        sections[category].summary.warnings++
        break
    }
  })

  return sections
}

/**
 * Categorizes a test based on its name
 * @param {string} testName - Name of the validation test
 * @returns {string} Category name
 */
function categorizeTest(testName) {
  const testLower = testName.toLowerCase()
  
  if (testLower.includes('content-type') || testLower.includes('header')) {
    return CATEGORIES.CONTENT_TYPE
  }
  if (testLower.includes('resource') || testLower.includes('type') || testLower.includes('id')) {
    return CATEGORIES.RESOURCE_OBJECTS
  }
  if (testLower.includes('error') || testLower.includes('status')) {
    return CATEGORIES.ERROR_HANDLING
  }
  if (testLower.includes('relationship')) {
    return CATEGORIES.RELATIONSHIPS
  }
  if (testLower.includes('query') || testLower.includes('parameter')) {
    return CATEGORIES.QUERY_PARAMETERS
  }
  if (testLower.includes('pagination') || testLower.includes('page')) {
    return CATEGORIES.PAGINATION
  }
  if (testLower.includes('fieldset') || testLower.includes('sparse')) {
    return CATEGORIES.SPARSE_FIELDSETS
  }
  if (testLower.includes('document') || testLower.includes('json') || testLower.includes('parsing')) {
    return CATEGORIES.DOCUMENT_STRUCTURE
  }
  
  return CATEGORIES.REQUEST_FORMAT
}

/**
 * Enhances validation detail with location information
 * @param {Object} detail - Validation detail object
 * @returns {Object} Enhanced detail with location info
 */
function enhanceDetailWithLocation(detail) {
  const enhanced = { ...detail }
  
  // Add JSON Pointer path if context is available
  if (detail.context) {
    enhanced.location = {
      jsonPointer: detail.context,
      description: generateLocationDescription(detail.context)
    }
  }

  // Add severity level
  enhanced.severity = mapStatusToSeverity(detail.status)
  
  return enhanced
}

/**
 * Generates human-readable description of JSON Pointer location
 * @param {string} pointer - JSON Pointer path
 * @returns {string} Human-readable location description
 */
function generateLocationDescription(pointer) {
  if (!pointer || pointer === '') return 'Document root'
  
  const parts = pointer.split('/').filter(part => part !== '')
  const descriptions = []
  
  parts.forEach((part) => {
    if (!isNaN(part)) {
      descriptions.push(`item ${part}`)
    } else {
      descriptions.push(`"${part}" property`)
    }
  })
  
  return descriptions.join(' → ')
}

/**
 * Generates actionable suggestions based on validation results
 * @param {Array} details - Array of validation details
 * @returns {Array} Array of suggestion objects
 */
function generateSuggestions(details) {
  const suggestions = []
  const seenSuggestions = new Set()
  
  details.forEach(detail => {
    if (detail.status === 'failed') {
      const suggestion = findSuggestion(detail.test, detail.message)
      if (suggestion && !seenSuggestions.has(suggestion.title)) {
        suggestions.push(suggestion)
        seenSuggestions.add(suggestion.title)
      }
    }
  })
  
  return suggestions
}

/**
 * Finds relevant suggestion for a validation issue
 * @param {string} testName - Name of the failed test
 * @param {string} message - Error message
 * @returns {Object|null} Suggestion object or null
 */
function findSuggestion(testName, message) {
  // Try exact match first
  if (ISSUE_SUGGESTIONS[testName]) {
    return {
      title: testName,
      ...ISSUE_SUGGESTIONS[testName]
    }
  }
  
  // Try partial match
  for (const [key, suggestion] of Object.entries(ISSUE_SUGGESTIONS)) {
    if (testName.includes(key) || message.toLowerCase().includes(key.toLowerCase())) {
      return {
        title: key,
        ...suggestion
      }
    }
  }
  
  return null
}

/**
 * Exports validation report in specified format
 * @param {Object} report - Comprehensive validation report
 * @param {string} format - Export format ('json', 'markdown', 'pdf')
 * @returns {string|Blob} Exported report content
 */
export function exportReport(report, format) {
  switch (format.toLowerCase()) {
    case 'json':
      return exportAsJSON(report)
    case 'markdown':
      return exportAsMarkdown(report)
    case 'pdf':
      return exportAsPDF(report)
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }
}

/**
 * Exports report as JSON string
 * @param {Object} report - Validation report
 * @returns {string} JSON string
 */
function exportAsJSON(report) {
  return JSON.stringify(report, null, 2)
}

/**
 * Exports report as Markdown string
 * @param {Object} report - Validation report
 * @returns {string} Markdown formatted string
 */
function exportAsMarkdown(report) {
  let markdown = `# JSON:API Validation Report\n\n`
  
  // Metadata section
  markdown += `## Test Information\n\n`
  markdown += `- **Endpoint**: ${report.metadata.method} ${report.metadata.endpoint}\n`
  markdown += `- **Timestamp**: ${new Date(report.metadata.timestamp).toLocaleString()}\n`
  markdown += `- **Duration**: ${report.metadata.duration}\n`
  markdown += `- **Status**: ${report.metadata.status.toUpperCase()}\n\n`
  
  // Summary section
  markdown += `## Summary\n\n`
  markdown += `| Metric | Count |\n`
  markdown += `|--------|-------|\n`
  markdown += `| Total Tests | ${report.summary.total} |\n`
  markdown += `| Passed | ${report.summary.passed} |\n`
  markdown += `| Failed | ${report.summary.failed} |\n`
  markdown += `| Warnings | ${report.summary.warnings} |\n`
  markdown += `| Errors | ${report.summary.severity.error} |\n\n`
  
  // Sections
  Object.entries(report.sections).forEach(([category, section]) => {
    if (section.tests.length > 0) {
      markdown += `## ${category}\n\n`
      
      section.tests.forEach(test => {
        const icon = getStatusIcon(test.status)
        markdown += `### ${icon} ${test.test}\n\n`
        markdown += `**Status**: ${test.status.toUpperCase()}\n\n`
        markdown += `**Message**: ${test.message}\n\n`
        
        if (test.location) {
          markdown += `**Location**: ${test.location.description} (\`${test.location.jsonPointer}\`)\n\n`
        }
      })
    }
  })
  
  // Suggestions section
  if (report.suggestions.length > 0) {
    markdown += `## Suggestions\n\n`
    report.suggestions.forEach(suggestion => {
      markdown += `### ${suggestion.title}\n\n`
      markdown += `${suggestion.suggestion}\n\n`
    })
  }
  
  return markdown
}

/**
 * Exports report as PDF (returns HTML content for PDF generation)
 * @param {Object} report - Validation report
 * @returns {string} HTML content suitable for PDF generation
 */
function exportAsPDF(report) {
  // For now, return HTML that can be converted to PDF by the browser
  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>JSON:API Validation Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .header { background: #f5f5f5; padding: 15px; border-radius: 5px; }
    .summary { display: flex; gap: 20px; margin: 20px 0; }
    .metric { text-align: center; padding: 10px; border: 1px solid #ddd; border-radius: 5px; }
    .section { margin: 20px 0; }
    .test { margin: 10px 0; padding: 10px; border-left: 3px solid #ddd; }
    .passed { border-left-color: #4caf50; }
    .failed { border-left-color: #f44336; }
    .warning { border-left-color: #ff9800; }
    .location { font-family: monospace; background: #f9f9f9; padding: 5px; border-radius: 3px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>JSON:API Validation Report</h1>
    <p><strong>Endpoint:</strong> ${report.metadata.method} ${report.metadata.endpoint}</p>
    <p><strong>Generated:</strong> ${new Date(report.metadata.timestamp).toLocaleString()}</p>
    <p><strong>Duration:</strong> ${report.metadata.duration}</p>
  </div>
  
  <div class="summary">
    <div class="metric">
      <h3>${report.summary.total}</h3>
      <p>Total Tests</p>
    </div>
    <div class="metric">
      <h3>${report.summary.passed}</h3>
      <p>Passed</p>
    </div>
    <div class="metric">
      <h3>${report.summary.failed}</h3>
      <p>Failed</p>
    </div>
    <div class="metric">
      <h3>${report.summary.warnings}</h3>
      <p>Warnings</p>
    </div>
  </div>
`

  // Add sections
  Object.entries(report.sections).forEach(([category, section]) => {
    if (section.tests.length > 0) {
      html += `<div class="section"><h2>${category}</h2>`
      
      section.tests.forEach(test => {
        html += `<div class="test ${test.status}">
          <h3>${test.test}</h3>
          <p><strong>Status:</strong> ${test.status.toUpperCase()}</p>
          <p><strong>Message:</strong> ${test.message}</p>
          ${test.location ? `<p><strong>Location:</strong> <span class="location">${test.location.jsonPointer}</span> - ${test.location.description}</p>` : ''}
        </div>`
      })
      
      html += `</div>`
    }
  })

  html += `</body></html>`
  return html
}

/**
 * Gets status icon for display
 * @param {string} status - Test status
 * @returns {string} Status icon
 */
function getStatusIcon(status) {
  switch (status) {
    case 'passed': return '✅'
    case 'failed': return '❌'
    case 'warning': return '⚠️'
    default: return '❓'
  }
}