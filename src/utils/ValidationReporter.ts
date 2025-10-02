/**
 * ValidationReporter.ts
 *
 * Comprehensive reporting system for JSON:API validation results
 * Provides structured reports with severity levels, location info, and export capabilities
 */

import type { ValidationTest, ValidationSummary } from '../types/validation.js'

/**
 * Severity levels for validation issues (as const for literal types)
 */
export const SEVERITY = {
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
} as const

export type SeverityLevel = typeof SEVERITY[keyof typeof SEVERITY]

/**
 * Validation categories for organizing results (as const for literal types)
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
} as const

export type CategoryName = typeof CATEGORIES[keyof typeof CATEGORIES]

/**
 * Issue suggestion interface
 */
interface IssueSuggestion {
  suggestion: string
  severity: SeverityLevel
}

/**
 * Enhanced validation test with additional metadata
 */
interface EnhancedValidationTest extends ValidationTest {
  severity?: SeverityLevel
}

/**
 * Section structure for organizing validation results
 */
interface ValidationSection {
  tests: EnhancedValidationTest[]
  summary: {
    total: number
    passed: number
    failed: number
    warnings: number
  }
}

/**
 * Severity summary structure
 */
interface SeveritySummary {
  error: number
  warning: number
  info: number
}

/**
 * Enhanced validation summary with severity breakdown
 */
interface EnhancedValidationSummary extends ValidationSummary {
  severity: SeveritySummary
}

/**
 * Overall status type
 */
type OverallStatus = 'passed' | 'failed' | 'warning' | 'error'

/**
 * Report metadata interface
 */
interface ReportMetadata {
  timestamp: string
  endpoint: string
  method: string
  duration?: string
  status: OverallStatus
}

/**
 * Suggestion object interface
 */
interface Suggestion {
  title: string
  description: string
  severity: string
}

/**
 * Export configuration interface
 */
interface ExportConfig {
  availableFormats: string[]
  generatedAt: string
}

/**
 * Comprehensive validation report interface
 */
export interface ComprehensiveReport {
  metadata: ReportMetadata
  summary: EnhancedValidationSummary
  sections: Record<string, ValidationSection>
  suggestions: Suggestion[]
  export: ExportConfig
}

/**
 * Raw validation results interface (from ValidationService)
 */
interface RawValidationResults {
  timestamp?: string
  endpoint: string
  method: string
  duration?: string
  status?: 'completed' | 'error'
  summary?: ValidationSummary
  details?: ValidationTest[]
}

/**
 * Common issue suggestions mapping
 */
const ISSUE_SUGGESTIONS: Record<string, IssueSuggestion> = {
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
 * @param rawResults - Raw validation results from ValidationService
 * @returns Enhanced report with structured sections and metadata
 */
export function createComprehensiveReport(rawResults: RawValidationResults): ComprehensiveReport {
  const details = rawResults.details || []
  const summary = rawResults.summary || { total: 0, passed: 0, failed: 0, warnings: 0 }

  const report: ComprehensiveReport = {
    metadata: {
      timestamp: rawResults.timestamp || new Date().toISOString(),
      endpoint: rawResults.endpoint,
      method: rawResults.method,
      duration: rawResults.duration,
      status: determineOverallStatus(rawResults)
    },
    summary: {
      ...summary,
      severity: categorizeBySeverity(details)
    },
    sections: organizeBySections(details),
    suggestions: generateSuggestions(details),
    export: {
      availableFormats: ['json', 'markdown', 'pdf'],
      generatedAt: new Date().toISOString()
    }
  }

  return report
}

/**
 * Determines overall validation status
 * @param results - Raw validation results
 * @returns Overall status
 */
function determineOverallStatus(results: RawValidationResults): OverallStatus {
  if (results.status === 'error') return 'error'
  if (results.summary && results.summary.failed > 0) return 'failed'
  if (results.summary && results.summary.warnings > 0) return 'warning'
  return 'passed'
}

/**
 * Categorizes results by severity level
 * @param details - Array of validation details
 * @returns Counts by severity level
 */
function categorizeBySeverity(details: ValidationTest[]): SeveritySummary {
  const severity: SeveritySummary = {
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
 * @param status - Validation status (passed, failed, warning)
 * @returns Severity level
 */
function mapStatusToSeverity(status: ValidationTest['status']): SeverityLevel {
  switch (status) {
    case 'failed': return SEVERITY.ERROR
    case 'warning': return SEVERITY.WARNING
    case 'passed': return SEVERITY.INFO
    default: return SEVERITY.INFO
  }
}

/**
 * Organizes validation results into logical sections
 * @param details - Array of validation details
 * @returns Results organized by category
 */
function organizeBySections(details: ValidationTest[]): Record<string, ValidationSection> {
  const sections: Record<string, ValidationSection> = {}

  // Initialize all categories
  Object.values(CATEGORIES).forEach(category => {
    sections[category] = {
      tests: [],
      summary: { total: 0, passed: 0, failed: 0, warnings: 0 }
    }
  })

  details.forEach(detail => {
    const category = categorizeTest(detail.test)
    const enhancedDetail = enhanceDetailWithLocation(detail)

    sections[category]?.tests.push(enhancedDetail)

    // Update section summary
    const section = sections[category]
    if (section) {
      section.summary.total++
      switch (detail.status) {
        case 'passed':
          section.summary.passed++
          break
        case 'failed':
          section.summary.failed++
          break
        case 'warning':
          section.summary.warnings++
          break
      }
    }
  })

  return sections
}

/**
 * Categorizes a test based on its name
 * @param testName - Name of the validation test
 * @returns Category name
 */
function categorizeTest(testName: string): CategoryName {
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
 * @param detail - Validation detail object
 * @returns Enhanced detail with location info
 */
function enhanceDetailWithLocation(detail: ValidationTest): EnhancedValidationTest {
  const enhanced: EnhancedValidationTest = { ...detail }

  // Add JSON Pointer path if context is available
  if (detail.location) {
    enhanced.location = {
      jsonPointer: detail.location.jsonPointer,
      description: generateLocationDescription(detail.location.jsonPointer)
    }
  }

  // Add severity level
  enhanced.severity = mapStatusToSeverity(detail.status)

  return enhanced
}

/**
 * Generates human-readable description of JSON Pointer location
 * @param pointer - JSON Pointer path
 * @returns Human-readable location description
 */
function generateLocationDescription(pointer: string): string {
  if (!pointer || pointer === '') return 'Document root'

  const parts = pointer.split('/').filter(part => part !== '')
  const descriptions: string[] = []

  parts.forEach((part) => {
    if (!isNaN(Number(part))) {
      descriptions.push(`item ${part}`)
    } else {
      descriptions.push(`"${part}" property`)
    }
  })

  return descriptions.join(' → ')
}

/**
 * Generates actionable suggestions based on validation results
 * @param details - Array of validation details
 * @returns Array of suggestion objects
 */
function generateSuggestions(details: ValidationTest[]): Suggestion[] {
  const suggestions: Suggestion[] = []
  const seenSuggestions = new Set<string>()

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
 * @param testName - Name of the failed test
 * @param message - Error message
 * @returns Suggestion object or null
 */
function findSuggestion(testName: string, message: string): Suggestion | null {
  // Try exact match first
  const exactMatch = ISSUE_SUGGESTIONS[testName]
  if (exactMatch) {
    return {
      title: testName,
      description: exactMatch.suggestion,
      severity: exactMatch.severity
    }
  }

  // Try partial match
  for (const [key, issueSuggestion] of Object.entries(ISSUE_SUGGESTIONS)) {
    if (testName.includes(key) || message.toLowerCase().includes(key.toLowerCase())) {
      return {
        title: key,
        description: issueSuggestion.suggestion,
        severity: issueSuggestion.severity
      }
    }
  }

  return null
}

/**
 * Export format type
 */
type ExportFormat = 'json' | 'markdown' | 'pdf'

/**
 * Exports validation report in specified format
 * @param report - Comprehensive validation report
 * @param format - Export format ('json', 'markdown', 'pdf')
 * @returns Exported report content
 */
export function exportReport(report: ComprehensiveReport, format: ExportFormat): string {
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
 * @param report - Validation report
 * @returns JSON string
 */
function exportAsJSON(report: ComprehensiveReport): string {
  return JSON.stringify(report, null, 2)
}

/**
 * Exports report as Markdown string
 * @param report - Validation report
 * @returns Markdown formatted string
 */
function exportAsMarkdown(report: ComprehensiveReport): string {
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
      markdown += `${suggestion.description}\n\n`
    })
  }

  return markdown
}

/**
 * Exports report as PDF (returns HTML content for PDF generation)
 * @param report - Validation report
 * @returns HTML content suitable for PDF generation
 */
function exportAsPDF(report: ComprehensiveReport): string {
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
 * @param status - Test status
 * @returns Status icon
 */
function getStatusIcon(status: ValidationTest['status']): string {
  switch (status) {
    case 'passed': return '✅'
    case 'failed': return '❌'
    case 'warning': return '⚠️'
    default: return '❓'
  }
}
