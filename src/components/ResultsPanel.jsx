

const ResultsPanel = ({ validationState }) => {
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

  const { results } = validationState
  const { summary, details, timestamp, endpoint, method } = results

  const getStatusIcon = (status) => {
    switch (status) {
      case 'passed': return '✅'
      case 'failed': return '❌'
      case 'warning': return '⚠️'
      default: return '❓'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'passed': return '#4caf50'
      case 'failed': return '#f44336'
      case 'warning': return '#ff9800'
      default: return '#9e9e9e'
    }
  }

  return (
    <div className="results-panel">
      {/* Summary Section */}
      <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
        <h3 style={{ margin: '0 0 10px 0', color: '#333' }}>Validation Summary</h3>
        <div style={{ fontSize: '14px', color: '#666' }}>
          <p><strong>Endpoint:</strong> {method} {endpoint}</p>
          <p><strong>Timestamp:</strong> {new Date(timestamp).toLocaleString()}</p>
        </div>
        <div style={{ display: 'flex', gap: '20px', marginTop: '15px' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#4caf50' }}>{summary.passed}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Passed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f44336' }}>{summary.failed}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Failed</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#ff9800' }}>{summary.warnings}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Warnings</div>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#333' }}>{summary.total}</div>
            <div style={{ fontSize: '12px', color: '#666' }}>Total Tests</div>
          </div>
        </div>
      </div>

      {/* Detailed Results */}
      <div>
        <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>Detailed Results</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {details.map((detail, index) => (
            <div
              key={index}
              style={{
                padding: '15px',
                borderRadius: '4px',
                border: `1px solid ${detail.status === 'passed' ? '#c8e6c9' : detail.status === 'failed' ? '#ffcdd2' : '#ffe0b2'}`,
                backgroundColor: detail.status === 'passed' ? '#f1f8e9' : detail.status === 'failed' ? '#fce4ec' : '#fff8e1'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: '8px' }}>
                <span style={{ marginRight: '10px', fontSize: '16px' }}>
                  {getStatusIcon(detail.status)}
                </span>
                <span style={{ 
                  fontWeight: 'bold', 
                  color: getStatusColor(detail.status),
                  textTransform: 'uppercase',
                  fontSize: '12px'
                }}>
                  {detail.status}
                </span>
                <span style={{ marginLeft: '15px', fontWeight: '600', color: '#333' }}>
                  {detail.test}
                </span>
              </div>
              <div style={{ color: '#666', fontSize: '14px', marginLeft: '26px' }}>
                {detail.message}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Information */}
      <div style={{ 
        marginTop: '20px', 
        padding: '15px', 
        backgroundColor: '#e3f2fd', 
        borderRadius: '4px',
        fontSize: '14px',
        color: '#1976d2'
      }}>
        <strong>About JSON:API Validation:</strong>
        <p style={{ margin: '5px 0 0 0' }}>
          This validator checks compliance with the JSON:API v1.1 specification, including document structure,
          content-type headers, resource object format, error handling, and relationship management.
        </p>
      </div>
    </div>
  )
}

export default ResultsPanel