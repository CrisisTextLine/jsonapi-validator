import React from 'react'

const TestRunner = ({ config, validationState, onStartValidation, onReset }) => {
  const [formErrors, setFormErrors] = React.useState({})

  const validateConfig = () => {
    const errors = {}
    
    // Check required fields
    if (!config.apiUrl) {
      errors.apiUrl = 'API Endpoint URL is required'
    } else {
      try {
        new URL(config.apiUrl)
      } catch {
        errors.apiUrl = 'Please enter a valid URL'
      }
    }

    // Validate authentication credentials
    if (config.authType === 'bearer' && !config.authCredentials.token) {
      errors.auth = 'Bearer token is required'
    }
    if (config.authType === 'apiKey' && !config.authCredentials.key) {
      errors.auth = 'API key is required'
    }
    if (config.authType === 'basic' && (!config.authCredentials.username || !config.authCredentials.password)) {
      errors.auth = 'Username and password are required for basic auth'
    }

    // Validate request body for methods that require it
    if (['POST', 'PUT', 'PATCH'].includes(config.httpMethod) && config.requestBody) {
      try {
        JSON.parse(config.requestBody)
      } catch {
        errors.requestBody = 'Request body must be valid JSON'
      }
    }

    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleStartValidation = () => {
    if (validateConfig()) {
      onStartValidation()
    }
  }

  const isFormValid = () => {
    return config.apiUrl && 
           (config.authType === 'none' || 
            (config.authType === 'bearer' && config.authCredentials.token) ||
            (config.authType === 'apiKey' && config.authCredentials.key) ||
            (config.authType === 'basic' && config.authCredentials.username && config.authCredentials.password))
  }

  const renderProgressIndicator = () => {
    if (validationState.isRunning) {
      return (
        <div className="progress-indicator">
          <div className="spinner"></div>
          <span>Running JSON:API validation tests...</span>
        </div>
      )
    }
    
    if (validationState.error) {
      return (
        <div className="progress-indicator error">
          <span>❌ Validation failed: {validationState.error}</span>
        </div>
      )
    }
    
    if (validationState.results) {
      const { summary } = validationState.results
      const hasFailures = summary.failed > 0
      
      return (
        <div className={`progress-indicator ${hasFailures ? 'error' : 'success'}`}>
          <span>
            {hasFailures ? '⚠️' : '✅'} Validation completed: {summary.passed} passed, {summary.failed} failed
            {summary.warnings > 0 && `, ${summary.warnings} warnings`}
          </span>
        </div>
      )
    }
    
    return null
  }

  const renderFormErrors = () => {
    if (Object.keys(formErrors).length === 0) return null
    
    return (
      <div className="progress-indicator error">
        <div>
          <strong>Please fix the following errors:</strong>
          <ul style={{ margin: '5px 0 0 20px' }}>
            {Object.values(formErrors).map((error, index) => (
              <li key={index}>{error}</li>
            ))}
          </ul>
        </div>
      </div>
    )
  }

  return (
    <div>
      {renderProgressIndicator()}
      {renderFormErrors()}
      
      <div className="button-group">
        <button
          type="button"
          className="button"
          onClick={handleStartValidation}
          disabled={validationState.isRunning || !isFormValid()}
        >
          {validationState.isRunning ? 'Validating...' : 'Start Validation'}
        </button>
        
        <button
          type="button"
          className="button secondary"
          onClick={onReset}
          disabled={validationState.isRunning}
        >
          Reset
        </button>
      </div>
    </div>
  )
}

export default TestRunner