/**
 * Type definitions for JSON:API validation
 */

// Validation test result
export interface ValidationTest {
  test: string
  status: 'passed' | 'failed' | 'warning'
  message: string
  location?: {
    jsonPointer: string
    description: string
  }
}

// Validation category results
export interface ValidationCategory {
  category: string
  tests: ValidationTest[]
  passed: number
  failed: number
  warnings: number
}

// Overall validation summary
export interface ValidationSummary {
  total: number
  passed: number
  failed: number
  warnings: number
  severity?: {
    error: number
    warning: number
    info: number
  }
}

// Raw validation results from ValidationService
export interface RawValidationResults {
  timestamp: string
  endpoint: string
  method: string
  status: 'completed' | 'error'
  error?: string
  summary: ValidationSummary
  details: ValidationTest[]
  duration?: string
}

// Comprehensive validation report
export interface ValidationReport {
  metadata: {
    timestamp: string
    endpoint: string
    method: string
    duration?: string
    status: 'passed' | 'failed' | 'warning' | 'error'
  }
  summary: ValidationSummary
  sections: Record<string, {
    tests: ValidationTest[]
    summary: {
      total: number
      passed: number
      failed: number
      warnings: number
    }
  }>
  suggestions?: Array<{
    title: string
    description: string
    severity: string
  }>
  export?: {
    availableFormats: string[]
    generatedAt: string
  }
}

// Test configuration
export interface TestConfig {
  apiUrl: string
  httpMethod: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  authType: 'none' | 'bearer' | 'apiKey' | 'basic'
  authCredentials: {
    token?: string
    key?: string
    username?: string
    password?: string
  }
  customHeaders?: Record<string, string>
  requestBody?: string | object
}

// API Response
export interface ApiResponse {
  status: number
  statusText: string
  headers: Record<string, string>
  data?: unknown
  parseError?: string
  error?: string
}

// JSON:API Document structures
export interface JsonApiResource {
  id?: string
  type: string
  attributes?: Record<string, unknown>
  relationships?: Record<string, unknown>
  links?: Record<string, unknown>
  meta?: Record<string, unknown>
}

export interface JsonApiDocument {
  data?: JsonApiResource | JsonApiResource[] | null
  errors?: Array<{
    id?: string
    links?: Record<string, unknown>
    status?: string
    code?: string
    title?: string
    detail?: string
    source?: Record<string, unknown>
    meta?: Record<string, unknown>
  }>
  meta?: Record<string, unknown>
  jsonapi?: {
    version?: string
    ext?: string[]
    profile?: string[]
    meta?: Record<string, unknown>
  }
  links?: Record<string, unknown>
  included?: JsonApiResource[]
}

// Validation state for UI
export interface ValidationState {
  isRunning: boolean
  results: ValidationReport | null
  error: string | null
  timestamp: string | null
}
