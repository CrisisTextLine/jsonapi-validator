import { useState } from 'react'
import type { ValidationState } from '../types/validation.js'
import { exportReport, type ComprehensiveReport } from '../utils/ValidationReporter.js'

interface EnhancedResultsPanelProps {
  validationState: ValidationState
}

type StatusType = 'passed' | 'failed' | 'warning' | 'error'
type SeverityType = 'error' | 'warning' | 'info'
type ExportFormat = 'json' | 'markdown' | 'pdf'

const EnhancedResultsPanel = ({ validationState }: EnhancedResultsPanelProps) => {
  const [activeSection, setActiveSection] = useState<string | null>(null)
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false)

  if (validationState.isRunning) {
    return (
      <div className="results-panel">
        <div className="progress-indicator">
          <div className="spinner"></div>
          <span>Executing validation tests...</span>
        </div>
        <div className="results-empty">
          <p>Running comprehensive JSON:API validation suite...</p>
          <p>This includes testing document structure, resource objects, error handling, and more.</p>
        </div>
      </div>
    )
  }

  if (validationState.error) {
    return (
      <div className="results-panel">
        <div className="progress-indicator error">
          <span>❌ Validation Error</span>
        </div>
        <div style={{ padding: '20px', backgroundColor: '#ffebee', borderRadius: '4px', border: '1px solid #ffcdd2' }}>
          <h3 style={{ color: '#c62828', margin: '0 0 10px 0' }}>Error Details</h3>
          <p style={{ margin: 0, fontFamily: 'monospace', fontSize: '14px' }}>{validationState.error}</p>
        </div>
      </div>
    )
  }

  if (!validationState.results) {
    return (
      <div className="results-panel">
        <div className="results-empty">
          <p>Configure your API endpoint and click &quot;Start Validation&quot; to begin testing.</p>
          <p>The validator will run comprehensive tests against the JSON:API v1.1 specification.</p>
        </div>
      </div>
    )
  }

  const report: ComprehensiveReport = validationState.results as ComprehensiveReport
  const { metadata, summary, sections, suggestions } = report

  const getStatusIcon = (status: StatusType): string => {
    switch (status) {
      case 'passed': return '✅'
      case 'failed': return '❌'
      case 'warning': return '⚠️'
      case 'error': return '🔥'
      default: return '❓'
    }
  }

  const getStatusColor = (status: StatusType): string => {
    switch (status) {
      case 'passed': return '#4caf50'
      case 'failed': return '#f44336'
      case 'warning': return '#ff9800'
      case 'error': return '#d32f2f'
      default: return '#9e9e9e'
    }
  }

  const getSeverityColor = (severity: SeverityType): string => {
    switch (severity) {
      case 'error': return '#f44336'
      case 'warning': return '#ff9800'
      case 'info': return '#2196f3'
      default: return '#9e9e9e'
    }
  }

  const handleExport = async (format: ExportFormat): Promise<void> => {
    try {
      const exportContent = exportReport(report, format)

      if (format === 'json') {
        downloadFile(exportContent, `validation-report-${Date.now()}.json`, 'application/json')
      } else if (format === 'markdown') {
        downloadFile(exportContent, `validation-report-${Date.now()}.md`, 'text/markdown')
      } else if (format === 'pdf') {
        // For PDF, open in new window for browser's print-to-PDF
        const newWindow = window.open('', '_blank')
        if (newWindow) {
          newWindow.document.write(exportContent)
          newWindow.document.close()
        }
      }
    } catch (error) {
      console.error('Export failed:', error)
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      alert(`Export failed: ${errorMessage}`)
    }
  }

  const downloadFile = (content: string, filename: string, mimeType: string): void => {
    const blob = new Blob([content], { type: mimeType })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }

  const getSectionIcon = (_sectionName: string, sectionData: {
    tests: unknown[]
    summary: {
      total: number
      passed: number
      failed: number
      warnings: number
    }
  }): string => {
    if (sectionData.summary.failed > 0) return '❌'
    if (sectionData.summary.warnings > 0) return '⚠️'
    if (sectionData.summary.passed > 0) return '✅'
    return '➖'
  }

  return (
    <div className="results-panel">
      {/* Header with overall status */}
      <div style={{
        marginBottom: '20px',
        padding: '20px',
        background: `linear-gradient(135deg, ${getStatusColor(metadata.status)}15, ${getStatusColor(metadata.status)}05)`,
        borderRadius: '8px',
        border: `2px solid ${getStatusColor(metadata.status)}30`
      }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: '15px' }}>
          <span style={{ fontSize: '32px', marginRight: '15px' }}>
            {getStatusIcon(metadata.status)}
          </span>
          <div>
            <h2 style={{ margin: 0, color: '#333' }}>
              Validation {metadata.status.charAt(0).toUpperCase() + metadata.status.slice(1)}
            </h2>
            <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
              {metadata.method} {metadata.endpoint} • {metadata.duration}
            </p>
          </div>
        </div>

        {/* Enhanced Summary Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '15px' }}>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#2196f3' }}>{summary.total}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Tests</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{summary.passed}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Passed</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>{summary.severity.error}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Errors</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px', backgroundColor: 'rgba(255,255,255,0.7)', borderRadius: '6px' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{summary.severity.warning}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Warnings</div>
          </div>
        </div>
      </div>

      {/* Export Actions */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
        <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', color: '#333' }}>Export Report</h3>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => handleExport('json')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📄 Export JSON
          </button>
          <button
            onClick={() => handleExport('markdown')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4caf50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📝 Export Markdown
          </button>
          <button
            onClick={() => handleExport('pdf')}
            style={{
              padding: '8px 16px',
              backgroundColor: '#ff5722',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '14px'
            }}
          >
            📑 Export PDF
          </button>
        </div>
      </div>

      {/* Suggestions Section */}
      {suggestions && suggestions.length > 0 && (
        <div style={{ marginBottom: '20px' }}>
          <button
            onClick={() => setShowSuggestions(!showSuggestions)}
            style={{
              width: '100%',
              padding: '15px',
              backgroundColor: '#fff3cd',
              border: '1px solid #ffeaa7',
              borderRadius: '8px',
              cursor: 'pointer',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '16px',
              fontWeight: '600',
              color: '#856404'
            }}
          >
            <span>💡 {suggestions.length} Suggestion{suggestions.length > 1 ? 's' : ''} Available</span>
            <span>{showSuggestions ? '−' : '+'}</span>
          </button>

          {showSuggestions && (
            <div style={{ marginTop: '10px', padding: '15px', backgroundColor: 'white', border: '1px solid #ffeaa7', borderRadius: '8px' }}>
              {suggestions.map((suggestion, index) => (
                <div key={index} style={{ marginBottom: '15px', paddingBottom: '15px', borderBottom: index < suggestions.length - 1 ? '1px solid #eee' : 'none' }}>
                  <h4 style={{ margin: '0 0 8px 0', color: '#333', fontSize: '14px' }}>{suggestion.title}</h4>
                  <p style={{ margin: 0, color: '#666', fontSize: '13px', lineHeight: '1.4' }}>{suggestion.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Validation Sections */}
      <div>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Validation Results by Category</h3>

        {Object.entries(sections).map(([sectionName, sectionData]) => {
          if (sectionData.tests.length === 0) return null

          const isActive = activeSection === sectionName

          return (
            <div key={sectionName} style={{ marginBottom: '15px' }}>
              <button
                onClick={() => setActiveSection(isActive ? null : sectionName)}
                style={{
                  width: '100%',
                  padding: '15px',
                  backgroundColor: 'white',
                  border: '1px solid #ddd',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '15px',
                  fontWeight: '600',
                  color: '#333',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '20px' }}>{getSectionIcon(sectionName, sectionData)}</span>
                  <span>{sectionName}</span>
                  <div style={{ display: 'flex', gap: '8px', marginLeft: '15px' }}>
                    {sectionData.summary.passed > 0 && (
                      <span style={{ backgroundColor: '#e8f5e8', color: '#2e7d32', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {sectionData.summary.passed} passed
                      </span>
                    )}
                    {sectionData.summary.failed > 0 && (
                      <span style={{ backgroundColor: '#ffebee', color: '#c62828', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {sectionData.summary.failed} failed
                      </span>
                    )}
                    {sectionData.summary.warnings > 0 && (
                      <span style={{ backgroundColor: '#fff3e0', color: '#f57c00', padding: '2px 8px', borderRadius: '12px', fontSize: '12px' }}>
                        {sectionData.summary.warnings} warnings
                      </span>
                    )}
                  </div>
                </div>
                <span style={{ fontSize: '18px' }}>{isActive ? '−' : '+'}</span>
              </button>

              {isActive && (
                <div style={{ marginTop: '10px', padding: '15px', backgroundColor: '#f8f9fa', borderRadius: '8px' }}>
                  {sectionData.tests.map((test, testIndex) => (
                    <div
                      key={testIndex}
                      style={{
                        marginBottom: '12px',
                        padding: '12px',
                        backgroundColor: 'white',
                        borderRadius: '6px',
                        borderLeft: `4px solid ${getSeverityColor(test.severity || 'info')}`,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ marginRight: '8px', fontSize: '16px' }}>
                          {getStatusIcon(test.status)}
                        </span>
                        <span style={{
                          fontWeight: 'bold',
                          color: getSeverityColor(test.severity || 'info'),
                          textTransform: 'uppercase',
                          fontSize: '11px',
                          letterSpacing: '0.5px'
                        }}>
                          {test.severity || 'info'}
                        </span>
                        <span style={{ marginLeft: '12px', fontWeight: '600', color: '#333', fontSize: '14px' }}>
                          {test.test}
                        </span>
                      </div>

                      <div style={{ color: '#666', fontSize: '13px', lineHeight: '1.4', marginBottom: '8px' }}>
                        {test.message}
                      </div>

                      {test.location && (
                        <div style={{
                          backgroundColor: '#f5f5f5',
                          padding: '8px',
                          borderRadius: '4px',
                          fontSize: '12px',
                          fontFamily: 'monospace'
                        }}>
                          <div style={{ color: '#666', marginBottom: '4px' }}>
                            <strong>Location:</strong> {test.location.description}
                          </div>
                          <div style={{ color: '#007acc', fontWeight: 'bold' }}>
                            JSON Pointer: {test.location.jsonPointer}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Additional Information */}
      <div style={{
        marginTop: '20px',
        padding: '15px',
        backgroundColor: '#e3f2fd',
        borderRadius: '8px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        <strong>About JSON:API Validation:</strong>
        <p style={{ margin: '5px 0 0 0', lineHeight: '1.4' }}>
          This validator checks compliance with the JSON:API v1.1 specification, including document structure,
          content-type headers, resource object format, error handling, and relationship management.
          Generated at {new Date(metadata.timestamp).toLocaleString()}.
        </p>
      </div>
    </div>
  )
}

export default EnhancedResultsPanel
